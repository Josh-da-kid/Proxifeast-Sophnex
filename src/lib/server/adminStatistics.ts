import { isSuperRestaurant } from '$lib/server/restaurantAccess';

function getOrderAmount(order: any): number {
	return order.orderTotal || order.totalAmount || 0;
}

function getOrderDishKey(dish: any): string {
	return dish.id || dish.dishId || dish.name || 'unknown';
}

function getOrderDishName(dish: any): string {
	return dish.name || 'Unknown';
}

export function calculateStats(orders: any[]) {
	const uniqueCustomers = new Set(orders.map((o: any) => o.user).filter(Boolean));
	const totalCustomers = uniqueCustomers.size;
	const totalRevenue = orders.reduce((sum: number, order: any) => sum + getOrderAmount(order), 0);
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
	const dayCounts: Record<string, number> = {};

	orders.forEach((order: any) => {
		const created = new Date(order.created);
		const hour = created.getHours();
		hourCounts[hour] = (hourCounts[hour] || 0) + 1;

		const day = created.toLocaleDateString('en-US', { weekday: 'long' });
		dayCounts[day] = (dayCounts[day] || 0) + 1;
	});

	const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
	const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

	return {
		customers: totalCustomers,
		firstTimeCustomers,
		returningCustomers,
		orders: orders.length,
		revenue: totalRevenue,
		recurringRate: `${recurringRate}%`,
		avgOrderValue,
		peakHour: peakHour ? parseInt(peakHour[0], 10) : 12,
		peakHourOrders: peakHour ? peakHour[1] : 0,
		peakDay: peakDay ? peakDay[0] : 'N/A',
		peakDayOrders: peakDay ? peakDay[1] : 0
	};
}

export function getDailyStats(
	orders: any[],
	days: number
): { labels: string[]; revenue: number[]; orders: number[] } {
	const result = { labels: [] as string[], revenue: [] as number[], orders: [] as number[] };

	for (let i = days - 1; i >= 0; i--) {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() - i);
		const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		result.labels.push(dateStr);

		const dayOrders = orders.filter((o: any) => {
			const orderDate = new Date(o.created);
			return orderDate.toDateString() === d.toDateString();
		});

		result.revenue.push(dayOrders.reduce((sum: number, o: any) => sum + getOrderAmount(o), 0));
		result.orders.push(dayOrders.length);
	}

	return result;
}

export function getMonthlyStats(orders: any[]): {
	labels: string[];
	revenue: number[];
	orders: number[];
} {
	const months: Record<string, { revenue: number; orders: number }> = {};

	orders.forEach((order: any) => {
		const date = new Date(order.created);
		const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
		if (!months[monthKey]) {
			months[monthKey] = { revenue: 0, orders: 0 };
		}
		months[monthKey].revenue += getOrderAmount(order);
		months[monthKey].orders += 1;
	});

	const sortedMonths = Object.keys(months).sort(
		(a, b) => new Date(a).getTime() - new Date(b).getTime()
	);

	return {
		labels: sortedMonths,
		revenue: sortedMonths.map((m) => months[m].revenue),
		orders: sortedMonths.map((m) => months[m].orders)
	};
}

export function getStatusBreakdown(orders: any[]) {
	const statusCounts: Record<string, number> = {};
	orders.forEach((order: any) => {
		const status = order.status || 'unknown';
		statusCounts[status] = (statusCounts[status] || 0) + 1;
	});

	return Object.entries(statusCounts)
		.map(([status, count]) => ({ status, count }))
		.sort((a, b) => b.count - a.count);
}

export function getDeliveryBreakdown(orders: any[]) {
	const deliveryTypes: Record<string, number> = {};
	orders.forEach((order: any) => {
		const type = order.deliveryType || 'unknown';
		deliveryTypes[type] = (deliveryTypes[type] || 0) + 1;
	});

	const labels: Record<string, string> = {
		home: 'Delivery',
		restaurantPickup: 'Pickup',
		tableService: 'Dine-in',
		unknown: 'Other'
	};

	return Object.entries(deliveryTypes)
		.map(([type, count]) => ({ type, label: labels[type] || 'Other', count }))
		.sort((a, b) => b.count - a.count);
}

export function getTopDishes(orders: any[], limit = 8) {
	const dishCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};

	orders.forEach((order: any) => {
		if (!Array.isArray(order.dishes)) return;

		order.dishes.forEach((dish: any) => {
			const key = getOrderDishKey(dish);
			if (!dishCounts[key]) {
				dishCounts[key] = { name: getOrderDishName(dish), quantity: 0, revenue: 0 };
			}

			const quantity = dish.quantity || 1;
			const price = dish.amount || dish.price || 0;
			dishCounts[key].quantity += quantity;
			dishCounts[key].revenue += price * quantity;
		});
	});

	return Object.values(dishCounts)
		.sort((a, b) => (b.quantity === a.quantity ? b.revenue - a.revenue : b.quantity - a.quantity))
		.slice(0, limit);
}

export function getTopCustomers(orders: any[], limit = 8) {
	const customerMap: Record<
		string,
		{
			id: string;
			name: string;
			orders: number;
			revenue: number;
			email: string;
			lastOrder: string | null;
		}
	> = {};

	orders.forEach((order: any) => {
		if (!order.user) return;

		if (!customerMap[order.user]) {
			customerMap[order.user] = {
				id: order.user,
				name: order.name || 'Unknown',
				orders: 0,
				revenue: 0,
				email: order.email || '',
				lastOrder: null
			};
		}

		customerMap[order.user].orders += 1;
		customerMap[order.user].revenue += getOrderAmount(order);
		customerMap[order.user].lastOrder = order.created;
	});

	return Object.values(customerMap)
		.sort((a, b) => (b.revenue === a.revenue ? b.orders - a.orders : b.revenue - a.revenue))
		.slice(0, limit);
}

export function getCustomerInsights(orders: any[]) {
	const customerMap: Record<
		string,
		{
			id: string;
			name: string;
			revenue: number;
			orderCount: number;
			firstOrder: string;
			lastOrder: string;
		}
	> = {};

	orders.forEach((order: any) => {
		if (!order.user) return;

		if (!customerMap[order.user]) {
			customerMap[order.user] = {
				id: order.user,
				name: order.name || 'Unknown',
				revenue: 0,
				orderCount: 0,
				firstOrder: order.created,
				lastOrder: order.created
			};
		}

		customerMap[order.user].revenue += getOrderAmount(order);
		customerMap[order.user].orderCount += 1;
		if (new Date(order.created) < new Date(customerMap[order.user].firstOrder)) {
			customerMap[order.user].firstOrder = order.created;
		}
		if (new Date(order.created) > new Date(customerMap[order.user].lastOrder)) {
			customerMap[order.user].lastOrder = order.created;
		}
	});

	const customers = Object.values(customerMap);
	const totalRevenue = customers.reduce((sum, customer) => sum + customer.revenue, 0);
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const sixtyDaysAgo = new Date();
	sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

	const recentOrders = orders.filter((o: any) => new Date(o.created) >= thirtyDaysAgo);
	const previousPeriodOrders = orders.filter((o: any) => {
		const created = new Date(o.created);
		return created >= sixtyDaysAgo && created < thirtyDaysAgo;
	});

	const recentCustomerIds = new Set(recentOrders.map((o: any) => o.user).filter(Boolean));
	const previousCustomerIds = new Set(previousPeriodOrders.map((o: any) => o.user).filter(Boolean));
	const retained = [...recentCustomerIds].filter((id) => previousCustomerIds.has(id)).length;
	const retentionRate =
		previousCustomerIds.size > 0 ? Math.round((retained / previousCustomerIds.size) * 100) : 0;

	const churnedCustomers = customers.filter((customer) => {
		const daysSince = Math.floor(
			(Date.now() - new Date(customer.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
		);
		return daysSince > 30;
	}).length;

	let vipCount = 0;
	let premiumCount = 0;
	let regularCount = 0;
	let newCount = 0;

	customers.forEach((customer) => {
		if (customer.revenue >= 100000) vipCount += 1;
		else if (customer.revenue >= 50000) premiumCount += 1;
		else if (customer.orderCount >= 5) regularCount += 1;
		else newCount += 1;
	});

	return {
		totalCustomers: customers.length,
		newCustomers: customers.filter((customer) => customer.orderCount === 1).length,
		returningCustomers: customers.filter((customer) => customer.orderCount > 1).length,
		avgCustomerLTV: customers.length > 0 ? Math.round(totalRevenue / customers.length) : 0,
		retentionRate,
		churnedCustomers,
		newUsersLast30Days: customers.filter(
			(customer) => new Date(customer.firstOrder) >= thirtyDaysAgo
		).length,
		vipCount,
		premiumCount,
		regularCount,
		newCount
	};
}

export function getCategoryBreakdown(orders: any[], dishes: any[]) {
	const categoryByKey: Record<string, string> = {};
	dishes.forEach((dish: any) => {
		const category = dish.category || 'Uncategorized';
		if (dish.id) categoryByKey[dish.id] = category;
		if (dish.name) categoryByKey[dish.name] = category;
	});

	const categoryCounts: Record<string, number> = {};
	orders.forEach((order: any) => {
		if (!Array.isArray(order.dishes)) return;

		order.dishes.forEach((dish: any) => {
			const category =
				categoryByKey[dish.id] ||
				categoryByKey[dish.dishId] ||
				categoryByKey[dish.name] ||
				'Uncategorized';
			categoryCounts[category] = (categoryCounts[category] || 0) + (dish.quantity || 1);
		});
	});

	return Object.entries(categoryCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

export function buildRestaurantStats(allOrders: any[], allRestaurants: any[]): any[] {
	return allRestaurants
		.map((restaurant: any) => {
			const restaurantOrders = allOrders.filter(
				(order: any) => order.restaurantId === restaurant.id
			);
			if (restaurantOrders.length === 0) return null;

			const stats = calculateStats(restaurantOrders);
			return {
				id: restaurant.id,
				name: restaurant.name,
				isSuper: isSuperRestaurant(restaurant),
				revenue: stats.revenue,
				orders: stats.orders,
				customers: stats.customers,
				avgOrderValue: stats.avgOrderValue,
				recurringRate: parseInt(stats.recurringRate, 10)
			};
		})
		.filter(Boolean) as any[];
}

export function summarizeRestaurantSegments(restaurantStats: any[]) {
	const summarize = (restaurants: any[]) => {
		const totalRevenue = restaurants.reduce((sum, restaurant) => sum + restaurant.revenue, 0);
		const totalOrders = restaurants.reduce((sum, restaurant) => sum + restaurant.orders, 0);
		return {
			count: restaurants.length,
			revenue: totalRevenue,
			orders: totalOrders,
			avgRevenue: restaurants.length > 0 ? Math.round(totalRevenue / restaurants.length) : 0,
			avgOrders: restaurants.length > 0 ? Math.round(totalOrders / restaurants.length) : 0
		};
	};

	const superRestaurants = restaurantStats.filter((restaurant) => restaurant.isSuper);
	const regularRestaurants = restaurantStats.filter((restaurant) => !restaurant.isSuper);

	return {
		superRestaurants: summarize(superRestaurants),
		regularRestaurants: summarize(regularRestaurants)
	};
}

export function getPercentile(value: number, sortedList: number[]): number {
	if (sortedList.length === 0) return 0;
	const lowerCount = sortedList.filter((item) => item < value).length;
	return Math.max(1, Math.round((lowerCount / sortedList.length) * 100));
}

export function getBenchmarksForRestaurant(myStats: any, restaurantStats: any[]) {
	const revenues = restaurantStats.map((restaurant) => restaurant.revenue).sort((a, b) => a - b);
	const orders = restaurantStats.map((restaurant) => restaurant.orders).sort((a, b) => a - b);
	const avgOrderValues = restaurantStats
		.map((restaurant) => restaurant.avgOrderValue)
		.sort((a, b) => a - b);

	const avgRevenue =
		restaurantStats.length > 0
			? restaurantStats.reduce((sum, restaurant) => sum + restaurant.revenue, 0) /
				restaurantStats.length
			: 0;
	const avgOrders =
		restaurantStats.length > 0
			? restaurantStats.reduce((sum, restaurant) => sum + restaurant.orders, 0) /
				restaurantStats.length
			: 0;
	const avgCustomers =
		restaurantStats.length > 0
			? restaurantStats.reduce((sum, restaurant) => sum + restaurant.customers, 0) /
				restaurantStats.length
			: 0;
	const avgOrderValue =
		restaurantStats.length > 0
			? restaurantStats.reduce((sum, restaurant) => sum + restaurant.avgOrderValue, 0) /
				restaurantStats.length
			: 0;

	const percentiles = {
		revenue: getPercentile(myStats.revenue, revenues),
		orders: getPercentile(myStats.orders, orders),
		avgOrder: getPercentile(myStats.avgOrderValue, avgOrderValues)
	};

	const comparison = {
		revenueVsAvg: avgRevenue > 0 ? ((myStats.revenue / avgRevenue) * 100).toFixed(0) : '0',
		ordersVsAvg: avgOrders > 0 ? ((myStats.orders / avgOrders) * 100).toFixed(0) : '0',
		avgOrderVsAvg:
			avgOrderValue > 0 ? ((myStats.avgOrderValue / avgOrderValue) * 100).toFixed(0) : '0'
	};

	const benchmarks = {
		avgRevenue: Math.round(avgRevenue),
		avgOrders: Math.round(avgOrders),
		avgCustomers: Math.round(avgCustomers),
		totalRestaurants: restaurantStats.length
	};

	const avgPercentile = (percentiles.revenue + percentiles.orders + percentiles.avgOrder) / 3;
	let rating = 'Needs Improvement';
	if (avgPercentile >= 80) rating = 'Excellent';
	else if (avgPercentile >= 60) rating = 'Good';
	else if (avgPercentile >= 40) rating = 'Average';
	else if (avgPercentile >= 20) rating = 'Below Average';

	return { percentiles, comparison, benchmarks, rating };
}
