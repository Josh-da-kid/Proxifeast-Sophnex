<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	let { data } = $props();

	const isSuper = data.isSuper;
	const restaurantName = data.restaurantName || 'Proxifeast';

	function formatCurrency(amount: number): string {
		return `₦${amount.toLocaleString()}`;
	}

	function formatPercent(value: number): string {
		return `${value}%`;
	}

	function getHourLabel(hour: number): string {
		if (hour === 0) return '12 AM';
		if (hour === 12) return '12 PM';
		return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
	}

	let selectedPeriod = $state('30days');
</script>

<svelte:head>
	<title>Statistics - {restaurantName} Admin</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header Section -->
	<header class="border-b border-slate-200 bg-white shadow-sm">
		<div class="container mx-auto px-4 py-6">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 class="font-heading text-2xl font-bold text-slate-900">
						{isSuper ? 'Platform Overview' : 'Performance Dashboard'}
					</h1>
					<p class="mt-1 text-sm text-slate-500">
						{isSuper
							? 'Comprehensive analytics for the entire platform'
							: 'Detailed performance metrics for your restaurant'}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {selectedPeriod ===
						'7days'
							? 'bg-slate-900 text-white'
							: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
						onclick={() => (selectedPeriod = '7days')}
					>
						7 Days
					</button>
					<button
						class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {selectedPeriod ===
						'30days'
							? 'bg-slate-900 text-white'
							: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
						onclick={() => (selectedPeriod = '30days')}
					>
						30 Days
					</button>
					<button
						class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {selectedPeriod ===
						'all'
							? 'bg-slate-900 text-white'
							: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
						onclick={() => (selectedPeriod = 'all')}
					>
						All Time
					</button>
				</div>
			</div>
		</div>
	</header>

	<main class="container mx-auto px-4 py-8">
		{#if isSuper}
			<!-- SUPER RESTAURANT VIEW -->
			<div class="space-y-8">
				<!-- Executive Summary -->
				<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
					<h2 class="font-heading mb-4 text-lg font-semibold text-slate-900">Executive Summary</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						<div class="rounded-lg border border-slate-100 bg-slate-50 p-4">
							<p class="mb-1 text-xs tracking-wider text-slate-500 uppercase">
								Total Platform Revenue
							</p>
							<p class="text-2xl font-bold text-slate-900">
								{formatCurrency(data.stats?.totalRevenue || 0)}
							</p>
							<p class="mt-1 text-xs text-slate-500">
								Across {data.stats?.totalRestaurants || 0} restaurants
							</p>
						</div>
						<div class="rounded-lg border border-slate-100 bg-slate-50 p-4">
							<p class="mb-1 text-xs tracking-wider text-slate-500 uppercase">Total Orders</p>
							<p class="text-2xl font-bold text-slate-900">{data.stats?.totalOrders || 0}</p>
							<p class="mt-1 text-xs text-slate-500">Delivered successfully</p>
						</div>
						<div class="rounded-lg border border-slate-100 bg-slate-50 p-4">
							<p class="mb-1 text-xs tracking-wider text-slate-500 uppercase">Unique Customers</p>
							<p class="text-2xl font-bold text-slate-900">
								{data.stats?.totalPlatformCustomers || 0}
							</p>
							<p class="mt-1 text-xs text-slate-500">Platform-wide</p>
						</div>
						<div class="rounded-lg border border-slate-100 bg-slate-50 p-4">
							<p class="mb-1 text-xs tracking-wider text-slate-500 uppercase">Your Revenue</p>
							<p class="text-2xl font-bold text-orange-600">
								{formatCurrency(data.myStats?.revenue || 0)}
							</p>
							<p class="mt-1 text-xs text-slate-500">This restaurant</p>
						</div>
					</div>
				</div>

				<!-- Key Metrics Grid -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-sm text-slate-500">Avg Revenue/Restaurant</span>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-orange-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
								</svg>
							</div>
						</div>
						<p class="text-xl font-bold text-slate-900">
							{formatCurrency(data.stats?.avgRevenuePerRestaurant || 0)}
						</p>
						<p class="mt-1 text-xs text-slate-500">
							Median: {formatCurrency(data.stats?.medianRevenue || 0)}
						</p>
					</div>

					<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-sm text-slate-500">Avg Orders/Restaurant</span>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-blue-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
									<line x1="3" y1="6" x2="21" y2="6" />
									<path d="M16 10a4 4 0 0 1-8 0" />
								</svg>
							</div>
						</div>
						<p class="text-xl font-bold text-slate-900">
							{Math.round(data.stats?.avgOrdersPerRestaurant || 0)}
						</p>
						<p class="mt-1 text-xs text-slate-500">
							Median: {Math.round(data.stats?.medianOrders || 0)}
						</p>
					</div>

					<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-sm text-slate-500">Avg Order Value</span>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-green-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="9" cy="21" r="1" />
									<circle cx="20" cy="21" r="1" />
									<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
								</svg>
							</div>
						</div>
						<p class="text-xl font-bold text-slate-900">
							{formatCurrency(data.stats?.platformAvgOrderValue || 0)}
						</p>
						<p class="mt-1 text-xs text-slate-500">Platform-wide average</p>
					</div>

					<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-sm text-slate-500">Customer Retention</span>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-purple-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
									<circle cx="9" cy="7" r="4" />
									<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
									<path d="M16 3.13a4 4 0 0 1 0 7.75" />
								</svg>
							</div>
						</div>
						<p class="text-xl font-bold text-slate-900">
							{data.stats?.platformRecurringRate || '0%'}
						</p>
						<p class="mt-1 text-xs text-slate-500">Returning customers</p>
					</div>
				</div>

				<!-- Two Column Layout -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Top Performing Restaurants -->
					<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div class="border-b border-slate-100 px-6 py-4">
							<h3 class="font-heading text-base font-semibold text-slate-900">
								Top Performing Restaurants
							</h3>
						</div>
						<div class="p-0">
							<table class="w-full">
								<thead class="bg-slate-50">
									<tr>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
											>Rank</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
											>Restaurant</th
										>
										<th
											class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
											>Orders</th
										>
										<th
											class="px-6 py-3 text-right text-xs font-medium tracking-wider text-slate-500 uppercase"
											>Revenue</th
										>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-100">
									{#each data.topRestaurants || [] as restaurant, i}
										<tr class="hover:bg-slate-50">
											<td class="px-6 py-3">
												<span
													class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold {i ===
													0
														? 'bg-yellow-100 text-yellow-700'
														: i === 1
															? 'bg-slate-200 text-slate-700'
															: i === 2
																? 'bg-orange-100 text-orange-700'
																: 'bg-slate-100 text-slate-500'}"
												>
													{i + 1}
												</span>
											</td>
											<td class="px-6 py-3 text-sm font-medium text-slate-900">{restaurant.name}</td
											>
											<td class="px-6 py-3 text-sm text-slate-600">{restaurant.orders}</td>
											<td class="px-6 py-3 text-right text-sm font-semibold text-slate-900"
												>{formatCurrency(restaurant.revenue)}</td
											>
										</tr>
									{:else}
										<tr>
											<td colspan="4" class="px-6 py-8 text-center text-sm text-slate-500"
												>No data available</td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Order Status Breakdown -->
					<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div class="border-b border-slate-100 px-6 py-4">
							<h3 class="font-heading text-base font-semibold text-slate-900">
								Order Status Distribution
							</h3>
						</div>
						<div class="p-6">
							<div class="space-y-4">
								{#each data.statusBreakdown || [] as status}
									{@const total =
										data.statusBreakdown?.reduce((sum: number, s: any) => sum + s.count, 0) || 1}
									{@const percent = Math.round((status.count / total) * 100)}
									<div>
										<div class="mb-1 flex items-center justify-between">
											<span class="text-sm text-slate-700 capitalize">{status.status}</span>
											<span class="text-sm font-medium text-slate-900"
												>{status.count} ({percent}%)</span
											>
										</div>
										<div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
											<div
												class="h-full rounded-full {status.status === 'Delivered'
													? 'bg-green-500'
													: status.status === 'Pending'
														? 'bg-yellow-500'
														: status.status === 'Cancelled'
															? 'bg-red-500'
															: 'bg-slate-400'}"
												style="width: {percent}%"
											></div>
										</div>
									</div>
								{:else}
									<p class="text-sm text-slate-500 text-center py-4">No status data</p>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Category & Customer Analysis -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Dish Categories -->
					<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div class="border-b border-slate-100 px-6 py-4">
							<h3 class="font-heading text-base font-semibold text-slate-900">Dish Categories</h3>
						</div>
						<div class="p-6">
							<div class="space-y-3">
								{#each data.categoryBreakdown || [] as cat}
									{@const total =
										data.categoryBreakdown?.reduce((sum: number, c: any) => sum + c.count, 0) || 1}
									{@const percent = Math.round((cat.count / total) * 100)}
									<div class="flex items-center gap-3">
										<span class="h-2 w-2 rounded-full bg-orange-500"></span>
										<span class="flex-1 text-sm text-slate-700">{cat.name}</span>
										<span class="text-sm font-medium text-slate-900">{cat.count}</span>
										<div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
											<div
												class="h-full rounded-full bg-orange-500"
												style="width: {percent}%"
											></div>
										</div>
									</div>
								{:else}
									<p class="text-sm text-slate-500 text-center py-4">No categories found</p>
								{/each}
							</div>
						</div>
					</div>

					<!-- Platform Metrics Comparison -->
					<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div class="border-b border-slate-100 px-6 py-4">
							<h3 class="font-heading text-base font-semibold text-slate-900">
								Your Performance vs Platform
							</h3>
						</div>
						<div class="p-6">
							<div class="space-y-4">
								<div class="rounded-lg bg-slate-50 p-3">
									<div class="flex items-center justify-between">
										<span class="text-sm text-slate-600">Your Revenue</span>
										<span class="text-lg font-bold text-orange-600"
											>{formatCurrency(data.myStats?.revenue || 0)}</span
										>
									</div>
									<p class="mt-1 text-xs text-slate-500">
										{#if data.stats?.totalRevenue > 0}
											{(((data.myStats?.revenue || 0) / data.stats.totalRevenue) * 100).toFixed(1)}%
											of platform total
										{:else}
											No platform data
										{/if}
									</p>
								</div>
								<div class="rounded-lg bg-slate-50 p-3">
									<div class="flex items-center justify-between">
										<span class="text-sm text-slate-600">Your Orders</span>
										<span class="text-lg font-bold text-blue-600">{data.myStats?.orders || 0}</span>
									</div>
									<p class="mt-1 text-xs text-slate-500">
										{#if data.stats?.totalOrders > 0}
											{(((data.myStats?.orders || 0) / data.stats.totalOrders) * 100).toFixed(1)}%
											of platform total
										{:else}
											No platform data
										{/if}
									</p>
								</div>
								<div class="rounded-lg bg-slate-50 p-3">
									<div class="flex items-center justify-between">
										<span class="text-sm text-slate-600">Your Customers</span>
										<span class="text-lg font-bold text-green-600"
											>{data.myStats?.customers || 0}</span
										>
									</div>
									<p class="mt-1 text-xs text-slate-500">
										{#if data.stats?.totalPlatformCustomers > 0}
											{(
												((data.myStats?.customers || 0) / data.stats.totalPlatformCustomers) *
												100
											).toFixed(1)}% of platform total
										{:else}
											No platform data
										{/if}
									</p>
								</div>
								<div class="rounded-lg bg-slate-50 p-3">
									<div class="flex items-center justify-between">
										<span class="text-sm text-slate-600">Your Avg Order Value</span>
										<span class="text-lg font-bold text-purple-600"
											>{formatCurrency(data.myStats?.avgOrderValue || 0)}</span
										>
									</div>
									<p class="mt-1 text-xs text-slate-500">
										{#if data.stats?.platformAvgOrderValue > 0}
											vs {formatCurrency(data.stats.platformAvgOrderValue)} platform average
										{:else}
											No platform data
										{/if}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- NON-SUPER RESTAURANT VIEW -->
			<div class="space-y-8">
				<!-- Performance Rating Banner -->
				<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
					<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<h2 class="font-heading text-lg font-semibold text-slate-900">Performance Rating</h2>
							<p class="mt-1 text-sm text-slate-500">
								Based on revenue, orders, and average order value compared to industry
							</p>
						</div>
						<div class="flex items-center gap-3">
							<div
								class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
								{data.rating === 'Excellent'
									? 'bg-green-100 text-green-700'
									: data.rating === 'Good'
										? 'bg-blue-100 text-blue-700'
										: data.rating === 'Average'
											? 'bg-yellow-100 text-yellow-700'
											: 'bg-red-100 text-red-700'}"
							>
								{#if data.rating === 'Excellent'}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
										<polyline points="22 4 12 14.01 9 11.01" />
									</svg>
								{:else if data.rating === 'Good'}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
										<polyline points="22 4 12 14.01 9 11.01" />
									</svg>
								{:else if data.rating === 'Average'}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<circle cx="12" cy="12" r="10" />
										<line x1="12" y1="8" x2="12" y2="12" />
										<line x1="12" y1="16" x2="12.01" y2="16" />
									</svg>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<circle cx="12" cy="12" r="10" />
										<line x1="15" y1="9" x2="9" y2="15" />
										<line x1="9" y1="9" x2="15" y2="15" />
									</svg>
								{/if}
								{data.rating}
							</div>
						</div>
					</div>
				</div>

				<!-- Key Metrics -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-sm text-slate-500">Total Revenue</span>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-orange-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
								</svg>
							</div>
						</div>
						<p class="text-xl font-bold text-slate-900">
							{formatCurrency(data.stats?.revenue || 0)}
						</p>
						<p class="mt-1 text-xs text-slate-500">All time</p>
					</div>

					<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-sm text-slate-500">Total Orders</span>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-blue-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
									<line x1="3" y1="6" x2="21" y2="6" />
									<path d="M16 10a4 4 0 0 1-8 0" />
								</svg>
							</div>
						</div>
						<p class="text-xl font-bold text-slate-900">{data.stats?.orders || 0}</p>
						<p class="mt-1 text-xs text-slate-500">Delivered orders</p>
					</div>

					<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-sm text-slate-500">Customers</span>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-green-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
									<circle cx="9" cy="7" r="4" />
								</svg>
							</div>
						</div>
						<p class="text-xl font-bold text-slate-900">{data.stats?.customers || 0}</p>
						<p class="mt-1 text-xs text-slate-500">
							{data.stats?.returningCustomers || 0} returning
						</p>
					</div>

					<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="mb-3 flex items-center justify-between">
							<span class="text-sm text-slate-500">Avg Order Value</span>
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-purple-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="12" y1="1" x2="12" y2="23" />
									<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
								</svg>
							</div>
						</div>
						<p class="text-xl font-bold text-slate-900">
							{formatCurrency(data.stats?.avgOrderValue || 0)}
						</p>
						<p class="mt-1 text-xs text-slate-500">Per order</p>
					</div>
				</div>

				<!-- Percentiles Section -->
				<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
					<h3 class="font-heading mb-6 text-base font-semibold text-slate-900">
						Performance Percentiles
					</h3>
					<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
						<div class="text-center">
							<div class="relative inline-block">
								<svg class="h-28 w-28 -rotate-90">
									<circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" stroke-width="10" />
									<circle
										cx="56"
										cy="56"
										r="48"
										fill="none"
										stroke="#f97316"
										stroke-width="10"
										stroke-dasharray="{data.percentiles?.revenue || 0} 302"
										stroke-linecap="round"
									/>
								</svg>
								<div class="absolute inset-0 flex flex-col items-center justify-center">
									<span class="text-2xl font-bold text-slate-900"
										>{data.percentiles?.revenue || 0}%</span
									>
									<span class="text-xs text-slate-500">Revenue</span>
								</div>
							</div>
							<p class="mt-3 text-sm text-slate-600">
								You earn more than {data.percentiles?.revenue || 0}% of restaurants
							</p>
						</div>

						<div class="text-center">
							<div class="relative inline-block">
								<svg class="h-28 w-28 -rotate-90">
									<circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" stroke-width="10" />
									<circle
										cx="56"
										cy="56"
										r="48"
										fill="none"
										stroke="#3b82f6"
										stroke-width="10"
										stroke-dasharray="{data.percentiles?.orders || 0} 302"
										stroke-linecap="round"
									/>
								</svg>
								<div class="absolute inset-0 flex flex-col items-center justify-center">
									<span class="text-2xl font-bold text-slate-900"
										>{data.percentiles?.orders || 0}%</span
									>
									<span class="text-xs text-slate-500">Orders</span>
								</div>
							</div>
							<p class="mt-3 text-sm text-slate-600">
								You receive more orders than {data.percentiles?.orders || 0}% of restaurants
							</p>
						</div>

						<div class="text-center">
							<div class="relative inline-block">
								<svg class="h-28 w-28 -rotate-90">
									<circle cx="56" cy="56" r="48" fill="none" stroke="#e2e8f0" stroke-width="10" />
									<circle
										cx="56"
										cy="56"
										r="48"
										fill="none"
										stroke="#10b981"
										stroke-width="10"
										stroke-dasharray="{data.percentiles?.avgOrder || 0} 302"
										stroke-linecap="round"
									/>
								</svg>
								<div class="absolute inset-0 flex flex-col items-center justify-center">
									<span class="text-2xl font-bold text-slate-900"
										>{data.percentiles?.avgOrder || 0}%</span
									>
									<span class="text-xs text-slate-500">Avg Order</span>
								</div>
							</div>
							<p class="mt-3 text-sm text-slate-600">
								Your avg order value is higher than {data.percentiles?.avgOrder || 0}% of
								restaurants
							</p>
						</div>
					</div>
				</div>

				<!-- Two Column Layout -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Industry Comparison -->
					<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div class="border-b border-slate-100 px-6 py-4">
							<h3 class="font-heading text-base font-semibold text-slate-900">
								Your Performance vs Industry
							</h3>
						</div>
						<div class="p-6">
							<div class="space-y-5">
								<div>
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm text-slate-600">Revenue vs Industry Average</span>
										<span
											class="text-sm font-bold {parseInt(data.comparison?.revenueVsAvg || '0') >=
											100
												? 'text-green-600'
												: 'text-red-600'}"
										>
											{data.comparison?.revenueVsAvg || 0}%
										</span>
									</div>
									<div class="h-3 w-full overflow-hidden rounded-full bg-slate-100">
										<div
											class="h-full rounded-full {parseInt(data.comparison?.revenueVsAvg || '0') >=
											100
												? 'bg-green-500'
												: 'bg-red-500'}"
											style="width: {Math.min(
												parseInt(data.comparison?.revenueVsAvg || '0'),
												100
											)}%"
										></div>
									</div>
									<p class="mt-1 text-xs text-slate-500">
										{parseInt(data.comparison?.revenueVsAvg || '0') >= 100 ? 'Above' : 'Below'} industry
										average
									</p>
								</div>

								<div>
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm text-slate-600">Orders vs Industry Average</span>
										<span
											class="text-sm font-bold {parseInt(data.comparison?.ordersVsAvg || '0') >= 100
												? 'text-green-600'
												: 'text-red-600'}"
										>
											{data.comparison?.ordersVsAvg || 0}%
										</span>
									</div>
									<div class="h-3 w-full overflow-hidden rounded-full bg-slate-100">
										<div
											class="h-full rounded-full {parseInt(data.comparison?.ordersVsAvg || '0') >=
											100
												? 'bg-green-500'
												: 'bg-red-500'}"
											style="width: {Math.min(parseInt(data.comparison?.ordersVsAvg || '0'), 100)}%"
										></div>
									</div>
									<p class="mt-1 text-xs text-slate-500">
										{parseInt(data.comparison?.ordersVsAvg || '0') >= 100 ? 'Above' : 'Below'} industry
										average
									</p>
								</div>

								<div>
									<div class="mb-2 flex items-center justify-between">
										<span class="text-sm text-slate-600">Avg Order Value vs Industry</span>
										<span
											class="text-sm font-bold {parseInt(data.comparison?.avgOrderVsAvg || '0') >=
											100
												? 'text-green-600'
												: 'text-red-600'}"
										>
											{data.comparison?.avgOrderVsAvg || 0}%
										</span>
									</div>
									<div class="h-3 w-full overflow-hidden rounded-full bg-slate-100">
										<div
											class="h-full rounded-full {parseInt(data.comparison?.avgOrderVsAvg || '0') >=
											100
												? 'bg-green-500'
												: 'bg-red-500'}"
											style="width: {Math.min(
												parseInt(data.comparison?.avgOrderVsAvg || '0'),
												100
											)}%"
										></div>
									</div>
									<p class="mt-1 text-xs text-slate-500">
										{parseInt(data.comparison?.avgOrderVsAvg || '0') >= 100 ? 'Above' : 'Below'} industry
										average
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Industry Benchmarks -->
					<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div class="border-b border-slate-100 px-6 py-4">
							<h3 class="font-heading text-base font-semibold text-slate-900">
								Industry Benchmarks
							</h3>
						</div>
						<div class="p-6">
							<div class="space-y-4">
								<div class="flex items-center justify-between border-b border-slate-100 py-3">
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4 text-orange-600"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
											</svg>
										</div>
										<span class="text-sm text-slate-600">Average Revenue</span>
									</div>
									<span class="text-sm font-bold text-slate-900"
										>{formatCurrency(data.benchmarks?.avgRevenue || 0)}</span
									>
								</div>
								<div class="flex items-center justify-between border-b border-slate-100 py-3">
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4 text-blue-600"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
												<line x1="3" y1="6" x2="21" y2="6" />
											</svg>
										</div>
										<span class="text-sm text-slate-600">Average Orders</span>
									</div>
									<span class="text-sm font-bold text-slate-900"
										>{data.benchmarks?.avgOrders || 0}</span
									>
								</div>
								<div class="flex items-center justify-between border-b border-slate-100 py-3">
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4 text-green-600"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
												<circle cx="9" cy="7" r="4" />
											</svg>
										</div>
										<span class="text-sm text-slate-600">Average Customers</span>
									</div>
									<span class="text-sm font-bold text-slate-900"
										>{data.benchmarks?.avgCustomers || 0}</span
									>
								</div>
								<div class="flex items-center justify-between py-3">
									<div class="flex items-center gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4 text-purple-600"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18" />
											</svg>
										</div>
										<span class="text-sm text-slate-600">Total Restaurants</span>
									</div>
									<span class="text-sm font-bold text-slate-900"
										>{data.benchmarks?.totalRestaurants || 0}</span
									>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Customer Insights -->
				<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
					<h3 class="font-heading mb-6 text-base font-semibold text-slate-900">
						Customer Insights
					</h3>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
						<div class="rounded-lg bg-slate-50 p-4">
							<div class="mb-2 flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-green-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
									<circle cx="8.5" cy="7" r="4" />
									<line x1="20" y1="8" x2="20" y2="14" />
									<line x1="23" y1="11" x2="17" y2="11" />
								</svg>
								<span class="text-sm text-slate-600">First Time Customers</span>
							</div>
							<p class="text-2xl font-bold text-slate-900">{data.stats?.firstTimeCustomers || 0}</p>
							<p class="mt-1 text-xs text-slate-500">
								{data.stats?.customers > 0
									? (((data.stats?.firstTimeCustomers || 0) / data.stats.customers) * 100).toFixed(
											0
										)
									: 0}% of total
							</p>
						</div>
						<div class="rounded-lg bg-slate-50 p-4">
							<div class="mb-2 flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-blue-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
									<circle cx="9" cy="7" r="4" />
									<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
									<path d="M16 3.13a4 4 0 0 1 0 7.75" />
								</svg>
								<span class="text-sm text-slate-600">Returning Customers</span>
							</div>
							<p class="text-2xl font-bold text-slate-900">{data.stats?.returningCustomers || 0}</p>
							<p class="mt-1 text-xs text-slate-500">
								{data.stats?.recurringRate || '0%'} retention rate
							</p>
						</div>
						<div class="rounded-lg bg-slate-50 p-4">
							<div class="mb-2 flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-purple-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10" />
									<polyline points="12 6 12 12 16 14" />
								</svg>
								<span class="text-sm text-slate-600">Peak Order Hour</span>
							</div>
							<p class="text-2xl font-bold text-slate-900">
								{getHourLabel(data.stats?.peakHour || 12)}
							</p>
							<p class="mt-1 text-xs text-slate-500">
								{data.stats?.peakHourOrders || 0} orders at peak
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.font-heading {
		font-family: 'Poppins', sans-serif;
	}
</style>
