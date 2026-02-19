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

	// Load restaurant favorites - filtered by current restaurant for non-super
	let restaurants: any[] = [];

	if (isSuper) {
		// Super restaurants see all their saved restaurants
		const favorites: string[] = locals.user.favorites || [];
		if (favorites.length > 0) {
			const filter = favorites.map((id) => `id="${id}"`).join(' || ');
			restaurants = await locals.pb.collection('restaurants').getFullList({
				filter,
				sort: 'name'
			});
		}
	} else if (currentRestaurant) {
		// Non-super restaurants: only show current restaurant if it's in favorites
		const favorites: string[] = locals.user.favorites || [];
		if (favorites.includes(currentRestaurant.id)) {
			restaurants = [currentRestaurant];
		}
		// Otherwise show empty - they can't see other restaurants' favorites
	}

	// Load dish favorites
	let dishFavorites: any[] = [];

	if (currentRestaurant) {
		const userDishFavorites = locals.user.dishFavorites || {};

		if (isSuper) {
			// Super restaurants see dish favorites for current restaurant context
			const restaurantDishIds = userDishFavorites[currentRestaurant.id] || [];
			if (restaurantDishIds.length > 0) {
				const dishFilter = restaurantDishIds.map((id: string) => `id="${id}"`).join(' || ');
				try {
					const allRestaurants = await locals.pb.collection('restaurants').getFullList({
						fields: 'id,name'
					});
					const dishes = await locals.pb.collection('dishes').getFullList({
						filter: dishFilter
					});
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
		} else {
			// Non-super restaurants: only show dish favorites for their restaurant
			const restaurantDishIds = userDishFavorites[currentRestaurant.id] || [];
			if (restaurantDishIds.length > 0) {
				const dishFilter = restaurantDishIds.map((id: string) => `id="${id}"`).join(' || ');
				try {
					const dishes = await locals.pb.collection('dishes').getFullList({
						filter: dishFilter
					});
					dishFavorites = dishes.map((dish) => ({
						...dish,
						restaurantName: currentRestaurant.name
					}));
				} catch (err) {
					console.error('Failed to load dish favorites:', err);
				}
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
