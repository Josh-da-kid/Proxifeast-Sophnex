import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const layoutData = await parent();
	const restaurant = layoutData.restaurant;
	const restaurantId = layoutData.restaurantId;
	const isSuper = layoutData.isSuper;

	let reservations: any[] = [];
	let stores: any[] = [];

	try {
		if (isSuper) {
			// Super admin sees all reservations
			const result = await locals.pb.collection('reservations').getList(1, 100, {
				sort: '-created'
			});
			reservations = result.items as any[];
		} else if (restaurantId) {
			// Regular admin sees only their restaurant's reservations
			const filter = `storeId = "${restaurantId}"`;
			const result = await locals.pb.collection('reservations').getList(1, 100, {
				filter,
				sort: '-created'
			});
			reservations = result.items as any[];
		}

		// Get unique stores for filtering
		if (isSuper) {
			try {
				const storesResult = await locals.pb.collection('restaurants').getList(1, 100);
				stores = storesResult.items as any[];
			} catch (err) {
				console.error('Error loading stores:', err);
			}
		}

		return {
			reservations,
			stores,
			restaurant,
			restaurantId,
			isSuper
		};
	} catch (error) {
		console.error('Error loading reservations:', error);
		return {
			reservations,
			stores,
			restaurant,
			restaurantId,
			isSuper,
			error: 'Failed to load reservations'
		};
	}
};
