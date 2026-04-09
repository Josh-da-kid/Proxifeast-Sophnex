import type { PageServerLoad } from '../$types';
import { isSuperadmin } from '$lib/server/restaurantAccess';

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
	const newCustomers = Object.values(userOrderCounts).filter((count: any) => count === 1).length;
	const returningCustomers = Object.values(userOrderCounts).filter(
		(count: any) => count > 1
	).length;
	const recurringRate =
		totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(0) : '0';

	return {
		customers: totalCustomers,
		orders: orders.length,
		revenue: totalRevenue,
		recurringRate: `${recurringRate}%`,
		avgOrderValue
	};
}

function getOrdersByDateRange(orders: any[], startDate: Date, endDate: Date) {
	return orders.filter((order: any) => {
		const orderDate = new Date(order.created);
		return orderDate >= startDate && orderDate <= endDate;
	});
}

export const load: PageServerLoad = async ({ locals, parent }) => {
	try {
		const layoutData = await parent();
		const restaurant = layoutData.restaurant;
		const restaurantId = layoutData.restaurantId;
		const isSuper = await isSuperadmin(locals.pb, locals.user);

		if (!restaurantId) {
			throw new Error('Restaurant context not found');
		}

		const restaurantFilter = isSuper ? '' : `restaurantId = "${restaurantId}" && `;

		const deliveredOrders = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}status = "Delivered"`,
			sort: '-created'
		});

		// Get unique customers
		const uniqueCustomers = new Set(deliveredOrders.map((o: any) => o.user).filter(Boolean));
		const totalCustomers = uniqueCustomers.size;

		// Calculate total revenue
		const totalRevenue = deliveredOrders.reduce(
			(sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0),
			0
		);

		// Calculate average order value
		const avgOrderValue =
			deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0;

		// Get last 30 days for orders over time
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentOrders = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}status = "Delivered" && created >= "${thirtyDaysAgo.toISOString()}"`,
			sort: '-created'
		});

		// Group orders by date for line chart
		const ordersByDate: Record<string, number> = {};
		recentOrders.forEach((order: any) => {
			const date = new Date(order.created).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
			ordersByDate[date] = (ordersByDate[date] || 0) + 1;
		});

		// Get last 7 days labels
		const last7Days: string[] = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			last7Days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
		}

		const ordersOverTime = {
			labels: last7Days,
			datasets: [
				{
					label: 'Orders',
					data: last7Days.map((date) => ordersByDate[date] || 0),
					borderColor: '#475569',
					backgroundColor: 'rgba(71, 85, 105, 0.1)',
					tension: 0.3,
					fill: true
				}
			]
		};

		// Get payment method breakdown (if available in orders)
		// Since we don't have payment method in orders, we'll use delivery types as breakdown
		const deliveryTypes = deliveredOrders.reduce((acc: Record<string, number>, order: any) => {
			const type = order.deliveryType || 'unknown';
			acc[type] = (acc[type] || 0) + 1;
			return acc;
		}, {});

		const orderBreakdown = {
			labels: Object.keys(deliveryTypes).map((t) =>
				t === 'home'
					? 'Delivery'
					: t === 'restaurantPickup'
						? 'Pickup'
						: t === 'tableService'
							? 'Dine-in'
							: 'Other'
			),
			datasets: [
				{
					label: 'Orders',
					data: Object.values(deliveryTypes),
					backgroundColor: ['#475569', '#0ea5e9', '#10b981', '#f59e0b']
				}
			]
		};

		// Calculate new vs returning customers (based on order count per user)
		const userOrderCounts: Record<string, number> = {};
		deliveredOrders.forEach((order: any) => {
			if (order.user) {
				userOrderCounts[order.user] = (userOrderCounts[order.user] || 0) + 1;
			}
		});

		const newCustomers = Object.values(userOrderCounts).filter((count: any) => count === 1).length;
		const returningCustomers = Object.values(userOrderCounts).filter(
			(count: any) => count > 1
		).length;

		const newVsReturning = {
			labels: ['New Customers', 'Returning Customers'],
			datasets: [
				{
					data: [newCustomers, returningCustomers],
					backgroundColor: ['#0ea5e9', '#f472b6']
				}
			]
		};

		// Get top dishes by counting appearances in orders
		const dishCounts: Record<string, number> = {};
		deliveredOrders.forEach((order: any) => {
			if (order.dishes && Array.isArray(order.dishes)) {
				order.dishes.forEach((dish: any) => {
					const name = dish.name || 'Unknown';
					dishCounts[name] = (dishCounts[name] || 0) + dish.quantity;
				});
			}
		});

		const topDishes = Object.entries(dishCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([dish, sales]) => ({ dish, sales }));

		// Get recent activity (last 10 delivered orders)
		const recentActivity = deliveredOrders.slice(0, 10).map((order: any) => ({
			time: new Date(order.created).toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit'
			}),
			text: `${order.name || 'Guest'} placed an order ₦${(order.orderTotal || order.totalAmount || 0).toLocaleString()}`,
			avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(order.name || 'G')}&background=random`
		}));

		// Get top customers by order count
		const topCustomers = Object.entries(userOrderCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([userId, orders]) => ({
				name: deliveredOrders.find((o: any) => o.user === userId)?.name || 'Unknown',
				orders,
				avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(deliveredOrders.find((o: any) => o.user === userId)?.name || 'U')}&background=random`
			}));

		const currentStats = calculateStats(deliveredOrders);

		const now = new Date();
		const currentPeriodStart = new Date();
		currentPeriodStart.setDate(now.getDate() - 30);
		const previousPeriodStart = new Date();
		previousPeriodStart.setDate(now.getDate() - 60);

		const prevPeriodOrders = getOrdersByDateRange(
			deliveredOrders,
			previousPeriodStart,
			currentPeriodStart
		);
		const prevPeriodStats = calculateStats(prevPeriodOrders);

		function calculateChange(
			current: number,
			previous: number
		): { value: number; isPositive: boolean } {
			if (previous === 0) return { value: 0, isPositive: true };
			const change = ((current - previous) / previous) * 100;
			return { value: Math.abs(change), isPositive: change >= 0 };
		}

		const comparison = {
			customers: calculateChange(currentStats.customers, prevPeriodStats.customers),
			orders: calculateChange(currentStats.orders, prevPeriodStats.orders),
			revenue: calculateChange(currentStats.revenue, prevPeriodStats.revenue),
			recurringRate: calculateChange(
				parseFloat(currentStats.recurringRate),
				parseFloat(prevPeriodStats.recurringRate)
			)
		};

		return {
			stats: currentStats,
			prevStats: prevPeriodStats,
			comparison,
			charts: {
				ordersOverTime,
				orderBreakdown,
				newVsReturning
			},
			tables: {
				topDishes,
				topCustomers,
				recentActivity
			},
			allOrders: deliveredOrders
		};
	} catch (error) {
		console.error('Error loading analytics:', error);
		return {
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
				orderBreakdown: { labels: [], datasets: [] },
				newVsReturning: { labels: [], datasets: [] }
			},
			tables: {
				topDishes: [],
				topCustomers: [],
				recentActivity: []
			},
			allOrders: []
		};
	}
};
