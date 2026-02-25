import type { PageServerLoad } from '../$types';
import { isSuperRestaurant } from '$lib/utils/restaurantAccess';

export const load: PageServerLoad = async ({ locals, request, parent }) => {
	// Get restaurant from layout data instead of making separate query
	const layoutData = await parent();
	const restaurant = layoutData.restaurant;
	const restaurantId = layoutData.restaurantId;
	const isSuper = layoutData.isSuper;

	if (!restaurant) {
		return {
			dishes: [],
			stats: {
				todayRevenue: 0,
				pendingRevenue: 0,
				pendingOrdersCount: 0,
				completedOrdersCount: 0
			},
			error: 'Restaurant not found'
		};
	}

	try {
		// Build restaurant filter - always filter by current restaurant
		const restaurantFilter = `restaurantId = "${restaurantId}" && `;

		console.log('Admin Dashboard - Restaurant ID:', restaurantId);

		// Get today's date range
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
		const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

		const startStr = startOfDay.toISOString().replace('T', ' ').split('.')[0];
		const endStr = endOfDay.toISOString().replace('T', ' ').split('.')[0];

		// Fetch today's revenue
		const todayOrdersResult = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}status = "Delivered" && created >= "${startStr}" && created < "${endStr}"`
		});

		const todayOrders = todayOrdersResult;

		const todayRevenue = todayOrders.reduce(
			(sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0),
			0
		);

		// Fetch pending orders for potential revenue
		const pendingOrdersResult = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}(status = "Pending" || status = "Preparing" || status = "Ready") && created >= "${startStr}" && created < "${endStr}"`
		});

		const pendingRevenue = pendingOrdersResult.reduce(
			(sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0),
			0
		);

		// Fetch pending orders with pagination
		const pendingResult = await locals.pb.collection('orders').getList(1, 50, {
			filter: `${restaurantFilter}(status = "Pending" || status = "Preparing" || status = "Ready")`
		});
		const pendingOrdersCount = pendingResult.totalItems;

		// Fetch completed orders with pagination
		const completedResult = await locals.pb.collection('orders').getList(1, 100, {
			filter: `${restaurantFilter}status = "Delivered"`
		});
		const completedOrdersCount = completedResult.totalItems;

		// Get subscription stats for super restaurants
		let subscriptionStats = null;
		if (isSuper) {
			try {
				const subsResult = await locals.pb.collection('subscriptions').getList(1, 100);
				const subscriptions = subsResult.items;

				const now = new Date();
				const thirtyDaysFromNow = new Date();
				thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

				const activeCount = subscriptions.filter((s: any) => s.status === 'active').length;
				const expiringSoonCount = subscriptions.filter((s: any) => {
					const endDate = new Date(s.endDate);
					return s.status === 'active' && endDate <= thirtyDaysFromNow && endDate > now;
				}).length;

				const totalRevenue = subscriptions
					.filter((s: any) => s.status === 'active')
					.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

				subscriptionStats = {
					totalRestaurants: subscriptions.length,
					activeCount,
					expiringSoonCount,
					totalRevenue
				};
			} catch (err) {
				console.error('Error loading subscription stats:', err);
			}
		}

		return {
			restaurant,
			restaurantId,
			isSuper,
			stats: {
				todayRevenue,
				pendingRevenue,
				pendingOrdersCount,
				completedOrdersCount
			},
			subscriptionStats
		};
	} catch (error) {
		console.error('Error loading restaurant or stats:', error);
		return {
			dishes: [],
			stats: {
				todayRevenue: 0,
				pendingRevenue: 0,
				pendingOrdersCount: 0,
				completedOrdersCount: 0
			},
			error: 'Failed to load data'
		};
	}
};
