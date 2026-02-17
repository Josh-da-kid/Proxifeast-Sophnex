import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export async function GET() {
	try {
		// Test ORS API key
		const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

		// Test fetch a restaurant
		const restaurants = await pb.collection('restaurants').getList(1, 1);
		const firstRestaurant = restaurants.items[0];

		return json({
			success: true,
			orsApiKey: ORS_API_KEY
				? 'Set (first 10 chars: ' + ORS_API_KEY.substring(0, 10) + '...)'
				: 'NOT SET',
			firstRestaurant: firstRestaurant
				? {
						id: firstRestaurant.id,
						name: firstRestaurant.name,
						hasLatitude: !!firstRestaurant.latitude,
						hasLongitude: !!firstRestaurant.longitude,
						latitude: firstRestaurant.latitude,
						longitude: firstRestaurant.longitude,
						deliveryFeePerKm: firstRestaurant.deliveryFeePerKm,
						minDeliveryFee: firstRestaurant.minDeliveryFee
					}
				: 'No restaurants found'
		});
	} catch (err: any) {
		return json(
			{
				success: false,
				error: err.message
			},
			{ status: 500 }
		);
	}
}
