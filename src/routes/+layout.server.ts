import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import pb from '$lib/pb';

export const load: LayoutServerLoad = async ({ locals, cookies, url, request }) => {
	try {
		const token = cookies.get('auth_token');

		// Get domain from request
		const fullHost = request.headers.get('host') || '';
		const domainOnly = fullHost.split(':')[0];

		// Find restaurant by domain
		const restaurants = await pb.collection('restaurants').getFullList({
			filter: `domain="${domainOnly}"`
		});

		const restaurant = restaurants?.[0];

		if (!restaurant) {
			console.error(`Restaurant not found for domain: ${domainOnly}`);
			throw redirect(307, '/not-found');
		}

		// Set restaurant in locals
		locals.restaurant = restaurant;

		// Check if super restaurant
		const isSuper = restaurant?.isSuper === true;

		// Fetch all restaurants for restaurant lookup
		const allRestaurants = await pb.collection('restaurants').getFullList({
			sort: 'name',
			filter: 'name != "ProxifeastLocal"'
		});

		return {
			user: locals.user ?? null,
			restaurant,
			allRestaurants,
			isSuper,
			restaurantId: restaurant?.id
		};
	} catch (err) {
		console.error('Layout server error:', err);
		// Return minimal data on error to prevent 500
		return {
			user: locals.user ?? null,
			restaurant: null,
			allRestaurants: [],
			isSuper: false,
			restaurantId: null
		};
	}
};
