import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import pb from '$lib/pb';

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

function getFilteredOrders(allOrders: any[], period: string) {
	if (period === 'all') return allOrders;

	const now = new Date();
	const days = period === '7days' ? 7 : 30;
	const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

	return allOrders.filter((o: any) => new Date(o.created) >= cutoff);
}

export const GET: RequestHandler = async ({ url, locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];
	const period = url.searchParams.get('period') || '30days';

	try {
		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);

		const isSuper = restaurant.isSuper === true;
		const restaurantId = restaurant.id;

		const allRestaurants = await locals.pb.collection('restaurants').getFullList({
			fields: 'id, name, isSuper'
		});

		const allOrders = await locals.pb.collection('orders').getFullList({
			filter: `status = "Delivered"`,
			sort: '-created'
		});

		const filteredOrders = getFilteredOrders(allOrders, period);

		if (isSuper) {
			const restaurantStats: any[] = [];
			for (const r of allRestaurants) {
				const rOrders = filteredOrders.filter((o: any) => o.restaurantId === r.id);
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

			const statusCounts: Record<string, number> = {};
			filteredOrders.forEach((order: any) => {
				const status = order.status || 'unknown';
				statusCounts[status] = (statusCounts[status] || 0) + 1;
			});

			const totalPlatformCustomers = new Set(filteredOrders.map((o: any) => o.user).filter(Boolean))
				.size;
			const platformRecurringStats = calculateStats(filteredOrders);

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

			return json({
				isSuper: true,
				period,
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
				topRestaurants: topRestaurants.map((r) => ({
					name: r.name,
					revenue: r.revenue,
					orders: r.orders,
					customers: r.customers
				})),
				statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
			});
		} else {
			const myOrders = filteredOrders.filter((o: any) => o.restaurantId === restaurantId);
			const myStats = calculateStats(myOrders);

			const myRevenue = myStats.revenue;
			const myOrdersCount = myStats.orders;
			const myCustomers = myStats.customers;
			const myAvgOrder = myStats.avgOrderValue;

			const restaurantStats: any[] = [];
			for (const r of allRestaurants) {
				const rOrders = filteredOrders.filter((o: any) => o.restaurantId === r.id);
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
			const ordersPercentile = getPercentile(myOrdersCount, ordersList);
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
				ordersVsAvg: avgOrd > 0 ? ((myOrdersCount / avgOrd) * 100).toFixed(0) : '0',
				avgOrderVsAvg: avgOrd > 0 ? ((myAvgOrder / avgOrd) * 100).toFixed(0) : '0'
			};

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

			return json({
				isSuper: false,
				period,
				stats: myStats,
				percentiles: {
					revenue: revenuePercentile,
					orders: ordersPercentile,
					avgOrder: avgOrderPercentile
				},
				comparison,
				benchmarks,
				rating
			});
		}
	} catch (error) {
		console.error('Error loading statistics:', error);
		return json({ error: 'Failed to load statistics' }, { status: 500 });
	}
};
