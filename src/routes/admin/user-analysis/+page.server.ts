import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domainOnly = host.split(':')[0].replace('www.', '').toLowerCase();

	let restaurant: any = null;
	let restaurantId: string | null = null;

	try {
		// Try to find restaurant by exact domain match
		try {
			restaurant = await locals.pb
				.collection('restaurants')
				.getFirstListItem(`domain = "${domainOnly}"`);
		} catch {
			// Try partial match
			try {
				const results = await locals.pb.collection('restaurants').getList(1, 5, {
					filter: `domain ~ "${domainOnly}"`
				});
				if (results.items.length > 0) {
					restaurant = results.items[0];
				}
			} catch {
				// Fallback to super restaurant
				try {
					restaurant = await locals.pb.collection('restaurants').getFirstListItem('isSuper = true');
				} catch {
					console.log('No restaurant found');
				}
			}
		}

		restaurantId = restaurant?.id || null;
		console.log('User Analysis - Restaurant ID:', restaurantId);
	} catch (err) {
		console.error('Error finding restaurant:', err);
	}

	if (!restaurantId) {
		console.log('No restaurant ID found, returning empty data');
		return getEmptyData();
	}

	const isAdmin = locals.user?.isAdmin === true;
	const restaurantFilter = isAdmin ? '' : `restaurantId = "${restaurantId}" && `;

	try {
		// Get all delivered orders for this restaurant
		console.log('Fetching orders with filter:', `${restaurantFilter}status = "Delivered"`);
		const deliveredOrders = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}status = "Delivered"`,
			sort: '-created'
		});
		console.log('Found delivered orders:', deliveredOrders.length);

		// Log sample order to see structure
		if (deliveredOrders.length > 0) {
			console.log('Sample order fields:', Object.keys(deliveredOrders[0]));
			console.log(
				'Sample order:',
				JSON.stringify({
					id: deliveredOrders[0].id,
					user: deliveredOrders[0].user,
					restaurantId: deliveredOrders[0].restaurantId,
					orderTotal: deliveredOrders[0].orderTotal,
					totalAmount: deliveredOrders[0].totalAmount,
					created: deliveredOrders[0].created
				})
			);
		}

		// Get all users - try filtering by restaurantIds, but if that returns nothing, get all users
		let allUsers: any[] = [];

		// First, get all users
		try {
			allUsers = await locals.pb.collection('users').getFullList({
				sort: '-created'
			});
			console.log('Found all users:', allUsers.length);

			// Log sample user to see structure
			if (allUsers.length > 0) {
				console.log('Sample user fields:', Object.keys(allUsers[0]));
				console.log(
					'Sample user:',
					JSON.stringify({
						id: allUsers[0].id,
						name: allUsers[0].name,
						email: allUsers[0].email,
						restaurantIds: allUsers[0].restaurantIds
					})
				);
			}
		} catch (err) {
			console.log('Error getting users:', err);
		}

		// Check what user IDs are in orders
		const orderUserIds = [...new Set(deliveredOrders.map((o: any) => o.user).filter(Boolean))];
		console.log('User IDs in orders:', orderUserIds);

		// If we have users in orders but not from restaurantIds filter, try to find them
		if (allUsers.length === 0 && orderUserIds.length > 0) {
			console.log('Getting users from orders directly');
			const userPromises = orderUserIds.map((userId: string) =>
				locals.pb
					.collection('users')
					.getOne(userId)
					.catch(() => null)
			);
			allUsers = (await Promise.all(userPromises)).filter(Boolean);
			console.log('Found users from orders:', allUsers.length);
		}

		// If still no users from filter, use users from orders
		if (allUsers.length === 0 && deliveredOrders.length > 0) {
			const userIds = [...new Set(deliveredOrders.map((o: any) => o.user).filter(Boolean))];
			console.log('Getting users from orders:', userIds.length);
			const userPromises = userIds.map((userId: string) =>
				locals.pb
					.collection('users')
					.getOne(userId)
					.catch(() => null)
			);
			allUsers = (await Promise.all(userPromises)).filter(Boolean);
		}

		// Group orders by user - try matching by user ID first, then by email
		const userOrdersMap: Record<string, any[]> = {};

		// Create a map of email to user for matching
		const emailToUserMap: Record<string, any> = {};
		allUsers.forEach((user: any) => {
			if (user.email) {
				emailToUserMap[user.email.toLowerCase()] = user;
			}
		});

		deliveredOrders.forEach((order: any) => {
			let userId = order.user;

			// If user field is empty, try to match by email
			if (!userId && order.email) {
				const matchedUser = emailToUserMap[order.email.toLowerCase()];
				if (matchedUser) {
					userId = matchedUser.id;
				}
			}

			if (userId) {
				if (!userOrdersMap[userId]) {
					userOrdersMap[userId] = [];
				}
				userOrdersMap[userId].push(order);
			}
		});

		console.log('User orders map keys:', Object.keys(userOrdersMap));
		console.log(
			'Orders per user:',
			Object.values(userOrdersMap).map((orders: any) => orders.length)
		);

		// Build customer stats - include ALL users, with their order data if they have orders
		const customerStats: any[] = allUsers.map((user: any) => {
			const userOrders = userOrdersMap[user.id] || [];
			const totalSpent = userOrders.reduce(
				(sum: number, o: any) => sum + (o.orderTotal || o.totalAmount || 0),
				0
			);

			return {
				id: user.id,
				name: user.name || user.username || user.email?.split('@')[0] || 'Unknown',
				email: user.email || '',
				phone: user.phone || user.phoneNumber || '',
				address: user.address || '',
				orderCount: userOrders.length,
				totalOrderCount: userOrders.length,
				totalSpent,
				firstOrder: userOrders.length > 0 ? userOrders[userOrders.length - 1]?.created : null,
				lastOrder: userOrders.length > 0 ? userOrders[0]?.created : null
			};
		});

		// Sort by total spent (highest first)
		customerStats.sort((a, b) => b.totalSpent - a.totalSpent);

		// Calculate tier distribution
		let vipCount = 0;
		let premiumCount = 0;
		let regularCount = 0;
		let newCount = 0;

		customerStats.forEach((c: any) => {
			if (c.totalSpent >= 100000) vipCount++;
			else if (c.totalSpent >= 50000) premiumCount++;
			else if (c.orderCount >= 5) regularCount++;
			else newCount++;
		});

		// Revenue over time (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const sixtyDaysAgo = new Date();
		sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

		const recentOrders = deliveredOrders.filter((o: any) => {
			const orderDate = new Date(o.created);
			return orderDate >= thirtyDaysAgo;
		});

		const previousPeriodOrders = deliveredOrders.filter((o: any) => {
			const orderDate = new Date(o.created);
			return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
		});

		const ordersByDate: Record<string, number> = {};
		recentOrders.forEach((order: any) => {
			const date = new Date(order.created).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
			ordersByDate[date] = (ordersByDate[date] || 0) + (order.orderTotal || order.totalAmount || 0);
		});

		// Get last 7 days labels
		const last7Days: string[] = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			last7Days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
		}

		const revenueOverTime = {
			labels: last7Days,
			datasets: [
				{
					label: 'Revenue',
					data: last7Days.map((date) => ordersByDate[date] || 0),
					borderColor: '#f59e0b',
					backgroundColor: 'rgba(245, 158, 11, 0.1)',
					tension: 0.3,
					fill: true
				}
			]
		};

		// Customer tiers pie chart
		const tierDistribution = {
			labels: ['VIP (₦100k+)', 'Premium (₦50k+)', 'Regular (5+ orders)', 'New'],
			datasets: [
				{
					data: [vipCount, premiumCount, regularCount, newCount],
					backgroundColor: ['#8b5cf6', '#f59e0b', '#3b82f6', '#94a3b8']
				}
			]
		};

		// New vs Returning customers
		const newCustomers = customerStats.filter((c: any) => c.orderCount === 1).length;
		const returningCustomers = customerStats.filter((c: any) => c.orderCount > 1).length;

		const newVsReturning = {
			labels: ['New Customers', 'Returning Customers'],
			datasets: [
				{
					data: [newCustomers, returningCustomers],
					backgroundColor: ['#0ea5e9', '#f472b6']
				}
			]
		};

		// Order time distribution (hourly)
		const ordersByHour: number[] = new Array(24).fill(0);
		deliveredOrders.forEach((order: any) => {
			const hour = new Date(order.created).getHours();
			ordersByHour[hour]++;
		});

		const orderTimeDistribution = {
			labels: [
				'12am',
				'1am',
				'2am',
				'3am',
				'4am',
				'5am',
				'6am',
				'7am',
				'8am',
				'9am',
				'10am',
				'11am',
				'12pm',
				'1pm',
				'2pm',
				'3pm',
				'4pm',
				'5pm',
				'6pm',
				'7pm',
				'8pm',
				'9pm',
				'10pm',
				'11pm'
			],
			datasets: [
				{
					label: 'Orders',
					data: ordersByHour,
					backgroundColor: 'rgba(245, 158, 11, 0.8)',
					borderRadius: 4
				}
			]
		};

		// Popular dishes analysis
		const dishCounts: Record<string, { count: number; revenue: number }> = {};
		deliveredOrders.forEach((order: any) => {
			if (order.dishes && Array.isArray(order.dishes)) {
				order.dishes.forEach((dish: any) => {
					const name = dish.name || 'Unknown';
					if (!dishCounts[name]) {
						dishCounts[name] = { count: 0, revenue: 0 };
					}
					dishCounts[name].count++;
					// Use 'amount' field (the actual price field)
					const price = dish.amount || dish.price || dish.itemPrice || 0;
					dishCounts[name].revenue += price * (dish.quantity || 1);
				});
			}
		});

		const popularDishes = Object.entries(dishCounts)
			.map(([name, data]) => ({ name, ...data }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Delivery type distribution
		const deliveryTypes: Record<string, number> = { home: 0, restaurantPickup: 0, tableService: 0 };
		deliveredOrders.forEach((order: any) => {
			const type = order.deliveryType || 'home';
			if (type in deliveryTypes) {
				deliveryTypes[type]++;
			} else {
				deliveryTypes.home++;
			}
		});

		const deliveryTypeDistribution = {
			labels: ['Delivery', 'Pickup', 'Dine-in'],
			datasets: [
				{
					data: [deliveryTypes.home, deliveryTypes.restaurantPickup, deliveryTypes.tableService],
					backgroundColor: ['#10b981', '#3b82f6', '#f59e0b']
				}
			]
		};

		// Customer retention rate
		const recentCustomerIds = new Set(recentOrders.map((o: any) => o.user).filter(Boolean));
		const previousCustomerIds = new Set(
			previousPeriodOrders.map((o: any) => o.user).filter(Boolean)
		);
		const retainedCustomers = [...recentCustomerIds].filter((id) =>
			previousCustomerIds.has(id)
		).length;
		const retentionRate =
			previousCustomerIds.size > 0
				? Math.round((retainedCustomers / previousCustomerIds.size) * 100)
				: 0;

		// Churned customers
		const churnedCustomers = customerStats.filter((c: any) => {
			if (c.orderCount === 0) return false;
			const lastOrder = new Date(c.lastOrder);
			const daysSinceLastOrder = Math.floor(
				(new Date().getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)
			);
			return daysSinceLastOrder > 30;
		}).length;

		// Top customers
		const topCustomers = customerStats.slice(0, 5).map((c: any) => ({
			id: c.id,
			name: c.name,
			email: c.email,
			totalSpent: c.totalSpent,
			orderCount: c.orderCount
		}));

		// Most valuable customers
		const mostValuableCustomers = customerStats.slice(0, 10).map((c: any) => ({
			id: c.id,
			name: c.name,
			email: c.email,
			totalSpent: c.totalSpent,
			orderCount: c.orderCount,
			avgOrderValue: c.orderCount > 0 ? Math.round(c.totalSpent / c.orderCount) : 0,
			lastOrder: c.lastOrder
		}));

		// Customer growth
		const thirtyDaysAgoDate = new Date();
		thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
		const newUsersLast30Days = allUsers.filter(
			(u: any) => new Date(u.created) >= thirtyDaysAgoDate
		).length;

		const totalRevenue = customerStats.reduce((sum: number, c: any) => sum + c.totalSpent, 0);
		const avgCustomerLTV =
			customerStats.length > 0 ? Math.round(totalRevenue / customerStats.length) : 0;

		console.log('Returning data:', {
			customers: customerStats.length,
			orders: deliveredOrders.length,
			revenue: totalRevenue
		});

		return {
			customerStats,
			userOrdersMap,
			charts: {
				revenueOverTime,
				tierDistribution,
				newVsReturning,
				orderTimeDistribution,
				deliveryTypeDistribution
			},
			topCustomers,
			mostValuableCustomers,
			popularDishes,
			stats: {
				totalCustomers: customerStats.length,
				newCustomers,
				returningCustomers,
				vipCount,
				premiumCount,
				regularCount,
				newCount,
				totalRevenue,
				avgOrderValue:
					deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0,
				avgCustomerLTV,
				retentionRate,
				churnedCustomers,
				newUsersLast30Days,
				totalOrders: deliveredOrders.length
			}
		};
	} catch (error) {
		console.error('Error loading user analysis:', error);
		return getEmptyData();
	}
};

function getEmptyData() {
	return {
		customerStats: [],
		userOrdersMap: {},
		charts: {
			revenueOverTime: { labels: [], datasets: [] },
			tierDistribution: { labels: [], datasets: [] },
			newVsReturning: { labels: [], datasets: [] },
			orderTimeDistribution: { labels: [], datasets: [] },
			deliveryTypeDistribution: { labels: [], datasets: [] }
		},
		topCustomers: [],
		mostValuableCustomers: [],
		popularDishes: [],
		stats: {
			totalCustomers: 0,
			newCustomers: 0,
			returningCustomers: 0,
			vipCount: 0,
			premiumCount: 0,
			regularCount: 0,
			newCount: 0,
			totalRevenue: 0,
			avgOrderValue: 0,
			avgCustomerLTV: 0,
			retentionRate: 0,
			churnedCustomers: 0,
			newUsersLast30Days: 0,
			totalOrders: 0
		}
	};
}
