import type { PageServerLoad } from '../$types';
import { isSuperRestaurant } from '$lib/utils/restaurantAccess';

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];
	// console.log("domain:", domain)

	try {
		// ✅ Look up the restaurant by domain
		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);

		const restaurantId = restaurant.id;
		const isSuper = isSuperRestaurant(restaurant);

		return {
			restaurant,
			restaurantId,
			isSuper
		};
	} catch (error) {
		console.error('Error loading restaurant or dishes:', error);
		return {
			dishes: [],
			isSuper: false,
			error: 'Restaurant not found or failed to load dishes'
		};
	}
};
