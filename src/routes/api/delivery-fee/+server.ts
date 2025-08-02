// import { json } from '@sveltejs/kit';

// const GOOGLE_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY as string;

// function haversineDistance(loc1: any, loc2: any): number {
// 	const R = 6371; // km
// 	const toRad = (deg: number) => deg * (Math.PI / 180);

// 	const dLat = toRad(loc2.lat - loc1.lat);
// 	const dLon = toRad(loc2.lng - loc1.lng);

// 	const a =
// 		Math.sin(dLat / 2) ** 2 +
// 		Math.cos(toRad(loc1.lat)) *
// 			Math.cos(toRad(loc2.lat)) *
// 			Math.sin(dLon / 2) ** 2;

// 	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// 	return R * c;
// }

// export const POST = async ({ request }) => {
// 	try {
// 		const { address } = await request.json();

// 		if (!address) {
// 			return json({ error: 'Address required' }, { status: 400 });
// 		}

// 		const geocodeRes = await fetch(
// 			`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
// 				address
// 			)}&key=${GOOGLE_API_KEY}`
// 		);

// 		const geocodeData = await geocodeRes.json();

// 		const location = geocodeData?.results?.[0]?.geometry?.location;

// 		if (!location) {
// 			return json({ error: 'Invalid address' }, { status: 400 });
// 		}

// 		const storeLocation = { lat: 9.0765, lng: 7.3986 }; // Example: Abuja
// 		const distance = haversineDistance(location, storeLocation);

// 		let deliveryFee = 0;
// 		if (distance <= 5) deliveryFee = 1000;
// 		else if (distance <= 10) deliveryFee = 2000;
// 		else deliveryFee = 3000;

// 		// Return location info for debugging/logging
// 		return json({
// 			locationText: geocodeData?.results?.[0]?.formatted_address,
// 			coordinates: location,
// 			distance: parseFloat(distance.toFixed(2)),
// 			fee: deliveryFee
// 		});
// 	} catch (err) {
// 		console.error(err);
// 		return json({ error: 'Server error' }, { status: 500 });
// 	}
// };

// src/routes/api/delivery-fee/+server.ts
import { json } from '@sveltejs/kit';

// const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

// const restaurantCoords = '7.4986,9.0579'; // Longitude,Latitude of restaurant
const restaurantCoords = '8.3222,4.9581'; // Longitude,Latitude — but properly ordered as LON,LAT


export async function POST({ request }) {
	const { address } = await request.json();

	if (!address) {
		return json({ error: 'Address is required' }, { status: 400 });
	}

	console.log("Received address:", address);

	try {
		// Step 1: Convert address to coordinates
		const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}`;
		const geoRes = await fetch(geocodeUrl);

		if (!geoRes.ok) throw new Error('Failed to geocode address');

		const geoData = await geoRes.json();

console.log("Geocoding response:", geoData);
		const coordinates = geoData.features?.[0]?.geometry?.coordinates;

		if (!coordinates) {
			return json({ error: 'Could not find coordinates for the provided address' }, { status: 404 });
		}

		const userCoords = `${coordinates[0]},${coordinates[1]}`;

		// Step 2: Calculate distance and fee
		const directionsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${restaurantCoords}&end=${userCoords}`;
		const routeRes = await fetch(directionsUrl);

		if (!routeRes.ok) throw new Error('Failed to calculate route');

		const routeData = await routeRes.json();
		const distanceMeters = routeData.features[0].properties.summary.distance;
		const distanceKm = distanceMeters / 1000;

		// Delivery fee logic (₦100/km)
		const deliveryFee = Math.ceil(distanceKm * 130);

		return json({
			fee: deliveryFee,
			distance: distanceKm.toFixed(2),
			addressMatched: geoData.features?.[0]?.properties?.label,
			userCoords
		});
	} catch (err) {
		console.error(err);
		return json({ error: 'An error occurred while calculating delivery fee' }, { status: 500 });
	}
}





