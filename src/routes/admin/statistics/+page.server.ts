import type { PageServerLoad } from './$types';

function calculateStats(orders: any[]) {
	const uniqueCustomers = new Set(orders.map((o: any) => o.user).filter(Boolean));
	const totalCustomers = uniqueCustomers.size;
	const totalRevenue = orders.reduce(
		(sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0),
		0
	);
	const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

	const userOrderCounts: Record<string, number> = {};
	orders.forEach((order: any) => {
		if (order.user) {
			userOrderCounts[order.user] = (userOrderCounts[order.user] || 0) + 1;
		}
	});
	const returningCustomers = Object.values(userOrderCounts).filter(
		(count: any) => count > 1
	).length;
	const recurringRate =
		totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(0) : '0';

	const firstTimeCustomers = totalCustomers - returningCustomers;

	const hourCounts: Record<number, number> = {};
	orders.forEach((order: any) => {
		const hour = new Date(order.created).getHours();
		hourCounts[hour] = (hourCounts[hour] || 0) + 1;
	});
	const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

	const dayCounts: Record<string, number> = {};
	orders.forEach((order: any) => {
		const day = new Date(order.created).toLocaleDateString('en-US', { weekday: 'long' });
		dayCounts[day] = (dayCounts[day] || 0) + 1;
	});
	const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

	return {
		customers: totalCustomers,
		firstTimeCustomers,
		returningCustomers,
		orders: orders.length,
		revenue: totalRevenue,
		recurringRate: `${recurringRate}%`,
		avgOrderValue,
		peakHour: peakHour ? parseInt(peakHour[0]) : 12,
		peakHourOrders: peakHour ? peakHour[1] : 0,
		peakDay: peakDay ? peakDay[0] : 'N/A',
		peakDayOrders: peakDay ? peakDay[1] : 0
	};
}

function getDailyStats(
	orders: any[],
	days: number
): { labels: string[]; revenue: number[]; orders: number[] } {
	const result: { labels: string[]; revenue: number[]; orders: number[] } = {
		labels: [],
		revenue: [],
		orders: []
	};

	for (let i = days - 1; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		result.labels.push(dateStr);

		const dayOrders = orders.filter((o: any) => {
			const orderDate = new Date(o.created);
			return orderDate.toDateString() === d.toDateString();
		});

		result.revenue.push(
			dayOrders.reduce((sum: number, o: any) => sum + (o.orderTotal || o.totalAmount || 0), 0)
		);
		result.orders.push(dayOrders.length);
	}

	return result;
}

function getMonthlyStats(orders: any[]): { labels: string[]; revenue: number[]; orders: number[] } {
	const months: Record<string, { revenue: number; orders: number }> = {};

	orders.forEach((order: any) => {
		const date = new Date(order.created);
		const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
		if (!months[monthKey]) {
			months[monthKey] = { revenue: 0, orders: 0 };
		}
		months[monthKey].revenue += order.orderTotal || order.totalAmount || 0;
		months[monthKey].orders += 1;
	});

	const sortedMonths = Object.keys(months).sort((a, b) => {
		const dateA = new Date(a);
		const dateB = new Date(b);
		return dateA.getTime() - dateB.getTime();
	});

	return {
		labels: sortedMonths,
		revenue: sortedMonths.map((m) => months[m].revenue),
		orders: sortedMonths.map((m) => months[m].orders)
	};
}

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	try {
		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);

		const isSuper = restaurant.isSuper === true;
		const restaurantId = restaurant.id;
		const restaurantName = restaurant.name;

		const allRestaurants = await locals.pb.collection('restaurants').getFullList({
			fields: 'id, name, isSuper'
		});

		const myDeliveredOrders = await locals.pb.collection('orders').getFullList({
			filter: `restaurantId = "${restaurantId}" && status = "Delivered"`,
			sort: '-created'
		});

		const myStats = calculateStats(myDeliveredOrders);

		const myRevenue = myStats.revenue;
		const myOrders = myStats.orders;
		const myCustomers = myStats.customers;
		const myAvgOrder = myStats.avgOrderValue;

		if (isSuper) {
			const allOrders = await locals.pb.collection('orders').getFullList({
				filter: `status = "Delivered"`,
				sort: '-created'
			});

			const restaurantStats: any[] = [];
			for (const r of allRestaurants) {
				const rOrders = allOrders.filter((o: any) => o.restaurantId === r.id);
				if (rOrders.length > 0) {
					const stats = calculateStats(rOrders);
					restaurantStats.push({
						id: r.id,
						name: r.name,
						revenue: stats.revenue,
						orders: stats.orders,
						customers: stats.customers,
						avgOrderValue: stats.avgOrderValue,
						recurringRate: parseInt(stats.recurringRate)
					});
				}
			}

			const totalRevenue = restaurantStats.reduce((sum, r) => sum + r.revenue, 0);
			const totalOrders = restaurantStats.reduce((sum, r) => sum + r.orders, 0);
			const totalCustomers = restaurantStats.reduce((sum, r) => sum + r.customers, 0);
			const avgRevenuePerRestaurant =
				restaurantStats.length > 0 ? totalRevenue / restaurantStats.length : 0;
			const avgOrdersPerRestaurant =
				restaurantStats.length > 0 ? totalOrders / restaurantStats.length : 0;

			const topRestaurants = [...restaurantStats]
				.sort((a, b) => b.revenue - a.revenue)
				.slice(0, 10);

			const allDishes = await locals.pb.collection('dishes').getFullList();
			const categoryStats: Record<string, number> = {};
			allDishes.forEach((dish: any) => {
				const cat = dish.category || 'Uncategorized';
				categoryStats[cat] = (categoryStats[cat] || 0) + 1;
			});

			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
			const recentOrders = allOrders.filter((o: any) => new Date(o.created) >= thirtyDaysAgo);

			const ordersByDate: Record<string, number> = {};
			recentOrders.forEach((order: any) => {
				const date = new Date(order.created).toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric'
				});
				ordersByDate[date] = (ordersByDate[date] || 0) + 1;
			});

			const last7Days: string[] = [];
			for (let i = 6; i >= 0; i--) {
				const d = new Date();
				d.setDate(d.getDate() - i);
				last7Days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
			}

			const last30DaysData = getDailyStats(allOrders, 30);
			const monthlyData = getMonthlyStats(allOrders);

			const statusCounts: Record<string, number> = {};
			allOrders.forEach((order: any) => {
				const status = order.status || 'unknown';
				statusCounts[status] = (statusCounts[status] || 0) + 1;
			});

			const totalPlatformCustomers = new Set(allOrders.map((o: any) => o.user).filter(Boolean))
				.size;
			const platformRecurringStats = calculateStats(allOrders);

			const restaurantRevenueList = restaurantStats
				.map((r) => r.revenue)
				.sort((a: number, b: number) => a - b);
			const restaurantOrdersList = restaurantStats
				.map((r) => r.orders)
				.sort((a: number, b: number) => a - b);
			const medianRevenue =
				restaurantRevenueList.length > 0
					? restaurantRevenueList[Math.floor(restaurantRevenueList.length / 2)]
					: 0;
			const medianOrders =
				restaurantOrdersList.length > 0
					? restaurantOrdersList[Math.floor(restaurantOrdersList.length / 2)]
					: 0;

			return {
				isSuper: true,
				restaurantName,
				stats: {
					totalRevenue,
					totalOrders,
					totalCustomers,
					totalRestaurants: restaurantStats.length,
					avgRevenuePerRestaurant,
					avgOrdersPerRestaurant,
					medianRevenue,
					medianOrders,
					totalPlatformCustomers,
					platformRecurringRate: platformRecurringStats.recurringRate,
					platformAvgOrderValue: platformRecurringStats.avgOrderValue
				},
				myStats,
				topRestaurants: topRestaurants.map((r) => ({
					name: r.name,
					revenue: r.revenue,
					orders: r.orders,
					customers: r.customers
				})),
				categoryBreakdown: Object.entries(categoryStats).map(([name, count]) => ({ name, count })),
				ordersOverTime: {
					labels: last7Days,
					data: last7Days.map((date) => ordersByDate[date] || 0)
				},
				dailyTrend: last30DaysData,
				monthlyTrend: monthlyData,
				statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
			};
		} else {
			const allOrders = await locals.pb.collection('orders').getFullList({
				filter: `status = "Delivered"`,
				sort: '-created'
			});

			const restaurantStats: any[] = [];
			for (const r of allRestaurants) {
				const rOrders = allOrders.filter((o: any) => o.restaurantId === r.id);
				if (rOrders.length > 0) {
					const stats = calculateStats(rOrders);
					restaurantStats.push({
						revenue: stats.revenue,
						orders: stats.orders,
						customers: stats.customers,
						avgOrderValue: stats.avgOrderValue,
						recurringRate: parseInt(stats.recurringRate)
					});
				}
			}

			const revenues = restaurantStats.map((r) => r.revenue).sort((a: number, b: number) => a - b);
			const ordersList = restaurantStats.map((r) => r.orders).sort((a: number, b: number) => a - b);
			const avgOrdersList = restaurantStats
				.map((r) => r.avgOrderValue)
				.sort((a: number, b: number) => a - b);

			function getPercentile(value: number, sortedList: number[]): number {
				if (sortedList.length === 0) return 0;
				const index = sortedList.findIndex((v) => v >= value);
				if (index === -1) return 100;
				return Math.round((index / sortedList.length) * 100);
			}

			const revenuePercentile = getPercentile(myRevenue, revenues);
			const ordersPercentile = getPercentile(myOrders, ordersList);
			const avgOrderPercentile = getPercentile(myAvgOrder, avgOrdersList);

			const totalRev = revenues.reduce((a: number, b: number) => a + b, 0);
			const totalOrds = ordersList.reduce((a: number, b: number) => a + b, 0);
			const avgRevenue = restaurantStats.length > 0 ? totalRev / restaurantStats.length : 0;
			const avgOrd = restaurantStats.length > 0 ? totalOrds / restaurantStats.length : 0;
			const avgCust =
				restaurantStats.length > 0
					? restaurantStats.reduce((sum: number, r: any) => sum + r.customers, 0) /
						restaurantStats.length
					: 0;

			const comparison = {
				revenueVsAvg: avgRevenue > 0 ? ((myRevenue / avgRevenue) * 100).toFixed(0) : '0',
				ordersVsAvg: avgOrd > 0 ? ((myOrders / avgOrd) * 100).toFixed(0) : '0',
				avgOrderVsAvg: avgOrd > 0 ? ((myAvgOrder / avgOrd) * 100).toFixed(0) : '0'
			};

			const topPerformers = [...restaurantStats]
				.sort((a: any, b: any) => b.revenue - a.revenue)
				.slice(0, 5)
				.map((r: any, i: number) => ({
					rank: i + 1,
					label: `Top Restaurant ${i + 1}`,
					orders: r.orders,
					revenue: r.revenue
				}));

			const benchmarks = {
				avgRevenue: Math.round(avgRevenue),
				avgOrders: Math.round(avgOrd),
				avgCustomers: Math.round(avgCust),
				totalRestaurants: restaurantStats.length
			};

			const avgPercentile = (revenuePercentile + ordersPercentile + avgOrderPercentile) / 3;
			let rating = 'Needs Improvement';
			if (avgPercentile >= 80) rating = 'Excellent';
			else if (avgPercentile >= 60) rating = 'Good';
			else if (avgPercentile >= 40) rating = 'Average';
			else if (avgPercentile >= 20) rating = 'Below Average';

			const last30DaysData = getDailyStats(myDeliveredOrders, 30);
			const monthlyData = getMonthlyStats(myDeliveredOrders);

			const allTimeRevenue = myStats.revenue;
			const last30DaysRevenue = last30DaysData.revenue.reduce((a, b) => a + b, 0);
			const previous30DaysRevenue = allTimeRevenue - last30DaysRevenue;
			const revenueGrowth =
				previous30DaysRevenue > 0
					? (((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100).toFixed(1)
					: '0';

			return {
				isSuper: false,
				restaurantName,
				stats: myStats,
				percentiles: {
					revenue: revenuePercentile,
					orders: ordersPercentile,
					avgOrder: avgOrderPercentile
				},
				comparison,
				benchmarks,
				topPerformers,
				rating,
				trends: {
					last30DaysRevenue,
					previous30DaysRevenue,
					revenueGrowth,
					dailyTrend: last30DaysData,
					monthlyTrend: monthlyData
				}
			};
		}
	} catch (error) {
		console.error('Error loading statistics:', error);
		return {
			isSuper: false,
			stats: { customers: 0, orders: 0, revenue: 0, recurringRate: '0%', avgOrderValue: 0 },
			percentiles: { revenue: 0, orders: 0, avgOrder: 0 },
			comparison: { revenueVsAvg: '0', ordersVsAvg: '0', avgOrderVsAvg: '0' },
			benchmarks: { avgRevenue: 0, avgOrders: 0, avgCustomers: 0, totalRestaurants: 0 },
			topPerformers: [],
			rating: 'N/A'
		};
	}
};
