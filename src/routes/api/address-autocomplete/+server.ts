import { json } from '@sveltejs/kit';

// Try to get API key from environment
// In production, use process.env, in dev use import.meta.env
const ORS_API_KEY =
	(typeof process !== 'undefined' && process.env.ORS_API_KEY) ||
	(typeof process !== 'undefined' && process.env.VITE_ORS_API_KEY) ||
	(typeof import.meta !== 'undefined' && import.meta.env?.VITE_ORS_API_KEY) ||
	'';

// Debounce cache to prevent duplicate requests
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function GET({ url }: { url: URL }) {
	const query = url.searchParams.get('q');

	if (!query || query.length < 3) {
		return json({ suggestions: [], error: 'Query must be at least 3 characters' });
	}

	// Check if API key is configured
	if (!ORS_API_KEY) {
		console.error('ORS_API_KEY not configured');
		return json(
			{
				success: false,
				suggestions: [],
				error: 'Address search service not configured'
			},
			{ status: 500 }
		);
	}

	// Check cache first
	const cached = requestCache.get(query);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return json(cached.data);
	}

	try {
		// OpenRouteService Pelias Autocomplete API
		// Using Nigeria focus and bounding box for better local results
		const autocompleteUrl = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&focus.point.lat=9.0765&focus.point.lon=7.3986&boundary.country=NGA&size=10`;

		console.log('Fetching from ORS API:', autocompleteUrl.replace(ORS_API_KEY, '***'));

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

		const response = await fetch(autocompleteUrl, {
			headers: {
				Accept: 'application/json'
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('ORS API error:', response.status, errorText);
			throw new Error(`API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		console.log('ORS API response features:', data.features?.length || 0);

		// Format suggestions like Glovo/Bolt
		const suggestions =
			data.features?.map((feature: any) => {
				const props = feature.properties;

				// Build formatted address
				let formattedAddress = props.label || '';

				// Extract confidence score
				const confidence = props.confidence || 0;

				// Extract coordinates
				const coords = feature.geometry?.coordinates;

				return {
					id: feature.properties.id || Math.random().toString(36).substr(2, 9),
					label: formattedAddress,
					name: props.name || '',
					street: props.street || '',
					locality: props.locality || props.neighbourhood || '',
					region: props.region || '',
					country: props.country || 'Nigeria',
					confidence: confidence,
					coordinates: coords ? { lng: coords[0], lat: coords[1] } : null,
					layer: props.layer || 'address' // type: address, street, venue, etc.
				};
			}) || [];

		const result = {
			success: true,
			suggestions: suggestions.filter((s: any) => s.label), // Only return items with labels
			query: query
		};

		// Cache the result
		requestCache.set(query, { data: result, timestamp: Date.now() });

		return json(result);
	} catch (err: any) {
		console.error('Autocomplete error:', err);

		if (err.name === 'AbortError') {
			return json(
				{
					success: false,
					suggestions: [],
					error: 'Request timed out. Please try again.'
				},
				{ status: 504 }
			);
		}

		return json(
			{
				success: false,
				suggestions: [],
				error: 'Failed to fetch suggestions',
				details: err.message || String(err)
			},
			{ status: 500 }
		);
	}
}
