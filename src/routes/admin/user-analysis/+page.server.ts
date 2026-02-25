import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	try {
		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);
		const restaurantId = restaurant.id;

		const isAdmin = locals.user?.isAdmin === true;
		const restaurantFilter = isAdmin ? '' : `restaurantId = "${restaurantId}" && `;

		// Get all delivered orders
		const deliveredOrders = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}status = "Delivered"`,
			sort: '-created'
		});

		// Get all users for this restaurant
		const allUsers = await locals.pb.collection('users').getFullList({
			filter: `restaurantIds ?= "${restaurantId}"`
		});

		// Group orders by user
		const userOrdersMap: Record<string, any[]> = {};
		deliveredOrders.forEach((order: any) => {
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
			const totalSpent = userOrders.reduce(
				(sum: number, o: any) => sum + (o.orderTotal || o.totalAmount || 0),
				0
			);

			// Calculate average time between orders
			let avgDaysBetweenOrders = 0;
			if (userOrders.length > 1) {
				const sortedOrders = [...userOrders].sort(
					(a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
				);
				let totalDays = 0;
				for (let i = 0; i < sortedOrders.length - 1; i++) {
					const days =
						(new Date(sortedOrders[i].created).getTime() -
							new Date(sortedOrders[i + 1].created).getTime()) /
						(1000 * 60 * 60 * 24);
					totalDays += days;
				}
				avgDaysBetweenOrders = Math.round(totalDays / (sortedOrders.length - 1));
			}

			return {
				id: user.id,
				name: user.name || user.username || 'Unknown',
				email: user.email || '',
				phone: user.phone || user.phoneNumber || '',
				address: user.address || '',
				orderCount: userOrders.length,
				totalOrderCount: userOrders.length,
				totalSpent,
				avgDaysBetweenOrders,
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
					dishCounts[name].revenue += dish.price || 0;
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

		// Customer retention rate (customers who ordered in both periods)
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

		// Churned customers (no orders in last 30 days but ordered before)
		const churnedCustomers = customerStats.filter((c: any) => {
			if (c.orderCount === 0) return false;
			const lastOrder = new Date(c.lastOrder);
			const daysSinceLastOrder = Math.floor(
				(new Date().getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)
			);
			return daysSinceLastOrder > 30;
		}).length;

		// Top customers by revenue
		const topCustomers = customerStats.slice(0, 5).map((c: any) => ({
			id: c.id,
			name: c.name,
			email: c.email,
			totalSpent: c.totalSpent,
			orderCount: c.orderCount
		}));

		// Most valuable customers (by LTV - lifetime value)
		const mostValuableCustomers = customerStats.slice(0, 10).map((c: any) => ({
			id: c.id,
			name: c.name,
			email: c.email,
			totalSpent: c.totalSpent,
			orderCount: c.orderCount,
			avgOrderValue: c.orderCount > 0 ? Math.round(c.totalSpent / c.orderCount) : 0,
			lastOrder: c.lastOrder
		}));

		// Calculate LTV (Lifetime Value) - average customer value
		const totalRevenue = customerStats.reduce((sum: number, c: any) => sum + c.totalSpent, 0);
		const avgCustomerLTV =
			customerStats.length > 0 ? Math.round(totalRevenue / customerStats.length) : 0;

		// Customer growth (new users in last 30 days)
		const thirtyDaysAgoDate = new Date();
		thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
		const newUsersLast30Days = allUsers.filter(
			(u: any) => new Date(u.created) >= thirtyDaysAgoDate
		).length;

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
};
