import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const pb = new PocketBase('https://playgzero.pb.itcass.net/');

// Delivery tier configuration (Glovo/Bolt style)
const DELIVERY_TIERS = [
	{ maxKm: 2, baseFee: 200, perKmRate: 0 }, // Base fee covers first 2km
	{ maxKm: 5, baseFee: 200, perKmRate: 50 }, // 2-5km: ₦50 per km after 2km
	{ maxKm: 10, baseFee: 350, perKmRate: 40 }, // 5-10km: ₦350 base + ₦40 per km after 5km
	{ maxKm: 15, baseFee: 550, perKmRate: 30 } // 10-15km: ₦550 base + ₦30 per km after 10km
];

const MAX_DELIVERY_RADIUS = 15; // km
const SERVICE_FEE = 50; // Platform service fee per order
const MIN_ORDER_VALUE = 2000; // Minimum order value before small order fee
const SMALL_ORDER_FEE = 300; // Fee for orders below minimum

// Nigerian states for validation
const NIGERIAN_STATES = [
	'Abia',
	'Adamawa',
	'Akwa Ibom',
	'Anambra',
	'Bauchi',
	'Bayelsa',
	'Benue',
	'Borno',
	'Cross River',
	'Delta',
	'Ebonyi',
	'Edo',
	'Ekiti',
	'Enugu',
	'FCT',
	'Gombe',
	'Imo',
	'Jigawa',
	'Kaduna',
	'Kano',
	'Katsina',
	'Kebbi',
	'Kogi',
	'Kwara',
	'Lagos',
	'Nasarawa',
	'Niger',
	'Ogun',
	'Ondo',
	'Osun',
	'Oyo',
	'Plateau',
	'Rivers',
	'Sokoto',
	'Taraba',
	'Yobe',
	'Zamfara'
];

// Extract state from address
function extractStateFromAddress(address: string): string | null {
	const upperAddress = address.toLowerCase();

	// Direct matches for common states
	for (const state of NIGERIAN_STATES) {
		if (upperAddress.includes(state.toLowerCase())) {
			return state;
		}
	}

	// Special cases
	if (upperAddress.includes('abuja')) return 'FCT';
	if (upperAddress.includes('cross river') || upperAddress.includes('calabar'))
		return 'Cross River';
	if (upperAddress.includes('lagos')) return 'Lagos';
	if (upperAddress.includes('ph') || upperAddress.includes('port harcourt')) return 'Rivers';

	return null;
}

// Calculate tiered delivery fee based on distance
function calculateTieredDeliveryFee(distanceKm: number): { fee: number; tier: string } {
	if (distanceKm <= 0) return { fee: 0, tier: 'base' };

	for (let i = 0; i < DELIVERY_TIERS.length; i++) {
		const tier = DELIVERY_TIERS[i];
		if (distanceKm <= tier.maxKm) {
			let fee = tier.baseFee;

			// Add per-km rate for distance beyond the previous tier
			if (i > 0) {
				const prevTier = DELIVERY_TIERS[i - 1];
				const extraDistance = distanceKm - prevTier.maxKm;
				fee += Math.max(0, extraDistance * tier.perKmRate);
			}

			return { fee: Math.ceil(fee), tier: `${tier.maxKm}km` };
		}
	}

	// Beyond max radius - return -1 to indicate not deliverable
	return { fee: -1, tier: 'exceeded' };
}

export async function POST({ request }: { request: Request }) {
	const { restaurantId, address, orderSubtotal = 0 } = await request.json();

	if (!restaurantId || !address) {
		return json({ error: 'Restaurant ID and address are required' }, { status: 400 });
	}

	console.log('Calculating delivery fee:', { restaurantId, address, orderSubtotal });

	try {
		// Fetch restaurant data
		const restaurant = await pb.collection('restaurants').getOne(restaurantId);

		if (!restaurant) {
			return json({ error: 'Restaurant not found' }, { status: 404 });
		}

		// Check if restaurant has coordinates
		if (!restaurant.latitude || !restaurant.longitude) {
			return json(
				{ error: 'Restaurant location not configured. Please contact support.' },
				{ status: 400 }
			);
		}

		// Extract state from customer address
		const customerState = extractStateFromAddress(address);
		const restaurantState =
			restaurant.state || extractStateFromAddress(restaurant.restaurantAddress || '');

		console.log('State check:', { customerState, restaurantState });

		// STATE-BASED RESTRICTION: Customer must be in same state as restaurant
		if (customerState && restaurantState && customerState !== restaurantState) {
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

		// If we can't determine states, proceed with distance check
		const restaurantCoords = `${restaurant.longitude},${restaurant.latitude}`;

		// Step 1: Geocode customer address
		const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}`;
		const geoRes = await fetch(geocodeUrl);

		if (!geoRes.ok) {
			throw new Error(`Geocoding failed: ${geoRes.status}`);
		}

		const geoData = await geoRes.json();
		const coordinates = geoData.features?.[0]?.geometry?.coordinates;

		if (!coordinates) {
			return json(
				{ error: 'Could not find coordinates for the provided address' },
				{ status: 404 }
			);
		}

		const userCoords = `${coordinates[0]},${coordinates[1]}`;

		// Step 2: Calculate driving distance
		const directionsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${restaurantCoords}&end=${userCoords}`;
		const routeRes = await fetch(directionsUrl);

		if (!routeRes.ok) {
			throw new Error(`Route calculation failed: ${routeRes.status}`);
		}

		const routeData = await routeRes.json();
		const distanceMeters = routeData.features[0].properties.summary.distance;
		const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));

		console.log('Distance calculated:', distanceKm, 'km');

		// Step 3: Check maximum delivery radius
		const maxRadius = restaurant.maxDeliveryRadius || MAX_DELIVERY_RADIUS;
		if (distanceKm > maxRadius) {
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

		if (deliveryFee < 0) {
			return json({
				success: false,
				canDeliver: false,
				error: `Delivery not available for this distance (${distanceKm}km). Maximum is ${MAX_DELIVERY_RADIUS}km.`,
				distance: distanceKm,
				fee: 0
			});
		}

		// Step 5: Calculate additional fees
		const serviceFee = restaurant.serviceFee || SERVICE_FEE;
		const minOrderValue = restaurant.minOrderValue || MIN_ORDER_VALUE;
		const smallOrderFee =
			orderSubtotal < minOrderValue ? restaurant.smallOrderFee || SMALL_ORDER_FEE : 0;

		const totalFees = deliveryFee + serviceFee + smallOrderFee;

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
				error: 'An error occurred while calculating delivery fee',
				details: err.message
			},
			{ status: 500 }
		);
	}
}
