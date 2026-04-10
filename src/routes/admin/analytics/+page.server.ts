import type { PageServerLoad } from '../$types';
import { isSuperRestaurant } from '$lib/server/restaurantAccess';
import {
	buildRestaurantStats,
	calculateStats,
	getBenchmarksForRestaurant,
	getCategoryBreakdown,
	getCustomerInsights,
	getDailyStats,
	getDeliveryBreakdown,
	getTopCustomers,
	getTopDishes,
	summarizeRestaurantSegments
} from '$lib/server/adminStatistics';

function getOrdersByDateRange(orders: any[], startDate: Date, endDate: Date) {
	return orders.filter((order: any) => {
		const orderDate = new Date(order.created);
		return orderDate >= startDate && orderDate <= endDate;
	});
}

function calculateChange(
	current: number,
	previous: number
): { value: number; isPositive: boolean } {
	if (previous === 0) return { value: 0, isPositive: true };
	const change = ((current - previous) / previous) * 100;
	return { value: Math.abs(change), isPositive: change >= 0 };
}

function getOrdersOverTimeChart(orders: any[], days: number) {
	const daily = getDailyStats(orders, days);
	return {
		labels: daily.labels,
		datasets: [
			{
				label: 'Orders',
				data: daily.orders,
				borderColor: '#475569',
				backgroundColor: 'rgba(71, 85, 105, 0.1)',
				tension: 0.3,
				fill: true
			}
		]
	};
}

function getRevenueOverTimeChart(orders: any[], days: number) {
	const daily = getDailyStats(orders, days);
	return {
		labels: daily.labels,
		datasets: [
			{
				label: 'Revenue',
				data: daily.revenue,
				borderColor: '#10b981',
				backgroundColor: 'rgba(16, 185, 129, 0.12)',
				tension: 0.3,
				fill: true
			}
		]
	};
}

function getHourlyDistributionChart(orders: any[]) {
	const hourly = new Array(24).fill(0);
	orders.forEach((order: any) => {
		hourly[new Date(order.created).getHours()] += 1;
	});

	return {
		labels: Array.from({ length: 24 }, (_, hour) => {
			if (hour === 0) return '12am';
			if (hour === 12) return '12pm';
			return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
		}),
		datasets: [
			{
				label: 'Orders',
				data: hourly,
				backgroundColor: 'rgba(245, 158, 11, 0.8)',
				borderRadius: 4
			}
		]
	};
}

function getWeekdayDistribution(orders: any[]) {
	const weekdayOrder = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday'
	];
	const counts: Record<string, number> = Object.fromEntries(weekdayOrder.map((day) => [day, 0]));

	orders.forEach((order: any) => {
		const weekday = new Date(order.created).toLocaleDateString('en-US', { weekday: 'long' });
		counts[weekday] = (counts[weekday] || 0) + 1;
	});

	return weekdayOrder.map((day) => ({ day, orders: counts[day] || 0 }));
}

function buildRecentActivity(orders: any[]) {
	return orders.slice(0, 12).map((order: any) => ({
		id: order.id,
		customerName: order.name || 'Guest',
		amount: order.orderTotal || order.totalAmount || 0,
		deliveryType: order.deliveryType || 'unknown',
		timestamp: order.created,
		initials: (order.name || 'G')
			.split(' ')
			.map((part: string) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	}));
}

export const load: PageServerLoad = async ({ locals, parent }) => {
	try {
		const layoutData = await parent();
		const restaurant = layoutData.restaurant;
		const restaurantId = layoutData.restaurantId;
		const isSuper = isSuperRestaurant(restaurant);

		if (!restaurantId || !restaurant) {
			throw new Error('Restaurant context not found');
		}

		const allOrders = await locals.pb.collection('orders').getFullList({
			filter: isSuper
				? 'status = "Delivered"'
				: `restaurantId = "${restaurantId}" && status = "Delivered"`,
			sort: '-created'
		});
		const allRestaurants = isSuper
			? await locals.pb.collection('restaurants').getFullList({ fields: 'id,name,isSuper' })
			: [];
		const allDishes = await locals.pb.collection('dishes').getFullList({
			fields: 'id,name,category,restaurant,restaurantId'
		});

		const currentStats = calculateStats(allOrders);
		const customerInsights = getCustomerInsights(allOrders);
		const deliveryBreakdown = getDeliveryBreakdown(allOrders);
		const categoryBreakdown = getCategoryBreakdown(
			allOrders,
			isSuper
				? allDishes
				: allDishes.filter(
						(dish: any) => dish.restaurant === restaurantId || dish.restaurantId === restaurantId
					)
		);
		const topDishes = getTopDishes(allOrders, 8);
		const topCustomers = getTopCustomers(allOrders, 8);

		const now = new Date();
		const currentPeriodStart = new Date();
		currentPeriodStart.setDate(now.getDate() - 30);
		const previousPeriodStart = new Date();
		previousPeriodStart.setDate(now.getDate() - 60);

		const prevPeriodOrders = getOrdersByDateRange(
			allOrders,
			previousPeriodStart,
			currentPeriodStart
		);
		const prevPeriodStats = calculateStats(prevPeriodOrders);

		const comparison = {
			customers: calculateChange(currentStats.customers, prevPeriodStats.customers),
			orders: calculateChange(currentStats.orders, prevPeriodStats.orders),
			revenue: calculateChange(currentStats.revenue, prevPeriodStats.revenue),
			recurringRate: calculateChange(
				parseFloat(currentStats.recurringRate),
				parseFloat(prevPeriodStats.recurringRate)
			)
		};

		const charts = {
			ordersOverTime: getOrdersOverTimeChart(allOrders, 30),
			revenueOverTime: getRevenueOverTimeChart(allOrders, 30),
			orderBreakdown: {
				labels: deliveryBreakdown.map((item) => item.label),
				datasets: [
					{
						label: 'Orders',
						data: deliveryBreakdown.map((item) => item.count),
						backgroundColor: ['#475569', '#0ea5e9', '#10b981', '#f59e0b']
					}
				]
			},
			newVsReturning: {
				labels: ['New Customers', 'Returning Customers'],
				datasets: [
					{
						data: [customerInsights.newCustomers, customerInsights.returningCustomers],
						backgroundColor: ['#0ea5e9', '#f472b6']
					}
				]
			},
			hourlyDistribution: getHourlyDistributionChart(allOrders)
		};

		const tables: any = {
			topDishes,
			topCustomers,
			recentActivity: buildRecentActivity(allOrders),
			weekdayPerformance: getWeekdayDistribution(allOrders),
			categoryBreakdown,
			deliveryBreakdown
		};

		if (isSuper) {
			const restaurantStats = buildRestaurantStats(allOrders, allRestaurants);
			tables.topRestaurants = [...restaurantStats]
				.sort((a, b) => b.revenue - a.revenue)
				.slice(0, 8);
			return {
				isSuper,
				restaurantName: restaurant?.name || 'Store',
				stats: currentStats,
				prevStats: prevPeriodStats,
				comparison,
				charts,
				tables,
				allOrders,
				customerInsights,
				restaurantSegments: summarizeRestaurantSegments(restaurantStats)
			};
		}

		const benchmarkPool = buildRestaurantStats(
			await locals.pb
				.collection('orders')
				.getFullList({ filter: 'status = "Delivered"', sort: '-created' }),
			(await locals.pb.collection('restaurants').getFullList({ fields: 'id,name,isSuper' })).filter(
				(item: any) => !isSuperRestaurant(item)
			)
		);

		return {
			isSuper,
			restaurantName: restaurant?.name || 'Store',
			stats: currentStats,
			prevStats: prevPeriodStats,
			comparison,
			charts,
			tables,
			allOrders,
			customerInsights,
			benchmarks: getBenchmarksForRestaurant(currentStats, benchmarkPool)
		};
	} catch (error) {
		console.error('Error loading analytics:', error);
		return {
			isSuper: false,
			restaurantName: 'Store',
			stats: {
				customers: 0,
				orders: 0,
				revenue: 0,
				recurringRate: '0%',
				avgOrderValue: 0
			},
			prevStats: {
				customers: 0,
				orders: 0,
				revenue: 0,
				recurringRate: '0%',
				avgOrderValue: 0
			},
			comparison: {
				customers: { value: 0, isPositive: true },
				orders: { value: 0, isPositive: true },
				revenue: { value: 0, isPositive: true },
				recurringRate: { value: 0, isPositive: true }
			},
			charts: {
				ordersOverTime: { labels: [], datasets: [] },
				revenueOverTime: { labels: [], datasets: [] },
				orderBreakdown: { labels: [], datasets: [] },
				newVsReturning: { labels: [], datasets: [] },
				hourlyDistribution: { labels: [], datasets: [] }
			},
			tables: {
				topDishes: [],
				topCustomers: [],
				recentActivity: [],
				weekdayPerformance: [],
				categoryBreakdown: [],
				deliveryBreakdown: []
			},
			allOrders: [],
			customerInsights: {
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
			}
		};
	}
};
