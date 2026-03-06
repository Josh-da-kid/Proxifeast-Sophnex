import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isSuperRestaurant } from '$lib/utils/restaurantAccess';

export const load: PageServerLoad = async ({ request, locals }) => {
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

	if (!currentRestaurant) {
		try {
			const superRestaurants = await locals.pb.collection('restaurants').getFullList({
				filter: 'isSuper = true',
				limit: 1
			});
			currentRestaurant = superRestaurants?.[0] || null;
		} catch (e) {
			console.error('Could not find super restaurant:', e);
		}
	}

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
