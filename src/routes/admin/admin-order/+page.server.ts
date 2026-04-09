import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ parent }) => {
	const layoutData = await parent();

	return {
		restaurant: layoutData.restaurant,
		restaurantId: layoutData.restaurantId,
		isSuper: layoutData.isSuper
	};
};
