import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	canAdminAccessRestaurant,
	isSuperRestaurant,
	resolveRestaurantByDomain
} from '$lib/server/restaurantAccess';
import {
	buildRestaurantStats,
	calculateStats,
	getBenchmarksForRestaurant,
	getCategoryBreakdown,
	getCustomerInsights,
	getDailyStats,
	getDeliveryBreakdown,
	getMonthlyStats,
	getStatusBreakdown,
	getTopCustomers,
	getTopDishes,
	summarizeRestaurantSegments
} from '$lib/server/adminStatistics';

function getFilteredOrders(allOrders: any[], period: string) {
	if (period === 'all') return allOrders;

	const now = new Date();
	const days = period === '7days' ? 7 : 30;
	const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

	return allOrders.filter((order: any) => new Date(order.created) >= cutoff);
}

function getPreviousPeriodRevenue(orders: any[], period: string) {
	if (period === 'all') return 0;

	const days = period === '7days' ? 7 : 30;
	const now = new Date();
	const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
	const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

	return orders
		.filter((order: any) => {
			const created = new Date(order.created);
			return created >= previousStart && created < currentStart;
		})
		.reduce((sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0), 0);
}

export const GET: RequestHandler = async ({ url, locals, request }) => {
	const period = url.searchParams.get('period') || '30days';

	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const restaurant =
			locals.restaurant ||
			(await resolveRestaurantByDomain(locals.pb, request.headers.get('host') || ''));
		if (!restaurant) {
			return json({ error: 'Restaurant not found' }, { status: 404 });
		}

		if (!(await canAdminAccessRestaurant(locals.pb, locals.user, restaurant.id))) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const isSuper = isSuperRestaurant(restaurant);
		const restaurantId = restaurant.id;
		const allRestaurants = await locals.pb.collection('restaurants').getFullList({
			fields: 'id, name, isSuper'
		});
		const allDishes = await locals.pb.collection('dishes').getFullList({
			fields: 'id, name, category, restaurant, restaurantId'
		});
		const allOrders = await locals.pb.collection('orders').getFullList({
			filter: 'status = "Delivered"',
			sort: '-created'
		});
		const filteredOrders = getFilteredOrders(allOrders, period);
		const scopedOrders = isSuper
			? filteredOrders
			: filteredOrders.filter((order: any) => order.restaurantId === restaurantId);
		const scopedDishes = isSuper
			? allDishes
			: allDishes.filter(
					(dish: any) => dish.restaurant === restaurantId || dish.restaurantId === restaurantId
				);

		const scopedStats = calculateStats(scopedOrders);
		const payloadBase = {
			period,
			stats: scopedStats,
			statusBreakdown: getStatusBreakdown(scopedOrders),
			deliveryBreakdown: getDeliveryBreakdown(scopedOrders),
			categoryBreakdown: getCategoryBreakdown(scopedOrders, scopedDishes),
			topDishes: getTopDishes(scopedOrders),
			topCustomers: getTopCustomers(scopedOrders),
			customerInsights: getCustomerInsights(scopedOrders),
			dailyTrend: getDailyStats(scopedOrders, period === '7days' ? 7 : 30),
			monthlyTrend: getMonthlyStats(scopedOrders)
		};
		const previousPeriodRevenue = getPreviousPeriodRevenue(
			isSuper ? allOrders : allOrders.filter((order: any) => order.restaurantId === restaurantId),
			period
		);

		if (isSuper) {
			const restaurantStats = buildRestaurantStats(filteredOrders, allRestaurants) as any[];
			const totalRevenue = restaurantStats.reduce((sum, item) => sum + item.revenue, 0);
			const totalOrders = restaurantStats.reduce((sum, item) => sum + item.orders, 0);
			const totalCustomers = restaurantStats.reduce((sum, item) => sum + item.customers, 0);
			const totalPlatformCustomers = new Set(
				filteredOrders.map((order: any) => order.user).filter(Boolean)
			).size;
			const avgRevenuePerRestaurant =
				restaurantStats.length > 0 ? totalRevenue / restaurantStats.length : 0;
			const avgOrdersPerRestaurant =
				restaurantStats.length > 0 ? totalOrders / restaurantStats.length : 0;
			const restaurantRevenueList = restaurantStats
				.map((item) => item.revenue)
				.sort((a, b) => a - b);
			const restaurantOrdersList = restaurantStats.map((item) => item.orders).sort((a, b) => a - b);
			const platformRecurringStats = calculateStats(filteredOrders);

			return json({
				...payloadBase,
				isSuper: true,
				stats: {
					totalRevenue,
					totalOrders,
					totalCustomers,
					totalRestaurants: restaurantStats.length,
					avgRevenuePerRestaurant,
					avgOrdersPerRestaurant,
					medianRevenue:
						restaurantRevenueList.length > 0
							? restaurantRevenueList[Math.floor(restaurantRevenueList.length / 2)]
							: 0,
					medianOrders:
						restaurantOrdersList.length > 0
							? restaurantOrdersList[Math.floor(restaurantOrdersList.length / 2)]
							: 0,
					totalPlatformCustomers,
					platformRecurringRate: platformRecurringStats.recurringRate,
					platformAvgOrderValue: platformRecurringStats.avgOrderValue,
					peakDay: scopedStats.peakDay,
					peakDayOrders: scopedStats.peakDayOrders,
					peakHour: scopedStats.peakHour,
					peakHourOrders: scopedStats.peakHourOrders
				},
				myStats: scopedStats,
				topRestaurants: [...restaurantStats]
					.sort((a, b) => b.revenue - a.revenue)
					.slice(0, 10)
					.map((item) => ({
						name: item.name,
						revenue: item.revenue,
						orders: item.orders,
						customers: item.customers,
						isSuper: item.isSuper
					})),
				restaurantSegments: summarizeRestaurantSegments(restaurantStats)
			});
		}

		const nonSuperRestaurants = allRestaurants.filter((item: any) => !isSuperRestaurant(item));
		const regularRestaurantStats = buildRestaurantStats(
			filteredOrders,
			nonSuperRestaurants
		) as any[];
		const benchmarks = getBenchmarksForRestaurant(scopedStats, regularRestaurantStats);

		return json({
			...payloadBase,
			isSuper: false,
			percentiles: benchmarks.percentiles,
			comparison: benchmarks.comparison,
			benchmarks: benchmarks.benchmarks,
			rating: benchmarks.rating,
			trends: {
				last30DaysRevenue: payloadBase.dailyTrend.revenue.reduce((sum, value) => sum + value, 0),
				previous30DaysRevenue: previousPeriodRevenue,
				revenueGrowth:
					previousPeriodRevenue > 0
						? (
								((payloadBase.dailyTrend.revenue.reduce((sum, value) => sum + value, 0) -
									previousPeriodRevenue) /
									previousPeriodRevenue) *
								100
							).toFixed(1)
						: '0',
				dailyTrend: payloadBase.dailyTrend,
				monthlyTrend: payloadBase.monthlyTrend
			}
		});
	} catch (error) {
		console.error('Error loading statistics:', error);
		return json({ error: 'Failed to load statistics' }, { status: 500 });
	}
};
