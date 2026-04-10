import type { PageServerLoad } from '../$types';
import { isSuperRestaurant } from '$lib/server/restaurantAccess';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const layoutData = await parent();
	const restaurantId = layoutData.restaurantId || null;
	const restaurant = layoutData.restaurant;
	const isSuper = isSuperRestaurant(restaurant);

	if (!restaurantId) return getEmptyData();

	try {
		// Get all delivered orders
		const deliveredOrders = await locals.pb.collection('orders').getFullList({
			filter: isSuper
				? `status = "Delivered"`
				: `restaurantId = "${restaurantId}" && status = "Delivered"`,
			sort: '-created'
		});
		console.log('Found delivered orders:', deliveredOrders.length);
		if (deliveredOrders.length > 0) {
			console.log('Sample order:', {
				id: deliveredOrders[0].id,
				user: deliveredOrders[0].user,
				email: deliveredOrders[0].email,
				name: deliveredOrders[0].name
			});
		}

		const allUsers = await locals.pb.collection('users').getFullList();
		const scopedUserIds = new Set(deliveredOrders.map((order: any) => order.user).filter(Boolean));

		// Build customer map only for users in the current scope
		const customerMap: Record<string, any> = {};

		allUsers.forEach((user: any) => {
			if (!scopedUserIds.has(user.id)) return;

			customerMap[user.id] = {
				id: user.id,
				name: user.name || user.username || user.email?.split('@')[0] || 'Unknown',
				email: user.email || '',
				phone: user.phone || '',
				address: user.address || '',
				orders: []
			};
		});

		// Link orders to users
		deliveredOrders.forEach((order: any) => {
			if (order.user && customerMap[order.user]) {
				customerMap[order.user].orders.push(order);
			}
		});

		const customerStats = Object.values(customerMap).map((customer: any) => {
			const orders = customer.orders;
			const totalSpent = orders.reduce(
				(sum: number, o: any) => sum + (o.orderTotal || o.totalAmount || 0),
				0
			);
			const sortedOrders = [...orders].sort(
				(a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
			);

			return {
				id: customer.id,
				name: customer.name,
				email: customer.email,
				phone: customer.phone,
				address: customer.address,
				orderCount: orders.length,
				totalSpent,
				avgOrderValue: orders.length > 0 ? Math.round(totalSpent / orders.length) : 0,
				firstOrder: sortedOrders[sortedOrders.length - 1]?.created,
				lastOrder: sortedOrders[0]?.created
			};
		});

		customerStats.sort((a: any, b: any) => b.totalSpent - a.totalSpent);
		console.log('Total customers:', customerStats.length);

		// Tiers
		let vipCount = 0,
			premiumCount = 0,
			regularCount = 0,
			newCount = 0;
		customerStats.forEach((c: any) => {
			if (c.totalSpent >= 100000) vipCount++;
			else if (c.totalSpent >= 50000) premiumCount++;
			else if (c.orderCount >= 5) regularCount++;
			else newCount++;
		});

		// Revenue over time
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const sixtyDaysAgo = new Date();
		sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

		const recentOrders = deliveredOrders.filter((o: any) => new Date(o.created) >= thirtyDaysAgo);
		const previousPeriodOrders = deliveredOrders.filter((o: any) => {
			const d = new Date(o.created);
			return d >= sixtyDaysAgo && d < thirtyDaysAgo;
		});

		const ordersByDate: Record<string, number> = {};
		recentOrders.forEach((order: any) => {
			const date = new Date(order.created).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
			ordersByDate[date] = (ordersByDate[date] || 0) + (order.orderTotal || order.totalAmount || 0);
		});

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

		const tierDistribution = {
			labels: ['VIP (₦100k+)', 'Premium (₦50k+)', 'Regular (5+ orders)', 'New'],
			datasets: [
				{
					data: [vipCount, premiumCount, regularCount, newCount],
					backgroundColor: ['#8b5cf6', '#f59e0b', '#3b82f6', '#94a3b8']
				}
			]
		};

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

		// Order time
		const ordersByHour: number[] = new Array(24).fill(0);
		deliveredOrders.forEach((order: any) => {
			ordersByHour[new Date(order.created).getHours()]++;
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

		// Popular dishes
		const dishCounts: Record<string, { count: number; revenue: number }> = {};
		deliveredOrders.forEach((order: any) => {
			if (order.dishes && Array.isArray(order.dishes)) {
				order.dishes.forEach((dish: any) => {
					const name = dish.name || 'Unknown';
					if (!dishCounts[name]) dishCounts[name] = { count: 0, revenue: 0 };
					dishCounts[name].count++;
					const price = dish.amount || dish.price || 0;
					dishCounts[name].revenue += price * (dish.quantity || 1);
				});
			}
		});

		const popularDishes = Object.entries(dishCounts)
			.map(([name, data]) => ({ name, ...data }))
			.sort((a: any, b: any) => b.count - a.count)
			.slice(0, 5);

		// Delivery types
		const deliveryTypes: Record<string, number> = { home: 0, restaurantPickup: 0, tableService: 0 };
		deliveredOrders.forEach((order: any) => {
			const type = order.deliveryType || 'home';
			if (type in deliveryTypes) deliveryTypes[type]++;
			else deliveryTypes.home++;
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

		// Retention
		const recentCustomerIds = new Set(recentOrders.map((o: any) => o.user).filter(Boolean));
		const previousCustomerIds = new Set(
			previousPeriodOrders.map((o: any) => o.user).filter(Boolean)
		);
		const retained = [...recentCustomerIds].filter((id) => previousCustomerIds.has(id)).length;
		const retentionRate =
			previousCustomerIds.size > 0 ? Math.round((retained / previousCustomerIds.size) * 100) : 0;

		const churnedCustomers = customerStats.filter((c: any) => {
			if (c.orderCount === 0 || !c.lastOrder) return false;
			const daysSince = Math.floor(
				(new Date().getTime() - new Date(c.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
			);
			return daysSince > 30;
		}).length;

		const topCustomers = customerStats.slice(0, 5).map((c: any) => ({
			id: c.id,
			name: c.name,
			email: c.email,
			totalSpent: c.totalSpent,
			orderCount: c.orderCount
		}));

		const mostValuableCustomers = customerStats.slice(0, 10).map((c: any) => ({
			id: c.id,
			name: c.name,
			email: c.email,
			totalSpent: c.totalSpent,
			orderCount: c.orderCount,
			avgOrderValue: c.avgOrderValue,
			lastOrder: c.lastOrder
		}));

		const totalRevenue = customerStats.reduce((sum: number, c: any) => sum + c.totalSpent, 0);
		const recentActiveCustomers = customerStats
			.filter((c: any) => c.lastOrder && new Date(c.lastOrder) >= thirtyDaysAgo)
			.slice(0, 8)
			.map((c: any) => ({
				id: c.id,
				name: c.name,
				orderCount: c.orderCount,
				totalSpent: c.totalSpent,
				lastOrder: c.lastOrder
			}));
		const atRiskCustomers = customerStats
			.filter((c: any) => {
				if (!c.lastOrder) return false;
				const daysSince = Math.floor(
					(Date.now() - new Date(c.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
				);
				return daysSince >= 14 && daysSince <= 60;
			})
			.slice(0, 8)
			.map((c: any) => ({
				id: c.id,
				name: c.name,
				orderCount: c.orderCount,
				totalSpent: c.totalSpent,
				lastOrder: c.lastOrder
			}));
		const recencyBuckets = {
			last7Days: customerStats.filter(
				(c: any) => c.lastOrder && Date.now() - new Date(c.lastOrder).getTime() <= 7 * 86400000
			).length,
			last30Days: customerStats.filter(
				(c: any) => c.lastOrder && Date.now() - new Date(c.lastOrder).getTime() <= 30 * 86400000
			).length,
			last90Days: customerStats.filter(
				(c: any) => c.lastOrder && Date.now() - new Date(c.lastOrder).getTime() <= 90 * 86400000
			).length,
			over90Days: customerStats.filter(
				(c: any) => c.lastOrder && Date.now() - new Date(c.lastOrder).getTime() > 90 * 86400000
			).length
		};
		const spendDistribution = {
			under10k: customerStats.filter((c: any) => c.totalSpent < 10000).length,
			between10kAnd50k: customerStats.filter(
				(c: any) => c.totalSpent >= 10000 && c.totalSpent < 50000
			).length,
			between50kAnd100k: customerStats.filter(
				(c: any) => c.totalSpent >= 50000 && c.totalSpent < 100000
			).length,
			over100k: customerStats.filter((c: any) => c.totalSpent >= 100000).length
		};

		console.log('Returning:', {
			customers: customerStats.length,
			orders: deliveredOrders.length,
			revenue: totalRevenue
		});

		return {
			isSuper,
			scopeLabel: isSuper ? 'Platform customers' : `${restaurant?.name || 'Restaurant'} customers`,
			customerStats,
			userOrdersMap: Object.fromEntries(
				Object.entries(customerMap).map(([id, customer]: [string, any]) => [
					id,
					customer.orders || []
				])
			),
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
			recentActiveCustomers,
			atRiskCustomers,
			recencyBuckets,
			spendDistribution,
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
				avgCustomerLTV:
					customerStats.length > 0 ? Math.round(totalRevenue / customerStats.length) : 0,
				retentionRate,
				churnedCustomers,
				newUsersLast30Days: customerStats.filter(
					(c: any) => c.firstOrder && new Date(c.firstOrder) >= thirtyDaysAgo
				).length,
				totalOrders: deliveredOrders.length
			}
		};
	} catch (error) {
		console.error('Error:', error);
		return getEmptyData();
	}
};

function getEmptyData() {
	return {
		isSuper: false,
		scopeLabel: 'Restaurant customers',
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
		recentActiveCustomers: [],
		atRiskCustomers: [],
		recencyBuckets: {
			last7Days: 0,
			last30Days: 0,
			last90Days: 0,
			over90Days: 0
		},
		spendDistribution: {
			under10k: 0,
			between10kAnd50k: 0,
			between50kAnd100k: 0,
			over100k: 0
		},
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
