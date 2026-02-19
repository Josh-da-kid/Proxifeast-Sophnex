import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isSuperRestaurant } from '$lib/utils/restaurantAccess';

export const load: PageServerLoad = async ({ request, locals }) => {
	// Get current restaurant from domain
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	let currentRestaurant = null;
	try {
		const restaurants = await locals.pb.collection('restaurants').getFullList({
			filter: `domain="${domain}"`
		});
		currentRestaurant = restaurants?.[0] || null;
	} catch (e) {
		console.error('Could not find restaurant for domain:', domain);
	}

	// Block access for non-super restaurants
	if (!isSuperRestaurant(currentRestaurant)) {
		throw error(404, 'Not Found');
	}

	// For super restaurants, return all restaurants
	const restaurants = await locals.pb.collection('restaurants').getFullList({
		sort: 'name',
		filter: 'name != "ProxifeastLocal"'
	});

	return {
		restaurants,
		isSuper: true
	};
};
