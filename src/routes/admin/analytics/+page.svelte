<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import Chart from 'chart.js/auto';

	let { data } = $props();

	const defaultStats = {
		customers: 0,
		orders: 0,
		revenue: 0,
		recurringRate: '0%',
		avgOrderValue: 0
	};

	const defaultComparison = {
		customers: { value: 0, isPositive: true },
		orders: { value: 0, isPositive: true },
		revenue: { value: 0, isPositive: true },
		recurringRate: { value: 0, isPositive: true }
	};

	const stats = data.stats ?? defaultStats;
	const comparison = data.comparison ?? defaultComparison;
	const allOrders = data.allOrders ?? [];

	const charts = data.charts ?? {
		ordersOverTime: { labels: [], datasets: [] },
		orderBreakdown: { labels: [], datasets: [] },
		newVsReturning: { labels: [], datasets: [] }
	};

	const defaultTables = {
		topDishes: [],
		topCustomers: [],
		recentActivity: []
	};
	const tables = data.tables ?? defaultTables;

	let selectedPeriod = $state('last30');
	let customStartDate = $state('');
	let customEndDate = $state('');
	let showDatePicker = $state(false);

	const periods = [
		{ value: 'today', label: 'Today' },
		{ value: 'yesterday', label: 'Yesterday' },
		{ value: 'thisWeek', label: 'This Week' },
		{ value: 'last7', label: 'Last 7 Days' },
		{ value: 'last30', label: 'Last 30 Days' },
		{ value: 'custom', label: 'Custom Range' }
	];

	function getDateRange(period: string): { start: Date; end: Date } {
		const now = new Date();
		now.setHours(23, 59, 59, 999);
		const start = new Date();
		start.setHours(0, 0, 0, 0);

		switch (period) {
			case 'today':
				return { start, end: now };
			case 'yesterday':
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				yesterday.setHours(0, 0, 0, 0);
				const yesterdayEnd = new Date(yesterday);
				yesterdayEnd.setHours(23, 59, 59, 999);
				return { start: yesterday, end: yesterdayEnd };
			case 'thisWeek': {
				const weekStart = new Date(now);
				weekStart.setDate(now.getDate() - now.getDay());
				weekStart.setHours(0, 0, 0, 0);
				return { start: weekStart, end: now };
			}
			case 'last7':
				start.setDate(start.getDate() - 6);
				return { start, end: now };
			case 'last30':
				start.setDate(start.getDate() - 29);
				return { start, end: now };
			case 'custom':
				if (customStartDate && customEndDate) {
					return {
						start: new Date(customStartDate),
						end: new Date(customEndDate + 'T23:59:59')
					};
				}
				start.setDate(start.getDate() - 29);
				return { start, end: now };
			default:
				start.setDate(start.getDate() - 29);
				return { start, end: now };
		}
	}

	function filterDataByPeriod(orders: any[], period: string) {
		const { start, end } = getDateRange(period);
		return orders.filter((order: any) => {
			const orderDate = new Date(order.created);
			return orderDate >= start && orderDate <= end;
		});
	}

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

		return {
			customers: totalCustomers,
			orders: orders.length,
			revenue: totalRevenue,
			recurringRate: `${recurringRate}%`,
			avgOrderValue
		};
	}

	function getPreviousPeriodRange(period: string): { start: Date; end: Date } {
		const { start, end } = getDateRange(period);
		const duration = end.getTime() - start.getTime();
		const prevEnd = new Date(start.getTime() - 1);
		const prevStart = new Date(prevEnd.getTime() - duration);
		return { start: prevStart, end: prevEnd };
	}

	function filterPreviousPeriod(orders: any[], period: string) {
		const { start, end } = getPreviousPeriodRange(period);
		return orders.filter((order: any) => {
			const orderDate = new Date(order.created);
			return orderDate >= start && orderDate <= end;
		});
	}

	function calculateComparison(current: any, previous: any) {
		const calc = (curr: number, prev: number) => {
			if (prev === 0) return { value: 0, isPositive: true };
			const change = ((curr - prev) / prev) * 100;
			return { value: Math.abs(change), isPositive: change >= 0 };
		};

		return {
			customers: calc(current.customers, previous.customers),
			orders: calc(current.orders, previous.orders),
			revenue: calc(current.revenue, previous.revenue),
			recurringRate: calc(parseFloat(current.recurringRate), parseFloat(previous.recurringRate))
		};
	}

	let filteredStats = $derived(calculateStats(filterDataByPeriod(allOrders, selectedPeriod)));
	let filteredComparison = $derived(
		calculateComparison(
			filteredStats,
			calculateStats(filterPreviousPeriod(allOrders, selectedPeriod))
		)
	);

	let filteredRecentActivity = $derived.by(() => {
		const orders = filterDataByPeriod(allOrders, selectedPeriod);
		return orders.slice(0, 10).map((order: any) => ({
			time: formatActivityTime(order.created),
			text: `${order.name || 'Guest'} placed an order ₦${(order.orderTotal || order.totalAmount || 0).toLocaleString()}`,
			avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(order.name || 'G')}&background=random`,
			fullDate: new Date(order.created).toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			}),
			orderId: order.id
		}));
	});

	let filteredTopDishes = $derived.by(() => {
		const orders = filterDataByPeriod(allOrders, selectedPeriod);
		const dishCounts: Record<string, number> = {};
		orders.forEach((order: any) => {
			if (order.dishes && Array.isArray(order.dishes)) {
				order.dishes.forEach((dish: any) => {
					const name = dish.name || 'Unknown';
					dishCounts[name] = (dishCounts[name] || 0) + dish.quantity;
				});
			}
		});
		return Object.entries(dishCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([dish, sales]) => ({ dish, sales }));
	});

	let filteredTopCustomers = $derived.by(() => {
		const orders = filterDataByPeriod(allOrders, selectedPeriod);
		const userOrderCounts: Record<string, { count: number; name: string }> = {};
		orders.forEach((order: any) => {
			if (order.user) {
				if (!userOrderCounts[order.user]) {
					userOrderCounts[order.user] = { count: 0, name: order.name || 'Unknown' };
				}
				userOrderCounts[order.user].count++;
			}
		});
		return Object.entries(userOrderCounts)
			.sort((a, b) => b[1].count - a[1].count)
			.slice(0, 5)
			.map(([userId, data]: [string, any]) => ({
				name: data.name,
				orders: data.count,
				avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
			}));
	});

	function formatActivityTime(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		const isToday = date.toDateString() === now.toDateString();
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);
		const isYesterday = date.toDateString() === yesterday.toDateString();

		if (isToday) {
			return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
		}
		if (isYesterday) {
			return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
		}
		return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
	}

	function getPeriodLabel(period: string): string {
		const p = periods.find((p) => p.value === period);
		if (period === 'custom' && customStartDate && customEndDate) {
			const start = new Date(customStartDate).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
			const end = new Date(customEndDate).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
			return `${start} - ${end}`;
		}
		return p?.label || 'Last 30 Days';
	}

	function getChartDataForPeriod(period: string) {
		const orders = filterDataByPeriod(allOrders, period);
		const { start, end } = getDateRange(period);
		const duration = end.getTime() - start.getTime();
		const dayMs = 86400000;
		const days = Math.ceil(duration / dayMs);

		const ordersByDate: Record<string, number> = {};
		orders.forEach((order: any) => {
			const date = new Date(order.created).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
			ordersByDate[date] = (ordersByDate[date] || 0) + 1;
		});

		const labels: string[] = [];
		const currentDate = new Date(start);
		while (currentDate <= end) {
			labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return {
			labels: labels.slice(-14),
			datasets: [
				{
					label: 'Orders',
					data: labels.slice(-14).map((date) => ordersByDate[date] || 0),
					borderColor: '#475569',
					backgroundColor: 'rgba(71, 85, 105, 0.1)',
					tension: 0.3,
					fill: true
				}
			]
		};
	}

	let chartData = $derived(getChartDataForPeriod(selectedPeriod));

	onMount(() => {
		const lineCtx = document.getElementById('ordersChart')?.getContext('2d');
		let lineChart: Chart | null = null;

		if (lineCtx) {
			lineChart = new Chart(lineCtx, {
				type: 'line',
				data: chartData,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: false } },
					scales: {
						x: { display: true, ticks: { maxRotation: 45, minRotation: 45 } }
					}
				}
			});
		}

		const pieCtx = document.getElementById('breakdownChart')?.getContext('2d');
		if (pieCtx && charts.orderBreakdown.labels?.length > 0) {
			new Chart(pieCtx, {
				type: 'pie',
				data: charts.orderBreakdown,
				options: {
					responsive: true,
					maintainAspectRatio: false
				}
			});
		}

		const newReturningCtx = document.getElementById('newReturningChart')?.getContext('2d');
		if (newReturningCtx && charts.newVsReturning.labels?.length > 0) {
			new Chart(newReturningCtx, {
				type: 'doughnut',
				data: charts.newVsReturning,
				options: {
					responsive: true,
					maintainAspectRatio: false
				}
			});
		}

		return () => {
			lineChart?.destroy();
		};
	});
</script>

<svelte:head>
	<title>Analytics - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-6 text-center text-white md:py-8"
	>
		<div class="container mx-auto px-4">
			<h1
				class="font-playfair mb-1 text-xl font-bold md:text-2xl lg:text-3xl"
				in:fly={{ y: 20, duration: 400 }}
			>
				Analytics
			</h1>
			<p class="text-xs text-slate-300 md:text-sm" in:fly={{ y: 20, duration: 400, delay: 100 }}>
				Restaurant performance overview
			</p>
		</div>
	</section>

	<main class="container mx-auto px-3 py-6 md:px-4 md:py-8">
		<!-- Period Selector -->
		<div
			class="mb-6 rounded-xl bg-white p-4 shadow-md md:mb-8"
			in:fly={{ y: 20, duration: 400, delay: 50 }}
		>
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap gap-2">
					{#each periods as period}
						<button
							onclick={() => (selectedPeriod = period.value)}
							class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all md:px-4 md:py-2 md:text-sm {selectedPeriod ===
							period.value
								? 'bg-slate-800 text-white shadow-md'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
						>
							{period.label}
						</button>
					{/each}
				</div>

				{#if selectedPeriod === 'custom'}
					<div class="flex flex-col gap-2 sm:flex-row">
						<input
							type="date"
							bind:value={customStartDate}
							class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs md:text-sm"
						/>
						<span class="self-center text-slate-400">to</span>
						<input
							type="date"
							bind:value={customEndDate}
							class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs md:text-sm"
						/>
					</div>
				{/if}
			</div>

			<div class="mt-3 flex items-center gap-2">
				<span class="text-xs font-medium text-slate-500 md:text-sm">Showing:</span>
				<span class="text-xs font-semibold text-slate-800 md:text-sm"
					>{getPeriodLabel(selectedPeriod)}</span
				>
			</div>
		</div>

		<!-- KPI Cards -->
		<div class="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6">
			<!-- Customers -->
			<div
				class="rounded-xl bg-white p-3 shadow-md md:rounded-2xl md:p-4 lg:p-6"
				in:fly={{ y: 20, duration: 400, delay: 100 }}
			>
				<div class="flex items-center gap-2 md:gap-4">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 md:h-12 md:w-12 md:rounded-xl"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-slate-600 md:h-6 md:w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
						</svg>
					</div>
					<div class="min-w-0">
						<p class="truncate text-xs text-slate-500 md:text-sm">Customers</p>
						<p class="truncate text-lg font-bold text-slate-900 md:text-xl lg:text-2xl">
							{filteredStats.customers}
						</p>
					</div>
				</div>
				<div class="mt-2 flex items-center gap-1 md:mt-3">
					<span
						class="flex items-center text-xs font-medium {filteredComparison.customers.isPositive
							? 'text-emerald-600'
							: 'text-red-500'}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							{#if filteredComparison.customers.isPositive}
								<path
									fill-rule="evenodd"
									d="M12 7l-5 5H4v10h12V12h3l-5-5-2 2zM7.5 5L5 10h4v5h3V10h4L7.5 5z"
									transform="rotate(180 10 10)"
								/>
							{:else}
								<path
									fill-rule="evenodd"
									d="M12 7l-5 5H4v10h12V12h3l-5-5-2 2zM7.5 5L5 10h4v5h3V10h4L7.5 5z"
								/>
							{/if}
						</svg>
						{filteredComparison.customers.value.toFixed(1)}%
					</span>
					<span class="text-xs text-slate-400">vs prev period</span>
				</div>
			</div>

			<!-- Orders -->
			<div
				class="rounded-xl bg-white p-3 shadow-md md:rounded-2xl md:p-4 lg:p-6"
				in:fly={{ y: 20, duration: 400, delay: 150 }}
			>
				<div class="flex items-center gap-2 md:gap-4">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 md:h-12 md:w-12 md:rounded-xl"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-slate-600 md:h-6 md:w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
							<rect x="9" y="3" width="6" height="4" rx="1" />
						</svg>
					</div>
					<div class="min-w-0">
						<p class="truncate text-xs text-slate-500 md:text-sm">Orders</p>
						<p class="truncate text-lg font-bold text-slate-900 md:text-xl lg:text-2xl">
							{filteredStats.orders}
						</p>
					</div>
				</div>
				<div class="mt-2 flex items-center gap-1 md:mt-3">
					<span
						class="flex items-center text-xs font-medium {filteredComparison.orders.isPositive
							? 'text-emerald-600'
							: 'text-red-500'}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							{#if filteredComparison.orders.isPositive}
								<path
									fill-rule="evenodd"
									d="M12 7l-5 5H4v10h12V12h3l-5-5-2 2zM7.5 5L5 10h4v5h3V10h4L7.5 5z"
									transform="rotate(180 10 10)"
								/>
							{:else}
								<path
									fill-rule="evenodd"
									d="M12 7l-5 5H4v10h12V12h3l-5-5-2 2zM7.5 5L5 10h4v5h3V10h4L7.5 5z"
								/>
							{/if}
						</svg>
						{filteredComparison.orders.value.toFixed(1)}%
					</span>
					<span class="text-xs text-slate-400">vs prev period</span>
				</div>
			</div>

			<!-- Revenue -->
			<div
				class="rounded-xl bg-white p-3 shadow-md md:rounded-2xl md:p-4 lg:p-6"
				in:fly={{ y: 20, duration: 400, delay: 200 }}
			>
				<div class="flex items-center gap-2 md:gap-4">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 md:h-12 md:w-12 md:rounded-xl"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-emerald-600 md:h-6 md:w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
						</svg>
					</div>
					<div class="min-w-0">
						<p class="truncate text-xs text-slate-500 md:text-sm">Revenue</p>
						<p class="truncate text-lg font-bold text-slate-900 md:text-xl lg:text-2xl">
							₦{filteredStats.revenue.toLocaleString()}
						</p>
					</div>
				</div>
				<div class="mt-2 flex items-center gap-1 md:mt-3">
					<span
						class="flex items-center text-xs font-medium {filteredComparison.revenue.isPositive
							? 'text-emerald-600'
							: 'text-red-500'}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							{#if filteredComparison.revenue.isPositive}
								<path
									fill-rule="evenodd"
									d="M12 7l-5 5H4v10h12V12h3l-5-5-2 2zM7.5 5L5 10h4v5h3V10h4L7.5 5z"
									transform="rotate(180 10 10)"
								/>
							{:else}
								<path
									fill-rule="evenodd"
									d="M12 7l-5 5H4v10h12V12h3l-5-5-2 2zM7.5 5L5 10h4v5h3V10h4L7.5 5z"
								/>
							{/if}
						</svg>
						{filteredComparison.revenue.value.toFixed(1)}%
					</span>
					<span class="text-xs text-slate-400">vs prev period</span>
				</div>
			</div>

			<!-- Returning -->
			<div
				class="rounded-xl bg-white p-3 shadow-md md:rounded-2xl md:p-4 lg:p-6"
				in:fly={{ y: 20, duration: 400, delay: 250 }}
			>
				<div class="flex items-center gap-2 md:gap-4">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-100 md:h-12 md:w-12 md:rounded-xl"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-pink-600 md:h-6 md:w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
							/>
						</svg>
					</div>
					<div class="min-w-0">
						<p class="truncate text-xs text-slate-500 md:text-sm">Returning</p>
						<p class="truncate text-lg font-bold text-slate-900 md:text-xl lg:text-2xl">
							{filteredStats.recurringRate}
						</p>
					</div>
				</div>
				<div class="mt-2 flex items-center gap-1 md:mt-3">
					<span
						class="flex items-center text-xs font-medium {filteredComparison.recurringRate
							.isPositive
							? 'text-emerald-600'
							: 'text-red-500'}"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							{#if filteredComparison.recurringRate.isPositive}
								<path
									fill-rule="evenodd"
									d="M12 7l-5 5H4v10h12V12h3l-5-5-2 2zM7.5 5L5 10h4v5h3V10h4L7.5 5z"
									transform="rotate(180 10 10)"
								/>
							{:else}
								<path
									fill-rule="evenodd"
									d="M12 7l-5 5H4v10h12V12h3l-5-5-2 2zM7.5 5L5 10h4v5h3V10h4L7.5 5z"
								/>
							{/if}
						</svg>
						{filteredComparison.recurringRate.value.toFixed(1)}%
					</span>
					<span class="text-xs text-slate-400">vs prev period</span>
				</div>
			</div>

			<!-- Avg Order -->
			<div
				class="col-span-2 rounded-xl bg-white p-3 shadow-md sm:col-span-1 md:rounded-2xl md:p-4 lg:col-span-1 lg:p-6"
				in:fly={{ y: 20, duration: 400, delay: 300 }}
			>
				<div class="flex items-center gap-2 md:gap-4">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 md:h-12 md:w-12 md:rounded-xl"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-amber-600 md:h-6 md:w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
					</div>
					<div class="min-w-0">
						<p class="truncate text-xs text-slate-500 md:text-sm">Avg Order Value</p>
						<p class="truncate text-lg font-bold text-slate-900 md:text-xl lg:text-2xl">
							₦{filteredStats.avgOrderValue.toLocaleString()}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Charts Grid -->
		<div class="mt-6 grid gap-4 md:mt-8 md:gap-6 lg:grid-cols-2">
			<div
				class="rounded-xl bg-white p-4 shadow-md md:rounded-2xl md:p-6"
				in:fly={{ y: 20, duration: 400, delay: 350 }}
			>
				<h2 class="font-playfair mb-3 text-base font-semibold text-slate-900 md:mb-4 md:text-lg">
					Orders Over Time
				</h2>
				{#if chartData.labels?.length > 0}
					<div class="h-48 md:h-56 lg:h-64">
						<canvas id="ordersChart"></canvas>
					</div>
				{:else}
					<div class="flex h-32 items-center justify-center md:h-40">
						<p class="text-sm text-slate-400">No order data available</p>
					</div>
				{/if}
			</div>

			<div
				class="rounded-xl bg-white p-4 shadow-md md:rounded-2xl md:p-6"
				in:fly={{ y: 20, duration: 400, delay: 400 }}
			>
				<h2 class="font-playfair mb-3 text-base font-semibold text-slate-900 md:mb-4 md:text-lg">
					Customer Types
				</h2>
				{#if charts.newVsReturning.labels?.length > 0 && (charts.newVsReturning.datasets[0]?.data[0] > 0 || charts.newVsReturning.datasets[0]?.data[1] > 0)}
					<div class="flex h-40 items-center justify-center md:h-48 lg:h-56">
						<div class="h-full w-32 md:w-40 lg:w-48">
							<canvas id="newReturningChart"></canvas>
						</div>
					</div>
				{:else}
					<div class="flex h-32 items-center justify-center md:h-40">
						<p class="text-sm text-slate-400">No customer data available</p>
					</div>
				{/if}
			</div>

			<div
				class="rounded-xl bg-white p-4 shadow-md md:rounded-2xl md:p-6"
				in:fly={{ y: 20, duration: 400, delay: 450 }}
			>
				<h2 class="font-playfair mb-3 text-base font-semibold text-slate-900 md:mb-4 md:text-lg">
					Order Types
				</h2>
				{#if charts.orderBreakdown.labels?.length > 0}
					<div class="flex h-40 items-center justify-center md:h-48 lg:h-56">
						<div class="h-full w-32 md:w-40 lg:w-48">
							<canvas id="breakdownChart"></canvas>
						</div>
					</div>
				{:else}
					<div class="flex h-32 items-center justify-center md:h-40">
						<p class="text-sm text-slate-400">No order data available</p>
					</div>
				{/if}
			</div>

			<!-- Recent Activity -->
			<div
				class="rounded-xl bg-white p-4 shadow-md md:rounded-2xl md:p-6"
				in:fly={{ y: 20, duration: 400, delay: 500 }}
			>
				<h2 class="font-playfair mb-3 text-base font-semibold text-slate-900 md:mb-4 md:text-lg">
					Recent Sales Activity
				</h2>
				{#if filteredRecentActivity?.length > 0}
					<ul class="max-h-56 space-y-2 overflow-y-auto md:max-h-64 md:space-y-3">
						{#each filteredRecentActivity as a}
							<li class="flex items-start gap-2 rounded-lg bg-slate-50 p-2 md:gap-3 md:p-3">
								<img
									src={a.avatar}
									alt="user"
									class="h-8 w-8 shrink-0 rounded-full md:h-10 md:w-10"
								/>
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium text-slate-700 md:text-sm">{a.text}</p>
									<div class="mt-1 flex flex-wrap items-center gap-1 md:mt-1.5">
										<span class="text-xs text-slate-500">{a.time}</span>
										<span class="text-xs text-slate-300">•</span>
										<span class="text-xs font-medium text-slate-600">{a.fullDate}</span>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<div class="flex h-32 items-center justify-center md:h-40">
						<p class="text-sm text-slate-400">No recent activity</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Tables Grid -->
		<div class="mt-6 grid gap-4 md:mt-8 md:gap-6 lg:grid-cols-2">
			<!-- Top Selling Dishes -->
			<div
				class="rounded-xl bg-white p-4 shadow-md md:rounded-2xl md:p-6"
				in:fly={{ y: 20, duration: 400, delay: 550 }}
			>
				<h2 class="font-playfair mb-3 text-base font-semibold text-slate-900 md:mb-4 md:text-lg">
					Top Selling Dishes
				</h2>
				{#if filteredTopDishes?.length > 0}
					<div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
						<table class="w-full min-w-[200px]">
							<thead>
								<tr class="border-b border-slate-100">
									<th class="pb-2 text-left text-xs font-medium text-slate-500 md:pb-3 md:text-sm"
										>Dish</th
									>
									<th class="pb-2 text-right text-xs font-medium text-slate-500 md:pb-3 md:text-sm"
										>Sales</th
									>
								</tr>
							</thead>
							<tbody>
								{#each filteredTopDishes as d, i}
									<tr class="border-b border-slate-50">
										<td class="py-2 md:py-3">
											<div class="flex items-center gap-2">
												<span
													class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 md:h-6 md:w-6"
													>{i + 1}</span
												>
												<span class="max-w-[150px] truncate text-xs text-slate-700 md:text-sm"
													>{d.dish}</span
												>
											</div>
										</td>
										<td class="py-2 text-right md:py-3">
											<span
												class="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 md:px-3 md:py-1 md:text-sm"
												>{d.sales}</span
											>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="flex h-24 items-center justify-center md:h-32">
						<p class="text-sm text-slate-400">No dish data available</p>
					</div>
				{/if}
			</div>

			<!-- Top Customers -->
			<div
				class="rounded-xl bg-white p-4 shadow-md md:rounded-2xl md:p-6"
				in:fly={{ y: 20, duration: 400, delay: 600 }}
			>
				<h2 class="font-playfair mb-3 text-base font-semibold text-slate-900 md:mb-4 md:text-lg">
					Top Customers
				</h2>
				{#if filteredTopCustomers?.length > 0}
					<div class="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
						<table class="w-full min-w-[200px]">
							<thead>
								<tr class="border-b border-slate-100">
									<th class="pb-2 text-left text-xs font-medium text-slate-500 md:pb-3 md:text-sm"
										>Customer</th
									>
									<th class="pb-2 text-right text-xs font-medium text-slate-500 md:pb-3 md:text-sm"
										>Orders</th
									>
								</tr>
							</thead>
							<tbody>
								{#each filteredTopCustomers as customer, i}
									<tr class="border-b border-slate-50">
										<td class="py-2 md:py-3">
											<div class="flex items-center gap-2 md:gap-3">
												<span
													class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-600 md:h-6 md:w-6"
													>{i + 1}</span
												>
												<img
													src={customer.avatar}
													alt={customer.name}
													class="h-6 w-6 shrink-0 rounded-full md:h-8 md:w-8"
												/>
												<span class="max-w-[120px] truncate text-xs text-slate-700 md:text-sm"
													>{customer.name}</span
												>
											</div>
										</td>
										<td class="py-2 text-right md:py-3">
											<span
												class="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 md:px-3 md:py-1 md:text-sm"
												>{customer.orders}</span
											>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="flex h-24 items-center justify-center md:h-32">
						<p class="text-sm text-slate-400">No customer data available</p>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>
