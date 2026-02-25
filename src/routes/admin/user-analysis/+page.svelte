<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import Chart from 'chart.js/auto';

	let { data } = $props();

	let selectedPeriod = $state('last30');
	let searchQuery = $state('');
	let selectedCustomer = $state<any>(null);
	let showCustomerModal = $state(false);

	const customers = data.customerStats ?? [];
	const userOrdersMap = data.userOrdersMap ?? {};

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

	const filteredCustomers = $derived(() => {
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

	const stats = $derived({
		totalCustomers: customers.length,
		newCustomers: customers.filter((c: any) => c.orderCount === 1).length,
		returningCustomers: customers.filter((c: any) => c.orderCount > 1).length,
		vipCustomers: customers.filter((c: any) => getCustomerMetrics(c).totalSpent >= 100000).length,
		totalRevenue: customers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0),
		avgOrderValue:
			customers.length > 0
				? Math.round(
						customers.reduce((sum: number, c: any) => sum + (c.totalSpent || 0), 0) /
							customers.length
					)
				: 0
	});
</script>

<svelte:head>
	<title>User Analysis - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-6 text-center text-white md:py-8"
	>
		<div class="container mx-auto px-4">
			<h1 class="font-playfair text-2xl font-bold md:text-4xl">User Analysis</h1>
			<p class="mt-2 text-white/80">Understand your customers better</p>
		</div>
	</section>

	<!-- Stats -->
	<section class="container mx-auto -mt-4 px-4">
		<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
			<div class="rounded-xl bg-white p-3 shadow-lg shadow-slate-200 md:p-4">
				<div class="text-xl font-bold text-slate-800 md:text-2xl">{stats.totalCustomers}</div>
				<div class="text-xs text-slate-500 md:text-sm">Total Users</div>
			</div>
			<div class="rounded-xl bg-white p-3 shadow-lg shadow-slate-200 md:p-4">
				<div class="text-xl font-bold text-emerald-600 md:text-2xl">{stats.newCustomers}</div>
				<div class="text-xs text-slate-500 md:text-sm">New Users</div>
			</div>
			<div class="rounded-xl bg-white p-3 shadow-lg shadow-slate-200 md:p-4">
				<div class="text-xl font-bold text-blue-600 md:text-2xl">{stats.returningCustomers}</div>
				<div class="text-xs text-slate-500 md:text-sm">Returning</div>
			</div>
			<div class="rounded-xl bg-white p-3 shadow-lg shadow-slate-200 md:p-4">
				<div class="text-xl font-bold text-purple-600 md:text-2xl">{stats.vipCustomers}</div>
				<div class="text-xs text-slate-500 md:text-sm">VIP</div>
			</div>
			<div
				class="col-span-2 rounded-xl bg-white p-3 shadow-lg shadow-slate-200 md:col-span-1 md:p-4"
			>
				<div class="text-xl font-bold text-slate-800 md:text-2xl">
					₦{(stats.totalRevenue || 0).toLocaleString()}
				</div>
				<div class="text-xs text-slate-500 md:text-sm">Total Revenue</div>
			</div>
			<div
				class="col-span-2 rounded-xl bg-white p-3 shadow-lg shadow-slate-200 md:col-span-1 md:p-4"
			>
				<div class="text-xl font-bold text-slate-800 md:text-2xl">
					₦{stats.avgOrderValue.toLocaleString()}
				</div>
				<div class="text-xs text-slate-500 md:text-sm">Avg Order</div>
			</div>
		</div>
	</section>

	<!-- Search & Filters -->
	<section class="container mx-auto mt-6 px-4">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="relative flex-1">
				<svg
					class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
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
					placeholder="Search by name, email, or phone..."
					class="focus:border-primary w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm focus:outline-none md:py-3 md:text-base"
				/>
			</div>
			<div class="flex gap-2">
				<select
					bind:value={selectedPeriod}
					class="focus:border-primary rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none"
				>
					<option value="last7">Last 7 Days</option>
					<option value="last30">Last 30 Days</option>
					<option value="last90">Last 90 Days</option>
					<option value="all">All Time</option>
				</select>
			</div>
		</div>
	</section>

	<!-- Customer List -->
	<section class="container mx-auto mt-6 px-4 pb-12">
		<div class="overflow-x-auto rounded-xl bg-white shadow-md">
			<table class="w-full min-w-[600px]">
				<thead class="bg-slate-50">
					<tr>
						<th
							class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase"
							>Customer</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase"
							>Orders</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase"
							>Total Spent</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase"
							>Avg Order</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase"
							>Tier</th
						>
						<th
							class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase"
							>Last Order</th
						>
						<th
							class="px-4 py-3 text-right text-xs font-semibold tracking-wider text-slate-600 uppercase"
							>Action</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filteredCustomers() as customer}
						{@const metrics = getCustomerMetrics(customer)}
						{@const tierInfo = getCustomerTier(customer)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600"
									>
										{customer.name?.charAt(0)?.toUpperCase() || 'U'}
									</div>
									<div>
										<p class="font-medium text-slate-900">{customer.name || 'Unknown'}</p>
										<p class="text-xs text-slate-500">{customer.email || 'No email'}</p>
									</div>
								</div>
							</td>
							<td class="px-4 py-3">
								<span class="font-medium text-slate-900">{metrics.totalOrders}</span>
							</td>
							<td class="px-4 py-3">
								<span class="font-medium text-slate-900"
									>₦{(metrics.totalSpent || 0).toLocaleString()}</span
								>
							</td>
							<td class="px-4 py-3">
								<span class="text-slate-600">₦{metrics.avgOrderValue.toLocaleString()}</span>
							</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium {tierInfo.color}"
								>
									<span>{tierInfo.icon}</span>
									{tierInfo.tier}
								</span>
							</td>
							<td class="px-4 py-3">
								<span class="text-sm text-slate-600">
									{metrics.lastOrderDate ? getTimeSince(metrics.lastOrderDate) : 'Never'}
								</span>
							</td>
							<td class="px-4 py-3 text-right">
								<button
									onclick={() => viewCustomerDetails(customer)}
									class="bg-primary hover:bg-primary/90 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors"
								>
									View
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-4 py-8 text-center text-slate-500">
								{#if searchQuery}
									No customers found matching "{searchQuery}"
								{:else}
									No customer data available yet
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>

<!-- Customer Details Modal -->
{#if showCustomerModal && selectedCustomer}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={closeCustomerModal}
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-slate-100 p-4 md:p-6">
				<div class="flex items-center gap-3">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600"
					>
						{selectedCustomer.name?.charAt(0)?.toUpperCase() || 'U'}
					</div>
					<div>
						<h3 class="text-lg font-bold text-slate-900">
							{selectedCustomer.name || 'Unknown User'}
						</h3>
						<p class="text-sm text-slate-500">{selectedCustomer.email || 'No email'}</p>
					</div>
				</div>
				<button
					onclick={closeCustomerModal}
					class="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
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

			<!-- Customer Metrics -->
			<div class="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 md:grid-cols-4 md:p-6">
				<div class="rounded-xl bg-slate-50 p-3">
					<div class="text-lg font-bold text-slate-900">{selectedCustomer.metrics.totalOrders}</div>
					<div class="text-xs text-slate-500">Total Orders</div>
				</div>
				<div class="rounded-xl bg-slate-50 p-3">
					<div class="text-lg font-bold text-emerald-600">
						₦{selectedCustomer.metrics.totalSpent.toLocaleString()}
					</div>
					<div class="text-xs text-slate-500">Total Spent</div>
				</div>
				<div class="rounded-xl bg-slate-50 p-3">
					<div class="text-lg font-bold text-slate-900">
						₦{selectedCustomer.metrics.avgOrderValue.toLocaleString()}
					</div>
					<div class="text-xs text-slate-500">Avg Order</div>
				</div>
				<div class="rounded-xl bg-slate-50 p-3">
					<div class="text-lg font-bold text-purple-600">{selectedCustomer.tier.tier}</div>
					<div class="text-xs text-slate-500">Customer Tier</div>
				</div>
			</div>

			<!-- Contact Info -->
			<div class="border-b border-slate-100 p-4 md:p-6">
				<h4 class="mb-3 font-semibold text-slate-900">Contact Information</h4>
				<div class="grid gap-3 md:grid-cols-2">
					<div>
						<p class="text-xs text-slate-500">Phone</p>
						<p class="font-medium text-slate-900">{selectedCustomer.phone || 'Not provided'}</p>
					</div>
					<div>
						<p class="text-xs text-slate-500">Email</p>
						<p class="font-medium text-slate-900">{selectedCustomer.email || 'Not provided'}</p>
					</div>
					{#if selectedCustomer.address}
						<div class="md:col-span-2">
							<p class="text-xs text-slate-500">Address</p>
							<p class="font-medium text-slate-900">{selectedCustomer.address}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Order History -->
			<div class="p-4 md:p-6">
				<h4 class="mb-3 font-semibold text-slate-900">Order History</h4>
				{#if selectedCustomer.orders?.length > 0}
					<div class="space-y-3">
						{#each selectedCustomer.orders.slice(0, 10) as order}
							<div class="flex items-center justify-between rounded-lg border border-slate-100 p-3">
								<div>
									<p class="font-medium text-slate-900">
										#{order.id?.slice(0, 8) || 'N/A'}
									</p>
									<p class="text-xs text-slate-500">
										{new Date(order.created).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</p>
								</div>
								<div class="text-right">
									<p class="font-medium text-slate-900">
										₦{(order.orderTotal || order.totalAmount || 0).toLocaleString()}
									</p>
									<span
										class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
									>
										{order.status || 'Delivered'}
									</span>
								</div>
							</div>
						{/each}
						{#if selectedCustomer.orders.length > 10}
							<p class="text-center text-sm text-slate-500">
								+ {selectedCustomer.orders.length - 10} more orders
							</p>
						{/if}
					</div>
				{:else}
					<p class="text-center text-slate-500">No orders found</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
