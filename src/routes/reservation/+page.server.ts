import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const storeId = url.searchParams.get('store');
	let store = null;

	if (storeId) {
		try {
			store = await locals.pb.collection('restaurants').getOne(storeId);
		} catch (e) {
			console.error('Failed to fetch store:', e);
		}
	}

	// Check isSuper directly from current restaurant, not parent (which may have fallback)
	const restaurant = locals.restaurant;
	const restaurantIsSuper = restaurant?.isSuper === true || restaurant?.isSuper === 'true';
	const acceptsReservations = restaurant?.orderServices?.tableService === true;

	// Non-super stores without tableService should get 404
	if (!restaurantIsSuper && !acceptsReservations && !store) {
		throw error(404, 'This store does not accept table reservations');
	}

	// If store is specified in URL, check if it accepts reservations
	if (store && !restaurantIsSuper && store.orderServices?.tableService !== true) {
		throw error(404, 'This store does not have table reservation enabled');
	}

	// Get available restaurants that accept reservations (for super stores)
	let availableRestaurants: any[] = [];
	if (restaurantIsSuper) {
		try {
			const allRestaurants = await locals.pb.collection('restaurants').getFullList({
				fields: 'id,name,domain,restaurantAddress,image,orderServices'
			});
			availableRestaurants = allRestaurants.filter(
				(r: any) => r.orderServices?.tableService === true
			);
		} catch (e) {
			console.error('Failed to fetch restaurants:', e);
		}
	}

	return {
		store,
		isSuper: restaurantIsSuper,
		acceptsReservations,
		availableRestaurants
	};
};
