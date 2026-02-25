import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domainOnly = host.split(':')[0].replace('www.', '').toLowerCase();

	let restaurant: any = null;
	try {
		restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domainOnly}"`);
	} catch {
		try {
			const results = await locals.pb.collection('restaurants').getList(1, 5, {
				filter: `domain ~ "${domainOnly}"`
			});
			if (results.items.length > 0) {
				restaurant = results.items[0];
			}
		} catch {}

		if (!restaurant) {
			try {
				restaurant = await locals.pb.collection('restaurants').getFirstListItem('isSuper = true');
			} catch {}
		}
	}

	const restaurantId = restaurant?.id;

	if (!restaurantId) {
		return {
			customerStats: [],
			userOrdersMap: {}
		};
	}

	try {
		// Get all orders for this restaurant (all statuses)
		const orders = await locals.pb.collection('orders').getFullList({
			filter: `restaurantId = "${restaurantId}"`,
			sort: '-created'
		});

		// Group orders by user
		const userOrdersMap: Record<string, any[]> = {};
		orders.forEach((order: any) => {
			if (order.user) {
				if (!userOrdersMap[order.user]) {
					userOrdersMap[order.user] = [];
				}
				userOrdersMap[order.user].push(order);
			}
		});

		// Get unique users and their stats
		const userIds = Object.keys(userOrdersMap);
		const customerStats: any[] = [];

		for (const userId of userIds) {
			const userOrders = userOrdersMap[userId];
			const deliveredOrders = userOrders.filter((o: any) => o.status === 'Delivered');
			const totalSpent = deliveredOrders.reduce(
				(sum: number, o: any) => sum + (o.orderTotal || o.totalAmount || 0),
				0
			);

			// Try to get user details
			let userDetails: any = null;
			try {
				userDetails = await locals.pb.collection('users').getOne(userId);
			} catch {
				// User might have been deleted
			}

			customerStats.push({
				id: userId,
				name: userDetails?.name || userDetails?.username || 'Unknown',
				email: userDetails?.email || '',
				phone: userDetails?.phone || userDetails?.phoneNumber || '',
				address: userDetails?.address || '',
				orderCount: deliveredOrders.length,
				totalOrderCount: userOrders.length,
				totalSpent,
				firstOrder: userOrders[userOrders.length - 1]?.created,
				lastOrder: userOrders[0]?.created
			});
		}

		// Sort by total spent (highest first)
		customerStats.sort((a, b) => b.totalSpent - a.totalSpent);

		return {
			customerStats,
			userOrdersMap
		};
	} catch (error) {
		console.error('Error loading user analysis:', error);
		return {
			customerStats: [],
			userOrdersMap: {}
		};
	}
};
