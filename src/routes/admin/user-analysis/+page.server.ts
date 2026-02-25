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
		// Get all users for this restaurant
		const allUsers = await locals.pb.collection('users').getFullList({
			filter: `restaurantIds ?= "${restaurantId}"`,
			sort: '-created'
		});

		// Get all orders for this restaurant
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

		// Build customer stats from all users
		const customerStats: any[] = allUsers.map((user: any) => {
			const userOrders = userOrdersMap[user.id] || [];
			const deliveredOrders = userOrders.filter((o: any) => o.status === 'Delivered');
			const totalSpent = deliveredOrders.reduce(
				(sum: number, o: any) => sum + (o.orderTotal || o.totalAmount || 0),
				0
			);

			return {
				id: user.id,
				name: user.name || user.username || 'Unknown',
				email: user.email || '',
				phone: user.phone || user.phoneNumber || '',
				address: user.address || '',
				orderCount: deliveredOrders.length,
				totalOrderCount: userOrders.length,
				totalSpent,
				firstOrder: userOrders.length > 0 ? userOrders[userOrders.length - 1]?.created : null,
				lastOrder: userOrders.length > 0 ? userOrders[0]?.created : null
			};
		});

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
