<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import Chart from 'chart.js/auto';

	let { data } = $props();

	let selectedPeriod = $state('last30');
	let searchQuery = $state('');
	let selectedCustomer = $state<any>(null);
	let showCustomerModal = $state(false);
	let activeTab = $state('overview');

	const customers = data.customerStats ?? [];
	const userOrdersMap = data.userOrdersMap ?? {};
	const charts = data.charts ?? {};
	const stats = data.stats ?? {};
	const topCustomers = data.topCustomers ?? [];
	const mostValuableCustomers = data.mostValuableCustomers ?? [];
	const popularDishes = data.popularDishes ?? [];

	function getCustomerMetrics(customer: any) {
		const orders = userOrdersMap[customer.id] || [];
		const totalSpent = orders.reduce(
			(sum: number, o: any) => sum + (o.orderTotal || o.totalAmount || 0),
			0
		);
		const avgOrderValue = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0;
		const lastOrderDate = orders.length > 0 ? new Date(orders[0].created) : null;

		return {
			totalOrders: orders.length,
			totalSpent,
			avgOrderValue,
			lastOrderDate
		};
	}

	function getCustomerTier(customer: any) {
		const metrics = getCustomerMetrics(customer);
		if (metrics.totalSpent >= 100000)
			return { tier: 'VIP', color: 'bg-purple-100 text-purple-700', icon: '👑' };
		if (metrics.totalSpent >= 50000)
			return { tier: 'Premium', color: 'bg-amber-100 text-amber-700', icon: '⭐' };
		if (metrics.totalOrders >= 5)
			return { tier: 'Regular', color: 'bg-blue-100 text-blue-700', icon: '✓' };
		return { tier: 'New', color: 'bg-slate-100 text-slate-700', icon: 'New' };
	}

	function getTimeSince(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - new Date(date).getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
		return `${Math.floor(diffDays / 365)} years ago`;
	}

	const filteredCustomers = $derived.by(() => {
		if (!searchQuery) return customers;
		const query = searchQuery.toLowerCase();
		return customers.filter(
			(c: any) =>
				c.name?.toLowerCase().includes(query) ||
				c.email?.toLowerCase().includes(query) ||
				c.phone?.includes(query)
		);
	});

	function viewCustomerDetails(customer: any) {
		selectedCustomer = {
			...customer,
			orders: userOrdersMap[customer.id] || [],
			metrics: getCustomerMetrics(customer),
			tier: getCustomerTier(customer)
		};
		showCustomerModal = true;
	}

	function closeCustomerModal() {
		showCustomerModal = false;
		selectedCustomer = null;
	}

	let revenueChart: Chart | null = null;
	let tierChart: Chart | null = null;
	let newReturningChart: Chart | null = null;
	let orderTimeChart: Chart | null = null;
	let deliveryChart: Chart | null = null;

	onMount(() => {
		// Revenue over time chart
		const revenueEl = document.getElementById('revenueChart');
		const revenueCtx = revenueEl?.getContext('2d');
		if (revenueCtx && charts.revenueOverTime?.labels?.length > 0) {
			revenueChart = new Chart(revenueCtx, {
				type: 'line',
				data: charts.revenueOverTime,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: false } },
					scales: {
						y: {
							beginAtZero: true,
							ticks: { callback: (value) => '₦' + Number(value).toLocaleString() }
						}
					}
				}
			});
		}

		// Tier distribution chart
		const tierEl = document.getElementById('tierChart');
		const tierCtx = tierEl?.getContext('2d');
		if (tierCtx && charts.tierDistribution?.labels?.length > 0) {
			const totalTiers =
				charts.tierDistribution.datasets[0]?.data?.reduce((a: number, b: number) => a + b, 0) || 0;
			if (totalTiers > 0) {
				tierChart = new Chart(tierCtx, {
					type: 'doughnut',
					data: charts.tierDistribution,
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
						}
					}
				});
			}
		}

		// New vs Returning chart
		const newReturningEl = document.getElementById('newReturningChart');
		const newReturningCtx = newReturningEl?.getContext('2d');
		if (newReturningCtx && charts.newVsReturning?.labels?.length > 0) {
			const total =
				charts.newVsReturning.datasets[0]?.data?.reduce((a: number, b: number) => a + b, 0) || 0;
			if (total > 0) {
				newReturningChart = new Chart(newReturningCtx, {
					type: 'pie',
					data: charts.newVsReturning,
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
						}
					}
				});
			}
		}

		// Order time distribution chart
		const orderTimeEl = document.getElementById('orderTimeChart');
		const orderTimeCtx = orderTimeEl?.getContext('2d');
		if (orderTimeCtx && charts.orderTimeDistribution?.labels?.length > 0) {
			orderTimeChart = new Chart(orderTimeCtx, {
				type: 'bar',
				data: charts.orderTimeDistribution,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: { legend: { display: false } },
					scales: {
						x: { display: true, ticks: { maxRotation: 45, minRotation: 45, font: { size: 9 } } },
						y: { beginAtZero: true }
					}
				}
			});
		}

		// Delivery type chart
		const deliveryEl = document.getElementById('deliveryChart');
		const deliveryCtx = deliveryEl?.getContext('2d');
		if (deliveryCtx && charts.deliveryTypeDistribution?.labels?.length > 0) {
			const total =
				charts.deliveryTypeDistribution.datasets[0]?.data?.reduce(
					(a: number, b: number) => a + b,
					0
				) || 0;
			if (total > 0) {
				deliveryChart = new Chart(deliveryCtx, {
					type: 'doughnut',
					data: charts.deliveryTypeDistribution,
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
						}
					}
				});
			}
		}

		return () => {
			revenueChart?.destroy();
			tierChart?.destroy();
			newReturningChart?.destroy();
			orderTimeChart?.destroy();
			deliveryChart?.destroy();
		};
	});
</script>

<svelte:head>
	<title>User Analysis - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 px-4 py-5 text-white md:py-8"
	>
		<div class="mx-auto max-w-7xl">
			<h1 class="font-playfair text-center text-2xl font-bold md:text-4xl">User Analysis</h1>
			<p class="mt-1 text-center text-sm text-white/80 md:mt-2 md:text-base">
				Understand your customers better
			</p>
		</div>
	</section>

	<!-- Tab Navigation -->
	<section class="sticky top-0 z-10 border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-7xl overflow-x-auto px-4">
			<button
				onclick={() => (activeTab = 'overview')}
				class="border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors md:px-4 md:text-base {activeTab ===
				'overview'
					? 'border-amber-500 text-amber-600'
					: 'border-transparent text-slate-500 hover:text-slate-700'}"
			>
				Overview
			</button>
			<button
				onclick={() => (activeTab = 'customers')}
				class="border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors md:px-4 md:text-base {activeTab ===
				'customers'
					? 'border-amber-500 text-amber-600'
					: 'border-transparent text-slate-500 hover:text-slate-700'}"
			>
				Customers
			</button>
			<button
				onclick={() => (activeTab = 'insights')}
				class="border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors md:px-4 md:text-base {activeTab ===
				'insights'
					? 'border-amber-500 text-amber-600'
					: 'border-transparent text-slate-500 hover:text-slate-700'}"
			>
				Insights
			</button>
		</div>
	</section>

	<div class="mx-auto max-w-7xl px-4 pb-8">
		{#if activeTab === 'overview'}
			<!-- Stats Cards -->
			<section class="mt-4">
				<div class="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
					<div class="rounded-xl bg-white p-3 shadow-sm md:p-4">
						<div class="text-lg font-bold text-slate-800 md:text-2xl">
							{stats.totalCustomers || 0}
						</div>
						<div class="truncate text-xs text-slate-500 md:text-sm">Total Users</div>
					</div>
					<div class="rounded-xl bg-white p-3 shadow-sm md:p-4">
						<div class="text-lg font-bold text-emerald-600 md:text-2xl">
							{stats.newCustomers || 0}
						</div>
						<div class="truncate text-xs text-slate-500 md:text-sm">New</div>
					</div>
					<div class="rounded-xl bg-white p-3 shadow-sm md:p-4">
						<div class="text-lg font-bold text-blue-600 md:text-2xl">
							{stats.returningCustomers || 0}
						</div>
						<div class="truncate text-xs text-slate-500 md:text-sm">Returning</div>
					</div>
					<div class="rounded-xl bg-white p-3 shadow-sm md:p-4">
						<div class="text-lg font-bold text-purple-600 md:text-2xl">{stats.vipCount || 0}</div>
						<div class="truncate text-xs text-slate-500 md:text-sm">VIP</div>
					</div>
					<div class="col-span-2 rounded-xl bg-white p-3 shadow-sm md:col-span-1 md:p-4">
						<div class="truncate text-lg font-bold text-slate-800 md:text-2xl">
							₦{(stats.totalRevenue || 0).toLocaleString()}
						</div>
						<div class="truncate text-xs text-slate-500 md:text-sm">Total Revenue</div>
					</div>
					<div class="col-span-2 rounded-xl bg-white p-3 shadow-sm md:col-span-1 md:p-4">
						<div class="truncate text-lg font-bold text-slate-800 md:text-2xl">
							₦{(stats.avgOrderValue || 0).toLocaleString()}
						</div>
						<div class="truncate text-xs text-slate-500 md:text-sm">Avg Order</div>
					</div>
				</div>
			</section>

			<!-- Charts Grid -->
			<section class="mt-4 grid gap-4 md:mt-6 md:grid-cols-2 lg:grid-cols-3">
				<!-- Revenue Over Time -->
				<div class="rounded-xl bg-white p-4 shadow-sm md:rounded-2xl md:p-6">
					<h2 class="mb-2 text-sm font-semibold text-slate-900 md:mb-3 md:text-base">
						Revenue Over Time
					</h2>
					{#if charts.revenueOverTime?.labels?.length > 0}
						<div class="h-40 md:h-48">
							<canvas id="revenueChart"></canvas>
						</div>
					{:else}
						<div class="flex h-32 items-center justify-center">
							<p class="text-sm text-slate-400">No data</p>
						</div>
					{/if}
				</div>

				<!-- Customer Tiers -->
				<div class="rounded-xl bg-white p-4 shadow-sm md:rounded-2xl md:p-6">
					<h2 class="mb-2 text-sm font-semibold text-slate-900 md:mb-3 md:text-base">
						Customer Tiers
					</h2>
					{#if charts.tierDistribution?.labels?.length > 0 && (stats.totalCustomers || 0) > 0}
						<div class="flex h-40 items-center justify-center md:h-48">
							<div class="h-32 w-32 md:h-40 md:w-40">
								<canvas id="tierChart"></canvas>
							</div>
						</div>
					{:else}
						<div class="flex h-32 items-center justify-center">
							<p class="text-sm text-slate-400">No data</p>
						</div>
					{/if}
				</div>

				<!-- New vs Returning -->
				<div class="rounded-xl bg-white p-4 shadow-sm md:rounded-2xl md:p-6">
					<h2 class="mb-2 text-sm font-semibold text-slate-900 md:mb-3 md:text-base">
						New vs Returning
					</h2>
					{#if charts.newVsReturning?.labels?.length > 0 && (stats.totalCustomers || 0) > 0}
						<div class="flex h-40 items-center justify-center md:h-48">
							<div class="h-32 w-32 md:h-40 md:w-40">
								<canvas id="newReturningChart"></canvas>
							</div>
						</div>
					{:else}
						<div class="flex h-32 items-center justify-center">
							<p class="text-sm text-slate-400">No data</p>
						</div>
					{/if}
				</div>

				<!-- Order Time -->
				<div class="rounded-xl bg-white p-4 shadow-sm md:col-span-2 md:rounded-2xl md:p-6">
					<h2 class="mb-2 text-sm font-semibold text-slate-900 md:mb-3 md:text-base">
						Orders by Time of Day
					</h2>
					{#if charts.orderTimeDistribution?.labels?.length > 0}
						<div class="h-40 md:h-48">
							<canvas id="orderTimeChart"></canvas>
						</div>
					{:else}
						<div class="flex h-32 items-center justify-center">
							<p class="text-sm text-slate-400">No data</p>
						</div>
					{/if}
				</div>

				<!-- Delivery Type -->
				<div class="rounded-xl bg-white p-4 shadow-sm md:rounded-2xl md:p-6">
					<h2 class="mb-2 text-sm font-semibold text-slate-900 md:mb-3 md:text-base">
						Order Types
					</h2>
					{#if charts.deliveryTypeDistribution?.labels?.length > 0}
						<div class="flex h-40 items-center justify-center md:h-48">
							<div class="h-32 w-32 md:h-40 md:w-40">
								<canvas id="deliveryChart"></canvas>
							</div>
						</div>
					{:else}
						<div class="flex h-32 items-center justify-center">
							<p class="text-sm text-slate-400">No data</p>
						</div>
					{/if}
				</div>
			</section>

			<!-- Top Customers -->
			{#if topCustomers.length > 0}
				<section class="mt-6">
					<div class="rounded-xl bg-white p-4 shadow-sm md:rounded-2xl md:p-6">
						<h2 class="mb-3 text-base font-semibold text-slate-900 md:mb-4">
							Top Customers by Revenue
						</h2>
						<div class="space-y-2 md:space-y-3">
							{#each topCustomers as customer, i}
								<button
									onclick={() => viewCustomerDetails(customer)}
									class="flex w-full items-center justify-between rounded-lg bg-slate-50 p-2 text-left transition-colors hover:bg-slate-100 md:p-3"
								>
									<div class="flex items-center gap-2 md:gap-3">
										<div
											class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white md:h-8 md:w-8 md:text-sm"
										>
											{i + 1}
										</div>
										<div class="min-w-0">
											<p class="truncate font-medium text-slate-900">{customer.name}</p>
											<p class="truncate text-xs text-slate-500">{customer.orderCount} orders</p>
										</div>
									</div>
									<p class="shrink-0 font-semibold text-emerald-600">
										₦{customer.totalSpent.toLocaleString()}
									</p>
								</button>
							{/each}
						</div>
					</div>
				</section>
			{/if}
		{:else if activeTab === 'customers'}
			<!-- Search -->
			<section class="mt-4">
				<div class="relative">
					<svg
						class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 md:h-5 md:w-5"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search customers..."
						class="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm focus:border-amber-500 focus:outline-none md:py-3 md:text-base"
					/>
				</div>
			</section>

			<!-- Customer List -->
			<section class="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
				<table class="w-full min-w-[500px]">
					<thead class="bg-slate-50">
						<tr>
							<th
								class="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase md:px-4 md:py-3"
								>Customer</th
							>
							<th
								class="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase md:px-4 md:py-3"
								>Orders</th
							>
							<th
								class="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase md:px-4 md:py-3"
								>Spent</th
							>
							<th
								class="hidden px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase md:table-cell md:px-4 md:py-3"
								>Tier</th
							>
							<th
								class="hidden px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase md:table-cell md:px-4 md:py-3"
								>Last Order</th
							>
							<th
								class="px-3 py-2 text-right text-xs font-semibold text-slate-600 uppercase md:px-4 md:py-3"
								>Action</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each filteredCustomers as customer}
							{@const metrics = getCustomerMetrics(customer)}
							{@const tierInfo = getCustomerTier(customer)}
							<tr class="hover:bg-slate-50">
								<td class="px-3 py-2 md:px-4 md:py-3">
									<div class="flex items-center gap-2 md:gap-3">
										<div
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600"
										>
											{customer.name?.charAt(0)?.toUpperCase() || 'U'}
										</div>
										<div class="min-w-0">
											<p class="truncate font-medium text-slate-900">
												{customer.name || 'Unknown'}
											</p>
											<p class="truncate text-xs text-slate-500 md:hidden">
												{customer.email || ''}
											</p>
										</div>
									</div>
								</td>
								<td class="px-3 py-2 md:px-4 md:py-3">
									<span class="font-medium text-slate-900">{metrics.totalOrders}</span>
								</td>
								<td class="px-3 py-2 md:px-4 md:py-3">
									<span class="font-medium text-slate-900"
										>₦{(metrics.totalSpent || 0).toLocaleString()}</span
									>
								</td>
								<td class="hidden px-3 py-2 md:table-cell md:px-4 md:py-3">
									<span
										class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {tierInfo.color}"
									>
										{tierInfo.tier}
									</span>
								</td>
								<td class="hidden px-3 py-2 text-sm text-slate-600 md:table-cell md:px-4 md:py-3">
									{metrics.lastOrderDate ? getTimeSince(metrics.lastOrderDate) : 'Never'}
								</td>
								<td class="px-3 py-2 text-right md:px-4 md:py-3">
									<button
										onclick={() => viewCustomerDetails(customer)}
										class="rounded-lg bg-amber-500 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600 md:px-3 md:py-1.5 md:text-sm"
									>
										View
									</button>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="px-4 py-8 text-center text-slate-500">
									{searchQuery ? `No customers found` : 'No customer data available'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{:else if activeTab === 'insights'}
			<!-- Key Metrics -->
			<section class="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="text-xs text-slate-500 md:text-sm">Customer LTV</div>
					<div class="mt-1 text-xl font-bold text-slate-800 md:text-2xl">
						₦{(stats.avgCustomerLTV || 0).toLocaleString()}
					</div>
					<div class="mt-1 text-xs text-slate-400">Avg. lifetime value</div>
				</div>
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="text-xs text-slate-500 md:text-sm">Retention Rate</div>
					<div class="mt-1 text-xl font-bold text-emerald-600 md:text-2xl">
						{stats.retentionRate || 0}%
					</div>
					<div class="mt-1 text-xs text-slate-400">Returning customers</div>
				</div>
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="text-xs text-slate-500 md:text-sm">Churned</div>
					<div class="mt-1 text-xl font-bold text-red-500 md:text-2xl">
						{stats.churnedCustomers || 0}
					</div>
					<div class="mt-1 text-xs text-slate-400">Inactive 30+ days</div>
				</div>
				<div class="rounded-xl bg-white p-4 shadow-sm">
					<div class="text-xs text-slate-500 md:text-sm">New Users (30d)</div>
					<div class="mt-1 text-xl font-bold text-blue-600 md:text-2xl">
						{stats.newUsersLast30Days || 0}
					</div>
					<div class="mt-1 text-xs text-slate-400">Last 30 days</div>
				</div>
			</section>

			<!-- Popular Dishes -->
			{#if popularDishes.length > 0}
				<section class="mt-6">
					<div class="rounded-xl bg-white p-4 shadow-sm md:rounded-2xl md:p-6">
						<h2 class="mb-3 text-base font-semibold text-slate-900">Most Popular Dishes</h2>
						<div class="space-y-2 md:space-y-3">
							{#each popularDishes as dish, i}
								<div class="flex items-center justify-between rounded-lg bg-slate-50 p-3">
									<div class="flex items-center gap-3">
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
										>
											{i + 1}
										</div>
										<div>
											<p class="font-medium text-slate-900">{dish.name}</p>
											<p class="text-xs text-slate-500">{dish.count} orders</p>
										</div>
									</div>
									<p class="font-semibold text-emerald-600">₦{dish.revenue.toLocaleString()}</p>
								</div>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<!-- Most Valuable Customers -->
			{#if mostValuableCustomers.length > 0}
				<section class="mt-6">
					<div class="rounded-xl bg-white p-4 shadow-sm md:rounded-2xl md:p-6">
						<h2 class="mb-3 text-base font-semibold text-slate-900">
							Most Valuable Customers (LTV)
						</h2>
						<div class="space-y-2 md:space-y-3">
							{#each mostValuableCustomers as customer}
								<button
									onclick={() => viewCustomerDetails(customer)}
									class="flex w-full items-center justify-between rounded-lg bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100"
								>
									<div class="min-w-0">
										<p class="truncate font-medium text-slate-900">{customer.name}</p>
										<p class="truncate text-xs text-slate-500">{customer.email}</p>
									</div>
									<div class="text-right">
										<p class="font-semibold text-emerald-600">
											₦{customer.totalSpent.toLocaleString()}
										</p>
										<p class="text-xs text-slate-500">{customer.orderCount} orders</p>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<!-- Tier Breakdown -->
			<section class="mt-6">
				<div class="rounded-xl bg-white p-4 shadow-sm md:rounded-2xl md:p-6">
					<h2 class="mb-3 text-base font-semibold text-slate-900">Customer Tier Breakdown</h2>
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						<div class="rounded-lg bg-purple-50 p-3 text-center">
							<div class="text-xl font-bold text-purple-600">{stats.vipCount || 0}</div>
							<div class="text-xs text-purple-700">VIP (₦100k+)</div>
						</div>
						<div class="rounded-lg bg-amber-50 p-3 text-center">
							<div class="text-xl font-bold text-amber-600">{stats.premiumCount || 0}</div>
							<div class="text-xs text-amber-700">Premium (₦50k+)</div>
						</div>
						<div class="rounded-lg bg-blue-50 p-3 text-center">
							<div class="text-xl font-bold text-blue-600">{stats.regularCount || 0}</div>
							<div class="text-xs text-blue-700">Regular (5+ orders)</div>
						</div>
						<div class="rounded-lg bg-slate-50 p-3 text-center">
							<div class="text-xl font-bold text-slate-600">{stats.newCount || 0}</div>
							<div class="text-xs text-slate-600">New</div>
						</div>
					</div>
				</div>
			</section>
		{/if}
	</div>
</div>

<!-- Customer Details Modal -->
{#if showCustomerModal && selectedCustomer}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onkeydown={(e) => e.key === 'Escape' && closeCustomerModal()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<button class="absolute inset-0" aria-label="Close customer details" onclick={closeCustomerModal}></button>
		<div
			class="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white"
			role="document"
		>
			<div class="flex items-center justify-between border-b border-slate-100 p-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600"
					>
						{selectedCustomer.name?.charAt(0)?.toUpperCase() || 'U'}
					</div>
					<div>
						<h3 class="font-bold text-slate-900">{selectedCustomer.name || 'Unknown User'}</h3>
						<p class="text-sm text-slate-500">{selectedCustomer.email || 'No email'}</p>
					</div>
				</div>
				<button
					onclick={closeCustomerModal}
					class="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
					aria-label="Close"
				>
					<svg
						class="h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="grid grid-cols-2 gap-2 border-b border-slate-100 p-4">
				<div class="rounded-lg bg-slate-50 p-3">
					<div class="text-lg font-bold text-slate-900">{selectedCustomer.metrics.totalOrders}</div>
					<div class="text-xs text-slate-500">Orders</div>
				</div>
				<div class="rounded-lg bg-slate-50 p-3">
					<div class="text-lg font-bold text-emerald-600">
						₦{selectedCustomer.metrics.totalSpent.toLocaleString()}
					</div>
					<div class="text-xs text-slate-500">Total Spent</div>
				</div>
				<div class="rounded-lg bg-slate-50 p-3">
					<div class="text-lg font-bold text-slate-900">
						₦{selectedCustomer.metrics.avgOrderValue.toLocaleString()}
					</div>
					<div class="text-xs text-slate-500">Avg Order</div>
				</div>
				<div class="rounded-lg bg-slate-50 p-3">
					<div class="text-lg font-bold text-purple-600">{selectedCustomer.tier.tier}</div>
					<div class="text-xs text-slate-500">Tier</div>
				</div>
			</div>

			<div class="border-b border-slate-100 p-4">
				<h4 class="mb-2 font-semibold text-slate-900">Contact</h4>
				<p class="text-sm text-slate-600">{selectedCustomer.phone || 'No phone'}</p>
				{#if selectedCustomer.address}
					<p class="mt-1 text-sm text-slate-600">{selectedCustomer.address}</p>
				{/if}
			</div>

			<div class="p-4">
				<h4 class="mb-2 font-semibold text-slate-900">Recent Orders</h4>
				{#if selectedCustomer.orders?.length > 0}
					<div class="max-h-48 space-y-2 overflow-y-auto">
						{#each selectedCustomer.orders.slice(0, 10) as order}
							<div class="flex items-center justify-between rounded-lg border border-slate-100 p-2">
								<div>
									<p class="text-sm font-medium text-slate-900">
										#{order.id?.slice(0, 8) || 'N/A'}
									</p>
									<p class="text-xs text-slate-500">
										{new Date(order.created).toLocaleDateString()}
									</p>
								</div>
								<div class="text-right">
									<p class="text-sm font-medium text-slate-900">
										₦{(order.orderTotal || order.totalAmount || 0).toLocaleString()}
									</p>
									<span class="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700"
										>{order.status}</span
									>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-slate-500">No orders</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
