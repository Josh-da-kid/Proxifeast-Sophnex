import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		return { dishes: [], categories: [] };
	}

	const search = url.searchParams.get('search')?.trim() ?? '';
	const category = url.searchParams.get('category')?.trim() ?? 'All';

	const restaurantId = locals.user.restaurantId;
	if (!restaurantId) {
		return { dishes: [], categories: [] };
	}

	let filter = `restaurantId = "${restaurantId}"`;

	if (search) {
		filter += ` && (name ~ "${search}" || description ~ "${search}")`;
	}
	if (category && category !== 'All') {
		filter += ` && category = "${category}"`;
	}

	const dishes = await locals.pb.collection('dishes').getFullList({ sort: '-created', filter });
	const allDishesForCategories = await locals.pb.collection('dishes').getFullList({ filter: `restaurantId = "${restaurantId}"`, fields: 'category' });
	const categorySet = new Set(allDishesForCategories.map((dish) => dish.category).filter(Boolean));
	const categories = Array.from(categorySet).sort();
	return { dishes, categories };
};

export const actions: Actions = {
	toggleFeatured: async ({ locals, request }) => {
		if (!locals.pb.authStore.isValid || !locals.user?.isAdmin) {
			return fail(403, { error: 'Forbidden. You must be an admin.' });
		}

		const formData = await request.formData();
		const dishId = formData.get('dishId') as string;
		const isFeatured = formData.get('isFeatured') === 'true';

		if (!dishId) {
			return fail(400, { error: 'Dish ID is required.' });
		}

		try {
			// To ensure an admin can only feature dishes from their own restaurant,
			// we first fetch the dish to verify ownership.
			const dish = await locals.pb.collection('dishes').getOne(dishId);

			if (dish.restaurantId !== locals.user.restaurantId) {
				return fail(403, { error: 'Forbidden: You can only modify dishes from your restaurant.' });
			}

			await locals.pb.collection('dishes').update(dishId, {
				isFeatured: !isFeatured
			});
		} catch (err) {
			console.error('Failed to toggle featured status:', err);
			return fail(500, { error: 'Failed to update the dish.' });
		}

		return { success: true };
	}
};