import type { PageServerLoad } from '../$types';
import { resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const load: PageServerLoad = async ({ locals, request }) => {
	try {
		const restaurant = await resolveRestaurantByDomain(
			locals.pb,
			request.headers.get('host') || '',
			{
				allowSuperFallback: true
			}
		);

		if (!restaurant) {
			throw new Error('Restaurant not found');
		}

		const restaurantId = restaurant.id;

		return {
			restaurant,
			restaurantId
		};
	} catch (error) {
		console.error('Error loading restaurant or dishes:', error);
		return {
			dishes: [],

			error: 'Restaurant not found or failed to load dishes'
		};
	}
};
