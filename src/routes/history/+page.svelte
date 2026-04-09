<script lang="ts">
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import type { RecordModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import Carousel from '$lib/Carousel.svelte';

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
	const canSearch = $derived(Boolean(searchInput.trim()));
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
				<form onsubmit={handleSearchSubmit} class="flex flex-col gap-4 rounded-2xl bg-white/70 p-4 shadow-lg shadow-slate-900/5 md:flex-row md:items-center">
					<div class="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-md shadow-slate-900/5">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
						<input
							type="text"
							bind:value={searchInput}
							placeholder="Search by reference, name, or phone..."
							class="w-full bg-transparent py-2 text-slate-700 placeholder-slate-400 focus:outline-none"
						/>
					</div>
					<select bind:value={selectedCategoryInput} class="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-md shadow-slate-900/5 focus:ring-2 focus:ring-slate-500 focus:outline-none">
						<option value="All">All Status</option>
						<option value="Delivered">Delivered</option>
						<option value="Cancelled">Cancelled</option>
					</select>
					<div class="flex gap-2 md:ml-auto">
						<button type="submit" disabled={!canSearch} class="rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-white transition enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300">Search</button>
						{#if searchInput || selectedCategoryInput !== 'All'}
							<button type="button" onclick={clearSearch} class="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-200">Clear</button>
						{/if}
					</div>
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
				<Carousel>
					{#each filteredOrders as order, i}
						<article
							id="order-{order.id}"
							class="w-[min(26rem,88vw)] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-xl"
							in:fly={{ y: 20, duration: 300, delay: i * 50 }}
						>
							<div class="mb-5 flex items-start justify-between gap-4">
								<div>
									<p class="text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">Completed Order</p>
									<h3 class="mt-1 font-playfair text-xl font-semibold text-slate-900">{order.reference}</h3>
									<p class="mt-1 text-sm text-slate-500">For {order.name || 'Guest'}</p>
								</div>
								<div class="flex flex-col items-end gap-2">
									<span class="rounded-full border px-3 py-1 text-xs font-semibold {getStatusColor(order.status)}">{order.status}</span>
									{#if order.restaurantName || order.expand?.restaurant?.name}
										<span class="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white">{order.restaurantName || order.expand?.restaurant?.name}</span>
									{/if}
								</div>
							</div>

							<div class="mb-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 text-white">
								<div class="flex items-end justify-between gap-3">
									<div>
										<p class="text-xs uppercase tracking-[0.2em] text-white/70">Final Amount</p>
										<p class="mt-1 text-3xl font-bold">₦{(order.orderTotal ?? order.totalAmount ?? 0).toLocaleString()}</p>
									</div>
									<div class="text-right text-sm text-white/80">
										<p>{order.quantity} item{order.quantity !== 1 ? 's' : ''}</p>
										<p>{#if order.deliveryType === 'tableService'}Table Service{:else if order.deliveryType === 'home'}Home Delivery{:else if order.deliveryType === 'restaurantPickup'}Pickup{:else}{order.deliveryType}{/if}</p>
									</div>
								</div>
							</div>

							<div class="mb-4 grid grid-cols-2 gap-3 text-sm">
								<div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
									<p class="text-xs uppercase tracking-wide text-slate-400">Store</p>
									<p class="mt-1 font-semibold text-slate-800">{order.restaurantName || order.expand?.restaurant?.name || 'Restaurant'}</p>
								</div>
								<div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
									<p class="text-xs uppercase tracking-wide text-slate-400">Closed</p>
									<p class="mt-1 font-semibold text-slate-800">{new Date(order.updated).toLocaleDateString()}</p>
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

							<details class="mb-4 rounded-2xl border border-slate-200 bg-white open:bg-slate-50">
								<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
									<div class="flex items-center justify-between gap-3">
										<span>Order Items ({order.dishes?.length || 0})</span>
										<span class="text-xs font-medium text-slate-400">Tap to expand</span>
									</div>
								</summary>
								<div class="space-y-2 px-4 pb-4">
									{#each order.dishes as item}
										<div class="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm shadow-sm shadow-slate-900/5">
											<div>
												<p class="font-medium text-slate-800">{item.name}</p>
												<p class="text-xs text-slate-400">Quantity</p>
											</div>
											<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">×{item.quantity}</span>
										</div>
									{/each}
								</div>
							</details>

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
										<div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
											<div class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
												<div>
													<p class="text-xs font-semibold tracking-[0.18em] text-amber-700 uppercase">Combined Payment</p>
													<p class="mt-1 text-sm font-medium text-amber-900">Paid together with {relatedOrders.length} other order{relatedOrders.length !== 1 ? 's' : ''}</p>
												</div>
												<div class="rounded-xl bg-amber-100 px-3 py-2 text-left sm:text-right">
													<p class="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Total Paid</p>
													<p class="mt-1 text-base font-bold text-amber-950">₦{grandTotal.toLocaleString()}</p>
												</div>
											</div>
											<div class="space-y-2">
													{#each relatedOrders as relatedOrder}
														<div
															class="rounded-2xl bg-white px-3 py-3 shadow-sm shadow-amber-900/5"
														>
															<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
																<div class="min-w-0">
																	<p class="truncate font-semibold text-slate-900">{relatedOrder.reference}</p>
																	<p class="mt-1 text-xs text-slate-500">{relatedOrder.restaurantName || 'Restaurant'}</p>
																</div>
																<div class="text-left sm:text-right">
																	<span class="rounded-full border px-2 py-0.5 text-[10px] font-medium {getStatusColor(relatedOrder.status)}">{relatedOrder.status}</span>
																	<p class="mt-2 font-semibold text-slate-800">₦{(relatedOrder.orderTotal ?? relatedOrder.totalAmount ?? 0).toLocaleString()}</p>
																</div>
															</div>
														</div>
													{/each}
											</div>
										</div>
									{/if}
								{/if}
							<!-- Footer -->
							<div class="border-t border-slate-100 pt-3 text-xs text-slate-400">
								Completed: {new Date(order.updated).toLocaleDateString()} at {new Date(
									order.updated
								).toLocaleTimeString()}
							</div>
						</article>
					{/each}
				</Carousel>
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
