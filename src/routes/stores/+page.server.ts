import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isSuperRestaurant, resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const load: PageServerLoad = async ({ request, locals }) => {
	const host = request.headers.get('host') || '';
	const currentRestaurant = await resolveRestaurantByDomain(locals.pb, host, {
		allowSuperFallback: true
	});

	if (!currentRestaurant || !isSuperRestaurant(currentRestaurant)) {
		throw error(404, 'Not Found');
	}

	const restaurants = await locals.pb.collection('restaurants').getFullList({
		sort: 'name',
		filter: 'name != "ProxifeastLocal"'
	});

	return {
		restaurants,
		isSuper: true
	};
};
