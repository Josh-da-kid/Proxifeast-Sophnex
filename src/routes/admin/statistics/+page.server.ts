import type { PageServerLoad } from './$types';
import { isSuperRestaurant } from '$lib/server/restaurantAccess';
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

export const load: PageServerLoad = async ({ locals, parent }) => {
	try {
		const layoutData = await parent();
		const restaurant = layoutData.restaurant;
		const restaurantId = layoutData.restaurantId;
		const restaurantName = restaurant?.name || 'Store';
		const isSuper = isSuperRestaurant(restaurant);

		if (!restaurantId || !restaurant) {
			throw new Error('Restaurant context not found');
		}

		const allRestaurants = await locals.pb.collection('restaurants').getFullList({
			fields: 'id, name, isSuper'
		});
		const allDishes = await locals.pb.collection('dishes').getFullList({
			fields: 'id, name, category, restaurant, restaurantId'
		});

		const allDeliveredOrders = await locals.pb.collection('orders').getFullList({
			filter: 'status = "Delivered"',
			sort: '-created'
		});

		const scopedOrders = isSuper
			? allDeliveredOrders
			: allDeliveredOrders.filter((order: any) => order.restaurantId === restaurantId);
		const myStats = calculateStats(scopedOrders);
		const dailyTrend = getDailyStats(scopedOrders, 30);
		const monthlyTrend = getMonthlyStats(scopedOrders);
		const topDishes = getTopDishes(scopedOrders);
		const topCustomers = getTopCustomers(scopedOrders);
		const customerInsights = getCustomerInsights(scopedOrders);
		const statusBreakdown = getStatusBreakdown(scopedOrders);
		const deliveryBreakdown = getDeliveryBreakdown(scopedOrders);
		const scopedDishes = isSuper
			? allDishes
			: allDishes.filter(
					(dish: any) => dish.restaurant === restaurantId || dish.restaurantId === restaurantId
				);
		const categoryBreakdown = getCategoryBreakdown(scopedOrders, scopedDishes);

		if (isSuper) {
			const restaurantStats = buildRestaurantStats(allDeliveredOrders, allRestaurants) as any[];
			const totalRevenue = restaurantStats.reduce((sum, r) => sum + r.revenue, 0);
			const totalOrders = restaurantStats.reduce((sum, r) => sum + r.orders, 0);
			const totalCustomers = restaurantStats.reduce((sum, r) => sum + r.customers, 0);
			const totalPlatformCustomers = new Set(
				allDeliveredOrders.map((order: any) => order.user).filter(Boolean)
			).size;
			const avgRevenuePerRestaurant =
				restaurantStats.length > 0 ? totalRevenue / restaurantStats.length : 0;
			const avgOrdersPerRestaurant =
				restaurantStats.length > 0 ? totalOrders / restaurantStats.length : 0;
			const restaurantRevenueList = restaurantStats
				.map((restaurantStatsItem) => restaurantStatsItem.revenue)
				.sort((a, b) => a - b);
			const restaurantOrdersList = restaurantStats
				.map((restaurantStatsItem) => restaurantStatsItem.orders)
				.sort((a, b) => a - b);
			const medianRevenue =
				restaurantRevenueList.length > 0
					? restaurantRevenueList[Math.floor(restaurantRevenueList.length / 2)]
					: 0;
			const medianOrders =
				restaurantOrdersList.length > 0
					? restaurantOrdersList[Math.floor(restaurantOrdersList.length / 2)]
					: 0;
			const platformRecurringStats = calculateStats(allDeliveredOrders);

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
					platformAvgOrderValue: platformRecurringStats.avgOrderValue,
					peakDay: myStats.peakDay,
					peakDayOrders: myStats.peakDayOrders,
					peakHour: myStats.peakHour,
					peakHourOrders: myStats.peakHourOrders
				},
				myStats,
				topRestaurants: [...restaurantStats]
					.sort((a, b) => b.revenue - a.revenue)
					.slice(0, 10)
					.map((restaurantStatsItem) => ({
						name: restaurantStatsItem.name,
						revenue: restaurantStatsItem.revenue,
						orders: restaurantStatsItem.orders,
						customers: restaurantStatsItem.customers,
						isSuper: restaurantStatsItem.isSuper
					})),
				restaurantSegments: summarizeRestaurantSegments(restaurantStats),
				categoryBreakdown,
				deliveryBreakdown,
				statusBreakdown,
				topDishes,
				topCustomers,
				customerInsights,
				dailyTrend,
				monthlyTrend
			};
		}

		const nonSuperRestaurants = allRestaurants.filter(
			(restaurantItem: any) => !isSuperRestaurant(restaurantItem)
		);
		const regularRestaurantStats = buildRestaurantStats(
			allDeliveredOrders,
			nonSuperRestaurants
		) as any[];
		const { percentiles, comparison, benchmarks, rating } = getBenchmarksForRestaurant(
			myStats,
			regularRestaurantStats
		);
		const last30DaysRevenue = dailyTrend.revenue.reduce((sum, value) => sum + value, 0);
		const previous30DaysStart = new Date();
		previous30DaysStart.setDate(previous30DaysStart.getDate() - 60);
		const previous30DaysEnd = new Date();
		previous30DaysEnd.setDate(previous30DaysEnd.getDate() - 30);
		const previous30DaysRevenue = scopedOrders
			.filter((order: any) => {
				const created = new Date(order.created);
				return created >= previous30DaysStart && created < previous30DaysEnd;
			})
			.reduce((sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0), 0);
		const revenueGrowth =
			previous30DaysRevenue > 0
				? (((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100).toFixed(1)
				: '0';

		return {
			isSuper: false,
			restaurantName,
			stats: myStats,
			percentiles,
			comparison,
			benchmarks,
			rating,
			statusBreakdown,
			deliveryBreakdown,
			categoryBreakdown,
			topDishes,
			topCustomers,
			customerInsights,
			trends: {
				last30DaysRevenue,
				previous30DaysRevenue,
				revenueGrowth,
				dailyTrend,
				monthlyTrend
			}
		};
	} catch (error) {
		console.error('Error loading statistics:', error);
		return {
			isSuper: false,
			stats: { customers: 0, orders: 0, revenue: 0, recurringRate: '0%', avgOrderValue: 0 },
			percentiles: { revenue: 0, orders: 0, avgOrder: 0 },
			comparison: { revenueVsAvg: '0', ordersVsAvg: '0', avgOrderVsAvg: '0' },
			benchmarks: { avgRevenue: 0, avgOrders: 0, avgCustomers: 0, totalRestaurants: 0 },
			rating: 'N/A',
			statusBreakdown: [],
			deliveryBreakdown: [],
			categoryBreakdown: [],
			topDishes: [],
			topCustomers: [],
			customerInsights: {
				totalCustomers: 0,
				newCustomers: 0,
				returningCustomers: 0,
				avgCustomerLTV: 0,
				retentionRate: 0,
				churnedCustomers: 0,
				newUsersLast30Days: 0,
				vipCount: 0,
				premiumCount: 0,
				regularCount: 0,
				newCount: 0
			},
			trends: {
				last30DaysRevenue: 0,
				previous30DaysRevenue: 0,
				revenueGrowth: '0',
				dailyTrend: { labels: [], revenue: [], orders: [] },
				monthlyTrend: { labels: [], revenue: [], orders: [] }
			},
			dailyTrend: { labels: [], revenue: [], orders: [] },
			monthlyTrend: { labels: [], revenue: [], orders: [] },
			topRestaurants: [],
			restaurantSegments: {
				superRestaurants: { count: 0, revenue: 0, orders: 0, avgRevenue: 0, avgOrders: 0 },
				regularRestaurants: { count: 0, revenue: 0, orders: 0, avgRevenue: 0, avgOrders: 0 }
			}
		};
	}
};
