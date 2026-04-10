import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getScopedRestaurantForRequest, isSuperRestaurant } from '$lib/server/restaurantAccess';

export const load: PageServerLoad = async ({ params, locals, request }) => {
	const { id } = params;

	try {
		const scoped = await getScopedRestaurantForRequest(
			locals.pb,
			request.headers.get('host') || '',
			id,
			{
				allowSuperFallback: false
			}
		);

		if (!scoped.currentRestaurant || !scoped.allowed) {
			throw error(404, 'Restaurant not found');
		}

		const restaurant = await locals.pb.collection('restaurants').getOne(id);

		const dishesResult = await locals.pb.collection('dishes').getList(1, 100, {
			filter: `restaurantId = "${id}" && availability = "Available"`,
			sort: '-created'
		});

		const featuredDishesResult = await locals.pb.collection('dishes').getList(1, 10, {
			filter: `restaurantId = "${id}" && isFeatured = true && availability = "Available"`,
			sort: '-created'
		});

		const categorySet = new Set(
			dishesResult.items.map((dish: any) => dish.category).filter(Boolean)
		);
		const categories = Array.from(categorySet).sort();

		const menuByCategory: Record<string, typeof dishesResult.items> = {};
		for (const dish of dishesResult.items) {
			if (dish.category) {
				if (!menuByCategory[dish.category]) {
					menuByCategory[dish.category] = [];
				}
				menuByCategory[dish.category].push(dish);
			}
		}

		const allRestaurants = await locals.pb.collection('restaurants').getFullList({
			fields: 'id,name,state,localGovernment,orderServices'
		});

		return {
			restaurant,
			dishes: dishesResult.items,
			featuredDishes: featuredDishesResult.items,
			categories,
			menuByCategory,
			user: locals.user || null,
			allRestaurants,
			isSuper: isSuperRestaurant(scoped.currentRestaurant)
		};
	} catch (err) {
		console.error('Failed to load restaurant:', err);
		throw error(404, 'Restaurant not found');
	}
};
