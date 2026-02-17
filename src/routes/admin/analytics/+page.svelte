<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import Chart from 'chart.js/auto';

	let { data } = $props();

	const stats = data.stats ?? {
		customers: 0,
		orders: 0,
		revenue: 0,
		recurringRate: '0%',
		avgOrderValue: 0
	};

	const charts = data.charts ?? {
		ordersOverTime: { labels: [], datasets: [] },
		orderBreakdown: { labels: [], datasets: [] },
		newVsReturning: { labels: [], datasets: [] }
	};

	const tables = data.tables ?? {
		topDishes: [],
		topCustomers: [],
		recentActivity: []
	};

	const avgOrderValue = stats.avgOrderValue || 0;

	onMount(() => {
		// Orders Over Time Chart
		const lineCtx = document.getElementById('ordersChart')?.getContext('2d');
		if (lineCtx && charts.ordersOverTime.labels?.length > 0) {
			new Chart(lineCtx, {
				type: 'line',
				data: charts.ordersOverTime,
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

		// Order Breakdown Chart
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

		// New vs Returning Chart
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
	});
</script>

<svelte:head>
	<title>Analytics - Proxifeast Admin</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
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
							{stats.customers}
						</p>
					</div>
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
							{stats.orders}
						</p>
					</div>
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
							₦{stats.revenue.toLocaleString()}
						</p>
					</div>
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
							{stats.recurringRate}
						</p>
					</div>
				</div>
			</div>

			<!-- Avg Order (full width on mobile, 1 of 5 on lg) -->
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
						<p class="truncate text-xs text-slate-500 md:text-sm">Avg Order</p>
						<p class="truncate text-lg font-bold text-slate-900 md:text-xl lg:text-2xl">
							₦{avgOrderValue.toLocaleString()}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Charts Grid -->
		<div class="mt-6 grid gap-4 md:mt-8 md:gap-6 lg:grid-cols-2">
			<!-- Orders Over Time -->
			<div
				class="rounded-xl bg-white p-4 shadow-md md:rounded-2xl md:p-6"
				in:fly={{ y: 20, duration: 400, delay: 350 }}
			>
				<h2 class="font-playfair mb-3 text-base font-semibold text-slate-900 md:mb-4 md:text-lg">
					Orders (Last 7 Days)
				</h2>
				{#if charts.ordersOverTime.labels?.length > 0}
					<div class="h-48 md:h-56 lg:h-64">
						<canvas id="ordersChart"></canvas>
					</div>
				{:else}
					<div class="flex h-32 items-center justify-center md:h-40">
						<p class="text-sm text-slate-400">No order data available</p>
					</div>
				{/if}
			</div>

			<!-- Customer Types -->
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

			<!-- Order Types -->
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
					Recent Activity
				</h2>
				{#if tables.recentActivity?.length > 0}
					<ul class="max-h-48 space-y-2 overflow-y-auto md:max-h-56 md:space-y-3">
						{#each tables.recentActivity as a}
							<li class="flex items-center gap-2 md:gap-3">
								<img
									src={a.avatar}
									alt="user"
									class="h-8 w-8 shrink-0 rounded-full md:h-10 md:w-10"
								/>
								<div class="min-w-0">
									<p class="truncate text-xs font-medium text-slate-700 md:text-sm">{a.text}</p>
									<span class="text-xs text-slate-400">{a.time}</span>
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
				{#if tables.topDishes?.length > 0}
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
								{#each tables.topDishes as d}
									<tr class="border-b border-slate-50">
										<td
											class="max-w-[150px] truncate py-2 text-xs text-slate-700 md:py-3 md:text-sm"
											>{d.dish}</td
										>
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
				{#if tables.topCustomers?.length > 0}
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
								{#each tables.topCustomers as customer}
									<tr class="border-b border-slate-50">
										<td class="py-2 md:py-3">
											<div class="flex items-center gap-2 md:gap-3">
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
