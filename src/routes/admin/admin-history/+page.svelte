<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import Carousel from '$lib/Carousel.svelte';

	export const user = derived(page, ($page) => $page.data.user);

	let searchInput = $state('');
	let selectedCategoryInput = $state('All');
	let selectedRestaurantInput = $state('All');
	let orders: any = $state([]);
	let filteredOrders: any = $state([]);
	let loading = $state(true);
	const canSearch = $derived(Boolean(searchInput.trim()));
	const restaurantName = get(page).data.restaurant?.name;
	const allRestaurants = get(page).data.allRestaurantsIncludingSuper ?? [];
	const currentRestaurantId = get(page).data.restaurantId;
	const isSuper = get(page).data.isSuper ?? false;

	// Client-side filtered orders
	$effect(() => {
		filteredOrders = orders.filter((order: any) => {
			const matchesSearch =
				!searchInput.trim() ||
				order.reference?.toLowerCase().includes(searchInput.toLowerCase()) ||
				order.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
				order.phone?.toLowerCase().includes(searchInput.toLowerCase()) ||
				order.deliveryType?.toLowerCase().includes(searchInput.toLowerCase()) ||
				order.expand?.restaurant?.name?.toLowerCase().includes(searchInput.toLowerCase());

			const matchesCategory =
				selectedCategoryInput === 'All' || order.status === selectedCategoryInput;

			const matchesRestaurant =
				selectedRestaurantInput === 'All' || order.restaurantId === selectedRestaurantInput;

			return matchesSearch && matchesCategory && matchesRestaurant;
		});
	});

	export async function fetchPendingOrders() {
		const userId = get(user)?.id;

		if (!userId) return;

		let filterParts: string[] = [];
		filterParts.push(`(status="Delivered" || status="Cancelled")`);

		// Filter by restaurant for non-super restaurants
		if (!isSuper && currentRestaurantId) {
			filterParts.push(`restaurantId="${currentRestaurantId}"`);
		}

		const filter = filterParts.join(' && ');
		try {
			const records = await pb.collection('orders').getFullList({
				filter,
				sort: '-updated',
				expand: 'dish,restaurant'
			});
			orders = records;
			filteredOrders = records;
			loading = false;
			return records;
		} catch (err) {
			console.error('Failed to fetch order history:', err);
		}
	}

	onMount(async () => {
		orders = (await fetchPendingOrders()) || [];
		filteredOrders = orders;
		loading = false;
	});

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	function clearSearch() {
		searchInput = '';
		selectedCategoryInput = 'All';
		selectedRestaurantInput = 'All';
	}

	function handleSearchSubmit(e: Event) {
		e.preventDefault();
		// Search is handled client-side via $effect
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
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-8 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1
				class="font-playfair mb-2 text-2xl font-bold md:text-3xl"
				in:fly={{ y: 20, duration: 400 }}
			>
				Order History
			</h1>
			<p class="text-sm text-slate-300" in:fly={{ y: 20, duration: 400, delay: 100 }}>
				View completed and cancelled orders
			</p>
		</div>
	</section>

	<!-- Search & Filters -->
	<section class="container mx-auto px-4 py-6">
		<form onsubmit={handleSearchSubmit} class="flex flex-col gap-4 rounded-2xl bg-white/70 p-4 shadow-lg shadow-slate-900/5 md:flex-row md:items-center">
			<div
				class="flex flex-1 items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-md shadow-slate-900/5"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-slate-400"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
				</svg>
				<input
					type="text"
					name="search"
					bind:value={searchInput}
					placeholder="Search orders..."
					class="w-full bg-transparent py-2 text-slate-700 placeholder-slate-400 focus:outline-none"
				/>
			</div>

			<div class="flex flex-wrap gap-2">
				<select
					name="restaurant"
					bind:value={selectedRestaurantInput}
					class="rounded-xl border-0 bg-white px-4 py-2.5 shadow-md shadow-slate-900/5 focus:ring-2 focus:ring-slate-500 focus:outline-none"
				>
					<option value="All">All Restaurants</option>
					{#each allRestaurants as restaurant}
						<option value={restaurant.id}>{restaurant.name}</option>
					{/each}
				</select>

				<select
					name="category"
					bind:value={selectedCategoryInput}
					class="rounded-xl border-0 bg-white px-4 py-2.5 shadow-md shadow-slate-900/5 focus:ring-2 focus:ring-slate-500 focus:outline-none"
				>
					<option value="All">All Statuses</option>
					<option value="Delivered">Delivered</option>
					<option value="Cancelled">Cancelled</option>
				</select>
			</div>

			<div class="flex gap-2 md:ml-auto">
				<button type="submit" disabled={!canSearch} class="rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-white transition enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300">Search</button>
				{#if searchInput || selectedCategoryInput !== 'All' || selectedRestaurantInput !== 'All'}
					<button type="button" onclick={clearSearch} class="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-200">Clear</button>
				{/if}
			</div>
		</form>
	</section>

	<!-- Orders -->
	<main class="container mx-auto px-4 pb-8">
		{#if $isLoggedIn}
			{#if loading}
				<div class="flex justify-center py-12">
					<svg
						class="h-10 w-10 animate-spin text-slate-400"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
			{:else}
				<!-- Summary Cards -->
				<div class="mb-6 grid gap-4 sm:grid-cols-2">
					<div class="rounded-xl bg-white p-4 shadow-md shadow-slate-900/5">
						<p class="text-sm text-slate-500">Total Orders</p>
						<p class="text-2xl font-bold text-slate-800">{filteredOrders.length}</p>
					</div>
					<div class="rounded-xl bg-white p-4 shadow-md shadow-slate-900/5">
						<p class="text-sm text-slate-500">Total Amount</p>
						<p class="text-2xl font-bold text-emerald-600">
							₦{filteredOrders
								.reduce((sum: number, o: any) => sum + (o.orderTotal ?? o.totalAmount ?? 0), 0)
								.toLocaleString()}
						</p>
					</div>
				</div>

				{#if filteredOrders.length === 0}
					<div class="py-16 text-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mx-auto h-16 w-16 text-slate-300"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						<h3 class="mt-4 text-lg font-medium text-slate-700">No Order History</h3>
						<p class="mt-1 text-slate-500">You have no completed orders yet.</p>
					</div>
				{:else}
					<Carousel>
						{#each filteredOrders as order}
							<article
								class="w-[min(26rem,88vw)] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-xl"
								in:fly={{ y: 20, duration: 300 }}
							>
								<div class="mb-5 flex items-start justify-between gap-4">
									<div>
										<p class="text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">Archived Order</p>
										<h3 class="mt-1 font-mono text-base font-semibold text-slate-900">{order.reference}</h3>
										<p class="mt-1 text-sm text-slate-500">{order.name || 'Guest'}</p>
									</div>
									<span class="rounded-full border px-3 py-1 text-xs font-semibold {getStatusColor(order.status)}">{order.status}</span>
								</div>

								<div class="mb-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-4 text-white">
									<p class="text-xs uppercase tracking-[0.2em] text-white/60">Recorded Total</p>
									<div class="mt-2 flex items-end justify-between gap-3">
										<p class="text-3xl font-bold">₦{(order.orderTotal ?? order.totalAmount ?? 0).toLocaleString()}</p>
										<div class="text-right text-sm text-white/70">
											<p>{order.quantity} item{order.quantity !== 1 ? 's' : ''}</p>
											<p>{order.restaurantName || restaurantName}</p>
										</div>
									</div>
								</div>

								<div class="mb-4 grid grid-cols-2 gap-3 text-sm">
									<div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
										<p class="text-xs uppercase tracking-wide text-slate-400">Fulfilment</p>
										<p class="mt-1 font-semibold text-slate-800">{#if order.deliveryType === 'restaurantPickup'}Pickup{:else if order.deliveryType === 'home'}Home Delivery{:else if order.deliveryType === 'tableService'}Dine-in{:else}{order.deliveryType}{/if}</p>
									</div>
									<div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
										<p class="text-xs uppercase tracking-wide text-slate-400">Closed</p>
										<p class="mt-1 font-semibold text-slate-800">{new Date(order.updated).toLocaleDateString()}</p>
									</div>
								</div>

								<details class="mb-4 rounded-2xl border border-slate-200 bg-white open:bg-slate-50">
									<summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
										<div class="flex items-center justify-between gap-3">
											<span>Order Items ({order.dishes?.length || 0})</span>
											<span class="text-xs font-medium text-slate-400">Tap to expand</span>
										</div>
									</summary>
									<div class="space-y-2 px-4 pb-4">
										{#each order.dishes || [] as item}
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

								<p class="border-t border-slate-100 pt-4 text-xs text-slate-400">Completed {new Date(order.updated).toLocaleString()}</p>
							</article>
						{/each}
					</Carousel>
				{/if}
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
				<p class="mt-1 text-slate-500">You must be logged in as an admin to view order history.</p>
				<a href="/admin/admin-login" class="btn btn-primary mt-4">Login</a>
			</div>
		{/if}
	</main>
</div>
