import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const pb = new PocketBase('https://playgzero.pb.itcass.net/');

// Delivery tier configuration (Glovo/Bolt style)
const DELIVERY_TIERS = [
	{ maxKm: 2, baseFee: 200, perKmRate: 0 },
	{ maxKm: 5, baseFee: 200, perKmRate: 50 },
	{ maxKm: 10, baseFee: 350, perKmRate: 40 },
	{ maxKm: 15, baseFee: 550, perKmRate: 30 }
];

const MAX_DELIVERY_RADIUS = 15;
const SERVICE_FEE = 50;
const MIN_ORDER_VALUE = 2000;
const SMALL_ORDER_FEE = 300;

// Nigerian states mapping
const STATE_KEYWORDS: Record<string, string[]> = {
	'Cross River': ['cross river', 'calabar', 'akamkpa', 'ikom', 'odukpani', 'yakurr'],
	Abuja: ['abuja', 'fct', 'federal capital', 'lugbe', 'gwagwalada', 'kubwa', 'nyanya'],
	Lagos: ['lagos', 'ikeja', 'lekki', 'yaba', 'surulere', 'victoria island', 'vi', 'ikoyi'],
	Rivers: ['rivers', 'port harcourt', 'ph', 'obio-akpor', 'bonny'],
	'Akwa Ibom': ['akwa ibom', 'uyo', 'ikot ekpene'],
	Delta: ['delta', 'asaba', 'warri', 'sapele'],
	Enugu: ['enugu'],
	Anambra: ['anambra', 'awka', 'onitsha'],
	Imo: ['imo', 'owerri'],
	Abia: ['abia', 'umuahia', 'aba'],
	Ebonyi: ['ebonyi', 'abakaliki'],
	Edo: ['edo', 'benin'],
	Ondo: ['ondo', 'akure'],
	Ekiti: ['ekiti', 'ado ekiti'],
	Oyo: ['oyo', 'ibadan'],
	Osun: ['osun', 'osogbo', 'ile-ife'],
	Ogun: ['ogun', 'abeokuta', 'sagamu'],
	Kwara: ['kwara', 'ilorin'],
	Kogi: ['kogi', 'lokoja'],
	Nasarawa: ['nasarawa', 'lafia'],
	Plateau: ['plateau', 'jos'],
	Bauchi: ['bauchi'],
	Gombe: ['gombe'],
	Yobe: ['yobe', 'damaturu'],
	Borno: ['borno', 'maiduguri'],
	Adamawa: ['adamawa', 'yola'],
	Taraba: ['taraba', 'jalingo'],
	Benue: ['benue', 'makurdi'],
	Niger: ['niger', 'minna'],
	Kaduna: ['kaduna'],
	Kano: ['kano'],
	Katsina: ['katsina'],
	Jigawa: ['jigawa', 'dutse'],
	Sokoto: ['sokoto'],
	Kebbi: ['kebbi', 'birnin kebbi'],
	Zamfara: ['zamfara', 'gusau'],
	Bayelsa: ['bayelsa', 'yenagoa'],
	FCT: [
		'abuja',
		'fct',
		'federal capital',
		'lugbe',
		'gwagwalada',
		'kubwa',
		'nyanya',
		'wuse',
		'maitama',
		'jabi',
		'garki'
	]
};

// Extract state from address text
function extractStateFromAddress(address: string): string | null {
	if (!address) return null;

	const lowerAddress = address.toLowerCase();

	for (const [state, keywords] of Object.entries(STATE_KEYWORDS)) {
		for (const keyword of keywords) {
			if (lowerAddress.includes(keyword)) {
				return state;
			}
		}
	}

	return null;
}

// Calculate tiered delivery fee
function calculateTieredDeliveryFee(distanceKm: number): { fee: number; tier: string } {
	if (distanceKm <= 0) return { fee: 0, tier: 'base' };

	for (let i = 0; i < DELIVERY_TIERS.length; i++) {
		const tier = DELIVERY_TIERS[i];
		if (distanceKm <= tier.maxKm) {
			let fee = tier.baseFee;

			if (i > 0) {
				const prevTier = DELIVERY_TIERS[i - 1];
				const extraDistance = distanceKm - prevTier.maxKm;
				fee += Math.max(0, extraDistance * tier.perKmRate);
			}

			return { fee: Math.ceil(fee), tier: `${tier.maxKm}km` };
		}
	}

	return { fee: -1, tier: 'exceeded' };
}

export async function POST({ request }: { request: Request }) {
	const { restaurantId, address, orderSubtotal = 0 } = await request.json();

	if (!restaurantId || !address) {
		return json(
			{
				success: false,
				error: 'Restaurant ID and address are required'
			},
			{ status: 400 }
		);
	}

	console.log('=== DELIVERY FEE CALCULATION ===');
	console.log('Restaurant ID:', restaurantId);
	console.log('Address:', address);
	console.log('Order Subtotal:', orderSubtotal);

	try {
		// Fetch restaurant data with all fields
		const restaurant = await pb.collection('restaurants').getOne(restaurantId);

		if (!restaurant) {
			return json(
				{
					success: false,
					error: 'Restaurant not found'
				},
				{ status: 404 }
			);
		}

		console.log('Restaurant found:', restaurant.name);
		console.log('Restaurant fields:', {
			state: restaurant.state,
			latitude: restaurant.latitude,
			longitude: restaurant.longitude,
			maxDeliveryRadius: restaurant.maxDeliveryRadius,
			serviceFee: restaurant.serviceFee,
			minOrderValue: restaurant.minOrderValue,
			smallOrderFee: restaurant.smallOrderFee
		});

		// Check if restaurant has coordinates
		if (!restaurant.latitude || !restaurant.longitude) {
			console.log('ERROR: Restaurant missing coordinates');
			return json({
				success: false,
				canDeliver: false,
				error: 'Restaurant location not configured. Please contact support.',
				debug: { restaurantId, hasLat: !!restaurant.latitude, hasLng: !!restaurant.longitude }
			});
		}

		// Get restaurant state from database field or extract from address
		let restaurantState =
			restaurant.state || extractStateFromAddress(restaurant.restaurantAddress || '');
		const customerState = extractStateFromAddress(address);

		console.log('State detection:', {
			restaurantState,
			customerState,
			restaurantAddress: restaurant.restaurantAddress
		});

		// STATE VALIDATION: If both states are detected and they don't match, block the order
		// But if we can't detect one or both states, allow it (fallback to distance-only validation)
		if (restaurantState && customerState && restaurantState !== customerState) {
			console.log('BLOCKED: Different states detected');
			return json({
				success: false,
				canDeliver: false,
				error: `This restaurant only delivers within ${restaurantState}. Your location appears to be in ${customerState}.`,
				customerState,
				restaurantState,
				distance: 0,
				fee: 0
			});
		}

		const restaurantCoords = `${restaurant.longitude},${restaurant.latitude}`;

		// Step 1: Geocode customer address
		const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}&boundary.country=NGA`;
		console.log('Geocoding URL:', geocodeUrl);

		const geoRes = await fetch(geocodeUrl);

		if (!geoRes.ok) {
			console.log('Geocoding failed:', geoRes.status);
			throw new Error(`Geocoding failed: ${geoRes.status}`);
		}

		const geoData = await geoRes.json();
		console.log('Geocoding results:', geoData.features?.length || 0, 'features found');

		const coordinates = geoData.features?.[0]?.geometry?.coordinates;

		if (!coordinates) {
			console.log('ERROR: No coordinates found for address');
			return json({
				success: false,
				canDeliver: false,
				error:
					'Could not find coordinates for the provided address. Please provide a more specific address.',
				debug: { address, geocodeResults: geoData.features?.length || 0 }
			});
		}

		const userCoords = `${coordinates[0]},${coordinates[1]}`;
		console.log('Coordinates:', { restaurantCoords, userCoords });

		// Step 2: Calculate driving distance
		const directionsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${restaurantCoords}&end=${userCoords}`;
		console.log('Directions URL:', directionsUrl);

		const routeRes = await fetch(directionsUrl);

		if (!routeRes.ok) {
			console.log('Route calculation failed:', routeRes.status);
			throw new Error(`Route calculation failed: ${routeRes.status}`);
		}

		const routeData = await routeRes.json();

		if (!routeData.features || !routeData.features[0]) {
			console.log('ERROR: No route features found');
			return json({
				success: false,
				canDeliver: false,
				error: 'Could not calculate route. The location might be unreachable by road.'
			});
		}

		const distanceMeters = routeData.features[0].properties.summary.distance;
		const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));

		console.log('Distance calculated:', distanceKm, 'km');

		// Step 3: Check maximum delivery radius (from database or default)
		const maxRadius = restaurant.maxDeliveryRadius || MAX_DELIVERY_RADIUS;
		console.log('Max radius:', maxRadius, 'km');

		if (distanceKm > maxRadius) {
			console.log('BLOCKED: Distance exceeds max radius');
			return json({
				success: false,
				canDeliver: false,
				error: `This restaurant only delivers within ${maxRadius}km. Your location is ${distanceKm}km away.`,
				distance: distanceKm,
				fee: 0,
				customerState,
				restaurantState
			});
		}

		// Step 4: Calculate tiered delivery fee
		const { fee: deliveryFee, tier } = calculateTieredDeliveryFee(distanceKm);
		console.log('Delivery fee:', deliveryFee, 'Tier:', tier);

		if (deliveryFee < 0) {
			return json({
				success: false,
				canDeliver: false,
				error: `Delivery not available for this distance (${distanceKm}km). Maximum is ${MAX_DELIVERY_RADIUS}km.`,
				distance: distanceKm,
				fee: 0
			});
		}

		// Step 5: Calculate additional fees (from database or defaults)
		const serviceFee = restaurant.serviceFee ?? SERVICE_FEE;
		const minOrderValue = restaurant.minOrderValue ?? MIN_ORDER_VALUE;
		const smallOrderFee =
			orderSubtotal < minOrderValue ? (restaurant.smallOrderFee ?? SMALL_ORDER_FEE) : 0;

		const totalFees = deliveryFee + serviceFee + smallOrderFee;

		console.log('Fees:', { deliveryFee, serviceFee, smallOrderFee, totalFees });
		console.log('=== SUCCESS ===');

		return json({
			success: true,
			canDeliver: true,
			restaurantId: restaurant.id,
			restaurantName: restaurant.name,
			distance: distanceKm,
			customerState,
			restaurantState,
			fees: {
				deliveryFee,
				deliveryTier: tier,
				serviceFee,
				smallOrderFee,
				total: totalFees
			},
			orderSubtotal,
			minOrderValue,
			addressMatched: geoData.features?.[0]?.properties?.label,
			userCoords,
			restaurantCoords: {
				lat: restaurant.latitude,
				lng: restaurant.longitude
			}
		});
	} catch (err: any) {
		console.error('Delivery fee calculation error:', err);
		return json(
			{
				success: false,
				canDeliver: false,
				error: 'An error occurred while calculating delivery fee. Please try again.',
				details: err.message
			},
			{ status: 500 }
		);
	}
}
