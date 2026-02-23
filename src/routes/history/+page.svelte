<script lang="ts">
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import type { RecordModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fly } from 'svelte/transition';

	export const user = derived(page, ($page) => $page.data.user);

	export async function fetchPendingOrders() {
		const userId = get(user)?.id;
		const restaurantId = get(page).data.restaurant?.id;
		const isSuper = get(page).data.isSuper ?? false;

		if (!userId) return;

		let filter = `user="${userId}" && (status="Delivered" || status="Cancelled")`;

		// Filter by restaurant if not a super restaurant
		if (restaurantId && !isSuper) {
			filter += ` && restaurantId="${restaurantId}"`;
		}

		try {
			const records = await pb.collection('orders').getFullList({
				filter,
				sort: '-updated',
				expand: 'dish,restaurant'
			});
			return records;
		} catch (err) {
			console.error('Failed to fetch settled orders:', err);
		}
	}

	let orders: RecordModel[] = $state([]);
	let filteredOrders: RecordModel[] = $state([]);
	let loading = $state(true);
	let searchInput = $state('');
	let selectedCategoryInput = $state('All');
	const restaurantName = get(page).data.restaurant?.name;

	// Group orders by mainReference for multi-restaurant orders
	function getOrderGroups(ordersList: any[]) {
		const groups: Record<string, any[]> = {};
		ordersList.forEach((order: any) => {
			const key = order.mainReference || order.reference;
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(order);
		});
		return groups;
	}

	const orderGroups = $derived(getOrderGroups(filteredOrders));

	function isMultiRestaurantOrder(order: any) {
		return order.isMultiRestaurantOrder === true || order.totalRestaurants > 1;
	}

	// Client-side filtered orders
	$effect(() => {
		filteredOrders = orders.filter((order: any) => {
			const matchesSearch =
				!searchInput.trim() ||
				order.reference?.toLowerCase().includes(searchInput.toLowerCase()) ||
				order.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
				order.phone?.toLowerCase().includes(searchInput.toLowerCase()) ||
				order.deliveryType?.toLowerCase().includes(searchInput.toLowerCase());

			const matchesCategory =
				selectedCategoryInput === 'All' || order.status === selectedCategoryInput;

			return matchesSearch && matchesCategory;
		});
	});

	onMount(async () => {
		orders = (await fetchPendingOrders()) || [];
		filteredOrders = orders;
		loading = false;

		// Handle notification click - check URL params
		const urlParams = new URLSearchParams(window.location.search);
		const orderIdFromNotify = urlParams.get('orderId');

		// Clear URL params after reading
		if (orderIdFromNotify) {
			window.history.replaceState({}, '', '/history');

			setTimeout(() => {
				const orderElement = document.getElementById(`order-${orderIdFromNotify}`);
				if (orderElement) {
					orderElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
					orderElement.classList.add('ring-2', 'ring-primary');
					setTimeout(() => {
						orderElement.classList.remove('ring-2', 'ring-primary');
					}, 3000);
				}
			}, 500);
		}
	});

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	function handleSearchSubmit(e: Event) {
		e.preventDefault();
		// Search is handled client-side via $effect
	}

	function clearSearch() {
		searchInput = '';
		selectedCategoryInput = 'All';
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'Delivered':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200';
			case 'Cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-slate-100 text-slate-800 border-slate-200';
		}
	}
</script>

<svelte:head>
	<title>Order History - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-12 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1 class="font-playfair mb-2 text-3xl font-bold md:text-4xl">Order History</h1>
			<p class="text-white/80">View your past orders and details</p>
		</div>
	</section>

	<!-- Orders -->
	<main class="container mx-auto px-4 py-8">
		<!-- Search and Filter -->
		{#if $isLoggedIn && !loading && orders.length > 0}
			<div class="mb-8">
				<form onsubmit={handleSearchSubmit} class="flex flex-col gap-4 md:flex-row md:items-center">
					<input
						type="text"
						bind:value={searchInput}
						placeholder="Search by reference, name, or phone..."
						class="input input-bordered flex-1 border-slate-300"
					/>
					<select
						bind:value={selectedCategoryInput}
						class="select select-bordered border-slate-300"
					>
						<option value="All">All Status</option>
						<option value="Delivered">Delivered</option>
						<option value="Cancelled">Cancelled</option>
					</select>
					{#if searchInput || selectedCategoryInput !== 'All'}
						<button type="button" onclick={clearSearch} class="btn btn-ghost"> Clear </button>
					{/if}
				</form>
			</div>
		{/if}

		{#if $isLoggedIn}
			{#if loading}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each Array(3) as _}
						<div class="animate-pulse rounded-2xl bg-white p-6 shadow-md">
							<div class="mb-4 h-6 w-3/4 rounded bg-slate-200"></div>
							<div class="mb-2 h-4 w-1/2 rounded bg-slate-200"></div>
							<div class="h-20 w-full rounded bg-slate-200"></div>
						</div>
					{/each}
				</div>
			{:else if filteredOrders.length === 0}
				<div class="py-16 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto h-16 w-16 text-slate-300"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path d="M12 8v4l3 3" />
						<circle cx="12" cy="12" r="10" />
					</svg>
					<h3 class="mt-4 text-lg font-medium text-slate-700">No Order History</h3>
					<p class="mt-1 text-slate-500">You haven't completed any orders yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredOrders as order, i}
						<article
							id="order-{order.id}"
							class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
							in:fly={{ y: 20, duration: 300, delay: i * 50 }}
						>
							<!-- Header -->
							<div class="mb-4 flex items-start justify-between">
								<div>
									<p class="text-sm text-slate-500">Order Reference</p>
									<h3 class="font-playfair text-lg font-semibold text-slate-900">
										{order.reference}
									</h3>
									{#if isMultiRestaurantOrder(order)}
										<div class="mt-1 flex flex-wrap gap-1">
											<span
												class="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
											>
												Multi-restaurant Order
											</span>
											{#if order.totalRestaurants > 1}
												<span class="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
													{order.totalRestaurants} restaurants
												</span>
											{/if}
										</div>
									{/if}
								</div>
								<div class="flex flex-col items-end gap-1">
									<span
										class="rounded-full border px-3 py-1 text-xs font-medium {getStatusColor(
											order.status
										)}"
									>
										{order.status}
									</span>
									{#if order.restaurantName || order.expand?.restaurant?.name}
										<span
											class="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-white"
										>
											{order.restaurantName || order.expand?.restaurant?.name}
										</span>
									{/if}
								</div>
							</div>

							<!-- Details -->
							<div class="mb-4 space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-slate-500">Restaurant</span>
									<span class="font-semibold text-slate-800"
										>{order.restaurantName || 'Restaurant'}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-500">Customer</span>
									<span class="font-medium text-slate-900">{order.name || 'Guest'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-500">Total</span>
									<span class="font-semibold text-slate-700"
										>₦{(order.orderTotal ?? order.totalAmount ?? 0).toLocaleString()}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-500">Items</span>
									<span class="font-medium text-slate-900">{order.quantity}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-500">Type</span>
									<span class="text-slate-900">
										{#if order.deliveryType === 'tableService'}Table Service
										{:else if order.deliveryType === 'home'}Home Delivery
										{:else if order.deliveryType === 'restaurantPickup'}Pickup
										{:else}{order.deliveryType}{/if}
									</span>
								</div>
							</div>

							<!-- Additional Info -->
							{#if order.deliveryType === 'restaurantPickup' && order.pickupTime}
								<p class="mb-3 text-sm text-slate-600">
									<strong>Pickup:</strong>
									{order.pickupTime}
								</p>
							{:else if order.deliveryType === 'home' && order.homeAddress}
								<div class="mb-3 space-y-1 text-sm">
									<p class="text-slate-600">
										<strong>Address:</strong>
										{order.homeAddress}
									</p>
									{#if order.deliveryFee > 0}
										<p class="text-slate-600">
											<strong>Delivery:</strong>
											₦{order.deliveryFee.toLocaleString()}
											{#if order.deliveryDistance > 0}
												<span class="text-slate-400">({order.deliveryDistance}km)</span>
											{/if}
										</p>
									{/if}
								</div>
							{:else if order.deliveryType === 'tableService' && order.tableNumber}
								<p class="mb-3 text-sm text-slate-600">
									<strong>Table:</strong>
									{order.tableNumber}
								</p>
							{/if}

							<!-- Dishes -->
							<div class="mb-4 border-t border-slate-100 pt-4">
								<button
									class="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
									onclick={(e) => {
										const details = e.currentTarget.nextElementSibling;
										if (details) details.classList.toggle('hidden');
									}}
								>
									<span>View Dishes</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="m6 9 6 6 6-6" />
									</svg>
								</button>
								<div class="mt-2 hidden space-y-2">
									{#each order.dishes as item}
										<div class="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
											<span class="text-slate-800">{item.name}</span>
											<span class="text-slate-500">×{item.quantity}</span>
										</div>
									{/each}
								</div>

								<!-- Multi-restaurant orders paid together -->
								{#if isMultiRestaurantOrder(order) && orderGroups[order.mainReference || order.reference]?.length > 1}
									{@const relatedOrders = orderGroups[
										order.mainReference || order.reference
									].filter((o: any) => o.id !== order.id)}
									{@const allOrdersInGroup = orderGroups[order.mainReference || order.reference]}
									{@const grandTotal = allOrdersInGroup.reduce(
										(sum: number, o: any) => sum + (o.orderTotal ?? o.totalAmount ?? 0),
										0
									)}
									{#if relatedOrders.length > 0}
										<div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
											<p class="mb-2 text-xs font-medium text-amber-800">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="mr-1 inline h-3 w-3"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
													<path
														fill-rule="evenodd"
														d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
														clip-rule="evenodd"
													/>
												</svg>
												Paid together with {relatedOrders.length} other order(s):
											</p>
											<div class="space-y-2">
												{#each relatedOrders as relatedOrder}
													<div
														class="flex items-center justify-between rounded bg-white/70 px-2 py-1.5 text-xs"
													>
														<div class="flex items-center gap-2">
															<span class="min-w-[60px] font-medium text-gray-900"
																>{relatedOrder.reference}</span
															>
															<span
																class="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700"
															>
																{relatedOrder.restaurantName || 'Restaurant'}
															</span>
															<span
																class="rounded-full border px-1.5 py-0.5 text-[10px] {getStatusColor(
																	relatedOrder.status
																)}"
															>
																{relatedOrder.status}
															</span>
														</div>
														<span class="font-semibold text-slate-700">
															₦{(
																relatedOrder.orderTotal ??
																relatedOrder.totalAmount ??
																0
															).toLocaleString()}
														</span>
													</div>
												{/each}
											</div>
											<div
												class="mt-2 flex items-center justify-between rounded bg-amber-100 px-2 py-1.5 text-xs"
											>
												<span class="font-semibold text-amber-900">Total Paid:</span>
												<span class="font-bold text-amber-900">₦{grandTotal.toLocaleString()}</span>
											</div>
										</div>
									{/if}
								{/if}
							</div>

							<!-- Footer -->
							<div class="border-t border-slate-100 pt-3 text-xs text-slate-400">
								Completed: {new Date(order.updated).toLocaleDateString()} at {new Date(
									order.updated
								).toLocaleTimeString()}
							</div>
						</article>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="py-16 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-slate-300"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
					<polyline points="10 17 15 12 10 7" />
					<line x1="15" x2="3" y1="12" y2="12" />
				</svg>
				<h3 class="mt-4 text-lg font-medium text-slate-700">Login Required</h3>
				<p class="mt-1 text-slate-500">Please login to view your order history.</p>
				<a href="/login" class="btn btn-primary mt-4">Sign In</a>
			</div>
		{/if}
	</main>
</div>
