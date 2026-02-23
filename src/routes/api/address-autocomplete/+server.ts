import { json } from '@sveltejs/kit';

// Nominatim API (OpenStreetMap) - Free and works well for Nigeria
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Debounce cache to prevent duplicate requests
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

// Expanded fallback addresses for major Nigerian cities
function getFallbackAddresses(query: string) {
	const q = query.toLowerCase();

	const nigerianAddresses = [
		// Lagos
		{
			label: 'Victoria Island, Lagos',
			locality: 'Lagos',
			region: 'Lagos',
			coords: { lat: 6.4281, lng: 3.4219 }
		},
		{
			label: 'Ikoyi, Lagos',
			locality: 'Lagos',
			region: 'Lagos',
			coords: { lat: 6.4505, lng: 3.4383 }
		},
		{
			label: 'Lekki, Lagos',
			locality: 'Lagos',
			region: 'Lagos',
			coords: { lat: 6.4476, lng: 4.0906 }
		},
		{
			label: 'Ikeja, Lagos',
			locality: 'Lagos',
			region: 'Lagos',
			coords: { lat: 6.5965, lng: 3.3425 }
		},
		{
			label: 'Surulere, Lagos',
			locality: 'Lagos',
			region: 'Lagos',
			coords: { lat: 6.4932, lng: 3.3616 }
		},
		{
			label: 'Yaba, Lagos',
			locality: 'Lagos',
			region: 'Lagos',
			coords: { lat: 6.5074, lng: 3.3699 }
		},
		{
			label: 'Ajah, Lagos',
			locality: 'Lagos',
			region: 'Lagos',
			coords: { lat: 6.4679, lng: 3.5808 }
		},
		{
			label: 'Oshodi, Lagos',
			locality: 'Lagos',
			region: 'Lagos',
			coords: { lat: 6.5453, lng: 3.3324 }
		},
		{
			label: 'Abeokuta, Ogun',
			locality: 'Abeokuta',
			region: 'Ogun',
			coords: { lat: 7.1475, lng: 3.3617 }
		},
		{
			label: 'Sango Ota, Ogun',
			locality: 'Ota',
			region: 'Ogun',
			coords: { lat: 6.6935, lng: 3.2335 }
		},

		// Abuja
		{
			label: 'Central Business District, Abuja',
			locality: 'Abuja',
			region: 'FCT',
			coords: { lat: 9.0579, lng: 7.4951 }
		},
		{
			label: 'Gwagwalada, Abuja',
			locality: 'Abuja',
			region: 'FCT',
			coords: { lat: 8.9425, lng: 7.0838 }
		},
		{
			label: 'Wuse 2, Abuja',
			locality: 'Abuja',
			region: 'FCT',
			coords: { lat: 9.0742, lng: 7.4821 }
		},
		{
			label: 'Maitama, Abuja',
			locality: 'Abuja',
			region: 'FCT',
			coords: { lat: 9.0832, lng: 7.5011 }
		},
		{
			label: 'Asokoro, Abuja',
			locality: 'Abuja',
			region: 'FCT',
			coords: { lat: 9.0464, lng: 7.4917 }
		},
		{
			label: 'Gwarinpa, Abuja',
			locality: 'Abuja',
			region: 'FCT',
			coords: { lat: 9.0929, lng: 7.4482 }
		},
		{ label: 'Jabi, Abuja', locality: 'Abuja', region: 'FCT', coords: { lat: 9.062, lng: 7.4568 } },
		{
			label: 'Kubwa, Abuja',
			locality: 'Abuja',
			region: 'FCT',
			coords: { lat: 9.1492, lng: 7.3339 }
		},

		// Port Harcourt
		{
			label: 'GRA, Port Harcourt',
			locality: 'Port Harcourt',
			region: 'Rivers',
			coords: { lat: 4.7774, lng: 7.0134 }
		},
		{
			label: 'Old GRA, Port Harcourt',
			locality: 'Port Harcourt',
			region: 'Rivers',
			coords: { lat: 4.7847, lng: 7.0323 }
		},
		{
			label: 'Elekahia, Port Harcourt',
			locality: 'Port Harcourt',
			region: 'Rivers',
			coords: { lat: 4.7687, lng: 7.0531 }
		},
		{
			label: 'D-Line, Port Harcourt',
			locality: 'Port Harcourt',
			region: 'Rivers',
			coords: { lat: 4.7512, lng: 7.0374 }
		},

		// Calabar
		{
			label: 'Marian Road, Calabar',
			locality: 'Calabar',
			region: 'Cross River',
			coords: { lat: 4.958, lng: 8.369 }
		},
		{
			label: 'Ekpo Abasi Street, Calabar',
			locality: 'Calabar',
			region: 'Cross River',
			coords: { lat: 4.951, lng: 8.357 }
		},
		{
			label: 'Goldie Street, Calabar',
			locality: 'Calabar',
			region: 'Cross River',
			coords: { lat: 4.953, lng: 8.367 }
		},
		{
			label: 'Ayade Road, Calabar',
			locality: 'Calabar',
			region: 'Cross River',
			coords: { lat: 4.967, lng: 8.381 }
		},
		{
			label: 'University of Calabar, Calabar',
			locality: 'Calabar',
			region: 'Cross River',
			coords: { lat: 4.973, lng: 8.331 }
		},

		// Benin City
		{
			label: 'Ring Road, Benin City',
			locality: 'Benin City',
			region: 'Edo',
			coords: { lat: 6.335, lng: 5.625 }
		},
		{
			label: 'GRA, Benin City',
			locality: 'Benin City',
			region: 'Edo',
			coords: { lat: 6.3528, lng: 5.6115 }
		},
		{
			label: 'Ugbowo, Benin City',
			locality: 'Benin City',
			region: 'Edo',
			coords: { lat: 6.3895, lng: 5.5918 }
		},

		// Ibadan
		{
			label: 'Bodija, Ibadan',
			locality: 'Ibadan',
			region: 'Oyo',
			coords: { lat: 7.4535, lng: 3.945 }
		},
		{
			label: ' Jericho, Ibadan',
			locality: 'Ibadan',
			region: 'Oyo',
			coords: { lat: 7.4479, lng: 3.912 }
		},
		{
			label: ' Dugbe, Ibadan',
			locality: 'Ibadan',
			region: 'Oyo',
			coords: { lat: 7.3864, lng: 3.9477 }
		},
		{
			label: 'Orire, Ibadan',
			locality: 'Ibadan',
			region: 'Oyo',
			coords: { lat: 7.4107, lng: 3.9853 }
		},

		// Kano
		{
			label: 'Kano City, Kano',
			locality: 'Kano',
			region: 'Kano',
			coords: { lat: 12.0022, lng: 8.5919 }
		},
		{
			label: 'Kano GRA, Kano',
			locality: 'Kano',
			region: 'Kano',
			coords: { lat: 12.0212, lng: 8.5325 }
		},
		{
			label: 'Sabon Gari, Kano',
			locality: 'Kano',
			region: 'Kano',
			coords: { lat: 12.036, lng: 8.5167 }
		},

		// Enugu
		{
			label: 'Independence Layout, Enugu',
			locality: 'Enugu',
			region: 'Enugu',
			coords: { lat: 6.4402, lng: 7.5088 }
		},
		{
			label: 'GRA, Enugu',
			locality: 'Enugu',
			region: 'Enugu',
			coords: { lat: 6.4288, lng: 7.4833 }
		},
		{
			label: 'Nsukka, Enugu',
			locality: 'Nsukka',
			region: 'Enugu',
			coords: { lat: 6.8578, lng: 7.3953 }
		},

		// Jos
		{
			label: 'Jos City, Plateau',
			locality: 'Jos',
			region: 'Plateau',
			coords: { lat: 9.8965, lng: 8.8583 }
		},
		{
			label: 'Bukuru, Jos',
			locality: 'Jos',
			region: 'Plateau',
			coords: { lat: 9.8167, lng: 8.8833 }
		},

		// Akwa Ibom
		{
			label: 'Uyo, Akwa Ibom',
			locality: 'Uyo',
			region: 'Akwa Ibom',
			coords: { lat: 5.0376, lng: 7.9124 }
		},
		{
			label: 'Ikot Ekpene, Akwa Ibom',
			locality: 'Ikot Ekpene',
			region: 'Akwa Ibom',
			coords: { lat: 5.1793, lng: 7.7143 }
		},

		// Other major cities
		{
			label: 'Owerri, Imo',
			locality: 'Owerri',
			region: 'Imo',
			coords: { lat: 5.4833, lng: 7.0333 }
		},
		{ label: 'Aba, Abia', locality: 'Aba', region: 'Abia', coords: { lat: 5.1066, lng: 7.3667 } },
		{
			label: 'Warri, Delta',
			locality: 'Warri',
			region: 'Delta',
			coords: { lat: 5.5174, lng: 5.75 }
		},
		{
			label: 'Sapele, Delta',
			locality: 'Sapele',
			region: 'Delta',
			coords: { lat: 5.6833, lng: 5.6833 }
		},
		{
			label: 'Minna, Niger',
			locality: 'Minna',
			region: 'Niger',
			coords: { lat: 9.6155, lng: 6.5478 }
		},
		{
			label: 'Kaduna City, Kaduna',
			locality: 'Kaduna',
			region: 'Kaduna',
			coords: { lat: 10.5105, lng: 7.4165 }
		},
		{
			label: 'Zaria, Kaduna',
			locality: 'Zaria',
			region: 'Kaduna',
			coords: { lat: 11.0689, lng: 7.6996 }
		},
		{
			label: 'Maiduguri, Borno',
			locality: 'Maiduguri',
			region: 'Borno',
			coords: { lat: 11.8463, lng: 13.1564 }
		},
		{
			label: 'Ilorin, Kwara',
			locality: 'Ilorin',
			region: 'Kwara',
			coords: { lat: 8.4799, lng: 4.5418 }
		},
		{
			label: 'Abeokuta, Ogun',
			locality: 'Abeokuta',
			region: 'Ogun',
			coords: { lat: 7.1475, lng: 3.3617 }
		}
	];

	// Filter by query
	const filtered = nigerianAddresses.filter(
		(addr) =>
			addr.label.toLowerCase().includes(q) ||
			addr.locality.toLowerCase().includes(q) ||
			addr.region.toLowerCase().includes(q)
	);

	// If no matches, return top cities
	const results = filtered.length > 0 ? filtered.slice(0, 10) : nigerianAddresses.slice(0, 10);

	return results.map((addr, index) => ({
		id: `fallback-${index}`,
		label: addr.label,
		name: addr.label,
		locality: addr.locality,
		region: addr.region,
		country: 'Nigeria',
		confidence: filtered.length > 0 ? 0.9 : 0.5,
		coordinates: addr.coords,
		layer: 'place'
	}));
}

export async function GET({ url }: { url: URL }) {
	const query = url.searchParams.get('q') || '';

	if (!query || query.length < 2) {
		return json({ suggestions: [], error: 'Query must be at least 2 characters' });
	}

	// Check cache first
	const cached = requestCache.get(query.toLowerCase());
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return json(cached.data);
	}

	try {
		// Use Nominatim API (free, no key required but requires User-Agent)
		const searchQuery = `${query}, Nigeria`;
		const nominatimUrl = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&addressdetails=1&countrycodes=ng`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const response = await fetch(nominatimUrl, {
			headers: {
				Accept: 'application/json',
				'User-Agent': 'Proxifeast/1.0 (Contact: support@proxifeast.com)'
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			console.error('Nominatim API error:', response.status);
			const fallbackSuggestions = getFallbackAddresses(query);
			return json({
				success: true,
				suggestions: fallbackSuggestions,
				query: query,
				fallback: true
			});
		}

		const data = await response.json();

		if (!data || data.length === 0) {
			const fallbackSuggestions = getFallbackAddresses(query);
			return json({
				success: true,
				suggestions: fallbackSuggestions,
				query: query,
				fallback: true
			});
		}

		// Format suggestions
		const suggestions = data.map((item: any) => {
			const address = item.address || {};

			// Build a nice label
			let label = item.display_name;
			// Truncate if too long
			if (label && label.length > 100) {
				label = label.split(',').slice(0, 4).join(', ');
			}

			return {
				id: item.place_id?.toString() || Math.random().toString(36).substr(2, 9),
				label: label,
				name:
					address.road ||
					address.neighbourhood ||
					address.suburb ||
					address.city ||
					address.town ||
					address.village ||
					'',
				locality: address.city || address.town || address.village || address.lga || '',
				region: address.state || '',
				country: address.country || 'Nigeria',
				confidence: item.importance || 0.7,
				coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
				layer: address.city ? 'city' : 'address'
			};
		});

		const result = {
			success: true,
			suggestions: suggestions,
			query: query,
			fallback: false
		};

		// Cache the result
		requestCache.set(query.toLowerCase(), { data: result, timestamp: Date.now() });

		return json(result);
	} catch (err: any) {
		console.error('Address autocomplete error:', err);

		// Return fallback addresses on error
		const fallbackSuggestions = getFallbackAddresses(query);
		return json({
			success: true,
			suggestions: fallbackSuggestions,
			query: query,
			fallback: true
		});
	}
}
