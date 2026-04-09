import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { canAdminAccessRestaurant } from '$lib/server/restaurantAccess';

function isUserAdminForRestaurant(user: any, restaurantId: string): boolean {
	const adminRestaurantIds = user?.adminRestaurantIds || [];
	const userRestaurantIds = user?.restaurantIds || [];

	if (adminRestaurantIds.length > 0) {
		return adminRestaurantIds.includes(restaurantId);
	}
	return user?.isAdmin === true && userRestaurantIds.includes(restaurantId);
}

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) {
		return { featuredDishes: [], allDishes: [] };
	}

	const layoutData = await parent();
	const restaurantId = layoutData.restaurantId;
	const restaurant = layoutData.restaurant;

	if (!restaurantId) {
		return { featuredDishes: [], allDishes: [], restaurant: null };
	}

	if (!(await canAdminAccessRestaurant(locals.pb, locals.user, restaurantId))) {
		return { featuredDishes: [], allDishes: [], restaurant: null };
	}

	try {
		const featuredDishes = await locals.pb.collection('dishes').getFullList({
			filter: `restaurantId = "${restaurantId}" && isFeatured = true`,
			sort: '-created'
		});

		const allDishes = await locals.pb.collection('dishes').getFullList({
			filter: `restaurantId = "${restaurantId}"`,
			sort: '-created'
		});

		return {
			featuredDishes,
			allDishes,
			restaurant: restaurant || null
		};
	} catch (err) {
		console.error('Failed to fetch dishes:', err);
		return { featuredDishes: [], allDishes: [], restaurant: null };
	}
};

export const actions: Actions = {
	toggleFeatured: async ({ locals, request }) => {
		const formData = await request.formData();
		const dishId = formData.get('dishId') as string;
		const isFeatured = formData.get('isFeatured') === 'true';

		if (!dishId) {
			return fail(400, { error: 'Dish ID is required.' });
		}

		try {
			const dish = await locals.pb.collection('dishes').getOne(dishId);
			if (!(await canAdminAccessRestaurant(locals.pb, locals.user, dish.restaurantId))) {
				return fail(403, { error: 'Forbidden.' });
			}

			await locals.pb.collection('dishes').update(dishId, {
				isFeatured: !isFeatured
			});
			return { success: true };
		} catch (err) {
			console.error('Failed to toggle featured:', err);
			return fail(500, { error: 'Failed to update dish.' });
		}
	},

	removeFromFeatured: async ({ locals, request }) => {
		const formData = await request.formData();
		const dishId = formData.get('dishId') as string;

		if (!dishId) {
			return fail(400, { error: 'Dish ID is required.' });
		}

		try {
			const dish = await locals.pb.collection('dishes').getOne(dishId);
			if (!(await canAdminAccessRestaurant(locals.pb, locals.user, dish.restaurantId))) {
				return fail(403, { error: 'Forbidden.' });
			}

			await locals.pb.collection('dishes').update(dishId, {
				isFeatured: false
			});
			return { success: true };
		} catch (err) {
			console.error('Failed to remove from featured:', err);
			return fail(500, { error: 'Failed to update dish.' });
		}
	},

	addToFeatured: async ({ locals, request }) => {
		const formData = await request.formData();
		const dishId = formData.get('dishId') as string;

		if (!dishId) {
			return fail(400, { error: 'Dish ID is required.' });
		}

		try {
			const dish = await locals.pb.collection('dishes').getOne(dishId);
			if (!(await canAdminAccessRestaurant(locals.pb, locals.user, dish.restaurantId))) {
				return fail(403, { error: 'Forbidden.' });
			}

			await locals.pb.collection('dishes').update(dishId, {
				isFeatured: true
			});
			return { success: true };
		} catch (err) {
			console.error('Failed to add to featured:', err);
			return fail(500, { error: 'Failed to update dish.' });
		}
	}
};
