<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fly } from 'svelte/transition';

	export const user = derived(page, ($page) => $page.data.user);

	let searchInput = $state('');
	let selectedCategoryInput = $state('All');
	let selectedRestaurantInput = $state('All');
	let orders: any = $state([]);
	let filteredOrders: any = $state([]);
	let loading = $state(true);
	const restaurantName = get(page).data.restaurant?.name;
	const allRestaurants = get(page).data.allRestaurants ?? [];

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
	<title>Order History - Proxifeast Admin</title>
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
		<form onsubmit={handleSearchSubmit} class="flex flex-col gap-4 md:flex-row md:items-center">
			<div
				class="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-md shadow-slate-900/5"
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
					class="bg-transparent py-2 text-slate-700 placeholder-slate-400 focus:outline-none"
				/>
				{#if searchInput}
					<button
						type="button"
						onclick={clearSearch}
						class="text-sm text-slate-500 hover:text-slate-700">Clear</button
					>
				{/if}
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
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
					<h3 class="mt-4 text-lg font-medium text-slate-700">No Order History</h3>
					<p class="mt-1 text-slate-500">You have no completed orders yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredOrders as order}
						<article
							class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
							in:fly={{ y: 20, duration: 300 }}
						>
							<!-- Header -->
							<div class="mb-4 flex items-start justify-between">
								<div>
									<p class="text-xs text-slate-500">Order Ref</p>
									<h3 class="font-semibold text-slate-900">{order.reference}</h3>
									<p class="text-sm text-slate-600">{order.name || 'Guest'}</p>
								</div>
								<span
									class="rounded-full border px-3 py-1 text-xs font-medium {getStatusColor(
										order.status
									)}"
								>
									{order.status}
								</span>
							</div>

							<!-- Details -->
							<div class="mb-4 space-y-1 text-sm">
								<div class="flex justify-between">
									<span class="text-slate-500">Total</span>
									<span class="font-semibold text-slate-700"
										>₦{(order.orderTotal ?? order.totalAmount ?? 0).toLocaleString()}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-500">Items</span>
									<span class="text-slate-700">{order.quantity}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-500">Type</span>
									<span class="text-slate-700">
										{#if order.deliveryType === 'restaurantPickup'}Pickup
										{:else if order.deliveryType === 'home'}Home Delivery
										{:else if order.deliveryType === 'tableService'}Dine-in
										{/if}
									</span>
								</div>
								<p class="text-xs text-slate-500">{order.restaurantName || restaurantName}</p>
							</div>

							<!-- Dishes -->
							<details class="mb-4">
								<summary
									class="cursor-pointer rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
								>
									View Dishes ({order.dishes?.length || 0})
								</summary>
								<div class="mt-2 space-y-1">
									{#each order.dishes || [] as item}
										<div class="flex justify-between rounded bg-slate-50 px-3 py-1.5 text-xs">
											<span class="text-slate-700">{item.name}</span>
											<span class="text-slate-500">×{item.quantity}</span>
										</div>
									{/each}
								</div>
							</details>

							<p class="text-xs text-slate-400">
								Completed: {new Date(order.updated).toLocaleString()}
							</p>
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
				<p class="mt-1 text-slate-500">You must be logged in as an admin to view order history.</p>
				<a href="/admin/admin-login" class="btn btn-primary mt-4">Login</a>
			</div>
		{/if}
	</main>
</div>
