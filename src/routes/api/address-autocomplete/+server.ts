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

// Fallback addresses for when API is unavailable
function getFallbackAddresses(query: string) {
	const q = query.toLowerCase();

	// Common areas in Calabar (Cross River State)
	const calabarAddresses = [
		{
			label: 'Marian Road, Calabar, Cross River',
			name: 'Marian Road',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.369, lat: 4.958 }
		},
		{
			label: 'Ekpo Abasi Street, Calabar, Cross River',
			name: 'Ekpo Abasi Street',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.357, lat: 4.951 }
		},
		{
			label: 'Goldie Street, Calabar, Cross River',
			name: 'Goldie Street',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.367, lat: 4.953 }
		},
		{
			label: 'Ndidem Usang Iso Road, Calabar, Cross River',
			name: 'Ndidem Usang Iso Road',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.375, lat: 4.961 }
		},
		{
			label: 'Ayade Road, Calabar, Cross River',
			name: 'Ayade Road',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.381, lat: 4.967 }
		},
		{
			label: 'Ibb Way, Calabar, Cross River',
			name: 'Ibb Way',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.385, lat: 4.972 }
		},
		{
			label: 'Taxi Rank, Calabar, Cross River',
			name: 'Taxi Rank',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.362, lat: 4.949 }
		},
		{
			label: 'University of Calabar, Calabar, Cross River',
			name: 'University of Calabar',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.331, lat: 4.973 }
		},
		{
			label: 'Talbot Street, Calabar, Cross River',
			name: 'Talbot Street',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.359, lat: 4.951 }
		},
		{
			label: 'Eko Akande Close, Calabar, Cross River',
			name: 'Eko Akande Close',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.378, lat: 4.965 }
		},
		{
			label: 'Anas Road, Calabar, Cross River',
			name: 'Anas Road',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.372, lat: 4.959 }
		},
		{
			label: 'Offiong Street, Calabar, Cross River',
			name: 'Offiong Street',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.365, lat: 4.955 }
		},
		{
			label: ' Henshaw Street, Calabar, Cross River',
			name: ' Henshaw Street',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.358, lat: 4.95 }
		},
		{
			label: 'Atu Street, Calabar, Cross River',
			name: 'Atu Street',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.361, lat: 4.952 }
		},
		{
			label: 'Maccabi Street, Calabar, Cross River',
			name: 'Maccabi Street',
			locality: 'Calabar',
			region: 'Cross River',
			coordinates: { lng: 8.37, lat: 4.956 }
		}
	];

	// Common areas in Abuja
	const abujaAddresses = [
		{
			label: 'Central Business District, Abuja',
			name: 'Central Business District',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.476, lat: 9.057 }
		},
		{
			label: 'walGwagada, Abuja',
			name: 'Gwagwalada',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.084, lat: 8.943 }
		},
		{
			label: 'Wuse, Abuja',
			name: 'Wuse',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.482, lat: 9.074 }
		},
		{
			label: 'Maitama, Abuja',
			name: 'Maitama',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.501, lat: 9.083 }
		},
		{
			label: 'Asokoro, Abuja',
			name: 'Asokoro',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.492, lat: 9.046 }
		},
		{
			label: 'Gwarinpa, Abuja',
			name: 'Gwarinpa',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.448, lat: 9.093 }
		},
		{
			label: 'Jabi, Abuja',
			name: 'Jabi',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.457, lat: 9.062 }
		},
		{
			label: 'Kubwa, Abuja',
			name: 'Kubwa',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.334, lat: 9.149 }
		},
		{
			label: 'Zuba, Abuja',
			name: 'Zuba',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.241, lat: 9.041 }
		},
		{
			label: 'Karu, Abuja',
			name: 'Karu',
			locality: 'Abuja',
			region: 'FCT',
			coordinates: { lng: 7.685, lat: 9.025 }
		}
	];

	const allAddresses = [...calabarAddresses, ...abujaAddresses];

	// Filter by query
	const filtered = allAddresses.filter(
		(addr) =>
			addr.label.toLowerCase().includes(q) ||
			addr.name.toLowerCase().includes(q) ||
			addr.locality.toLowerCase().includes(q)
	);

	// If no matches, return all addresses (limited to 10)
	const results = filtered.length > 0 ? filtered.slice(0, 10) : allAddresses.slice(0, 10);

	return results.map((addr, index) => ({
		id: `fallback-${index}`,
		label: addr.label,
		name: addr.name,
		street: addr.name,
		locality: addr.locality,
		region: addr.region,
		country: 'Nigeria',
		confidence: 0.8,
		coordinates: addr.coordinates,
		layer: 'address'
	}));
}

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
		// Fallback to hardcoded Calabar addresses if API fails
		if (!ORS_API_KEY || ORS_API_KEY === 'your_key_here') {
			console.log('No API key, using fallback addresses');
			const fallbackSuggestions = getFallbackAddresses(query);
			return json({
				success: true,
				suggestions: fallbackSuggestions,
				query: query,
				fallback: true
			});
		}

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

		if (response.status === 403) {
			console.error('ORS API access denied (403). Using fallback.');
			const fallbackSuggestions = getFallbackAddresses(query);
			return json({
				success: true,
				suggestions: fallbackSuggestions,
				query: query,
				fallback: true
			});
		}

		if (!response.ok) {
			const errorText = await response.text();
			console.error('ORS API error:', response.status, errorText);
			const fallbackSuggestions = getFallbackAddresses(query);
			return json({
				success: true,
				suggestions: fallbackSuggestions,
				query: query,
				fallback: true
			});
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
