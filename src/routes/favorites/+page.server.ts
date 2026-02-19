import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isSuperRestaurant } from '$lib/utils/restaurantAccess';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Get current restaurant from domain
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	let currentRestaurant = null;
	let isSuper = false;
	try {
		const restaurants = await locals.pb.collection('restaurants').getFullList({
			filter: `domain="${domain}"`
		});
		currentRestaurant = restaurants?.[0] || null;
		isSuper = isSuperRestaurant(currentRestaurant);
	} catch (e) {
		console.error('Could not find restaurant for domain:', domain);
	}

	// Load restaurant favorites
	const favorites: string[] = locals.user.favorites || [];
	let restaurants: any[] = [];

	if (favorites.length > 0) {
		const filter = favorites.map((id) => `id="${id}"`).join(' || ');
		restaurants = await locals.pb.collection('restaurants').getFullList({
			filter,
			sort: 'name'
		});
	}

	// Load dish favorites for super restaurants
	let dishFavorites: any[] = [];
	if (isSuper && currentRestaurant) {
		const userDishFavorites = locals.user.dishFavorites || {};
		const restaurantDishIds = userDishFavorites[currentRestaurant.id] || [];

		if (restaurantDishIds.length > 0) {
			const dishFilter = restaurantDishIds.map((id: string) => `id="${id}"`).join(' || ');
			try {
				// Fetch all restaurants first to map restaurantId to names
				const allRestaurants = await locals.pb.collection('restaurants').getFullList({
					fields: 'id,name'
				});

				const dishes = await locals.pb.collection('dishes').getFullList({
					filter: dishFilter
				});

				// Attach restaurant name to each dish
				dishFavorites = dishes.map((dish) => {
					const restaurant = allRestaurants.find((r) => r.id === dish.restaurantId);
					return {
						...dish,
						restaurantName: restaurant?.name || 'Unknown Restaurant'
					};
				});
			} catch (err) {
				console.error('Failed to load dish favorites:', err);
			}
		}
	}

	return {
		restaurants,
		dishFavorites,
		isSuper,
		currentRestaurant
	};
};
