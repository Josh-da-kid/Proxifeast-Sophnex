import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	try {
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

		return {
			restaurant,
			dishes: dishesResult.items,
			featuredDishes: featuredDishesResult.items,
			categories,
			menuByCategory,
			user: locals.user || null
		};
	} catch (err) {
		console.error('Failed to load restaurant:', err);
		throw error(404, 'Restaurant not found');
	}
};
