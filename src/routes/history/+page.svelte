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

		if (!userId || !restaurantId) return;

		const filter = `restaurantId="${restaurantId}" && user="${userId}" && (status="Delivered" || status="Cancelled")`;

		try {
			const records = await pb.collection('orders').getFullList({
				filter,
				sort: '-updated',
				expand: 'dish'
			});
			return records;
		} catch (err) {
			console.error('Failed to fetch settled orders:', err);
		}
	}

	let orders: RecordModel[] = $state([]);
	let loading = $state(true);
	const restaurantName = get(page).data.restaurant?.name;

	onMount(async () => {
		orders = (await fetchPendingOrders()) || [];
		loading = false;
	});

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	function getStatusColor(status: string) {
		switch (status) {
			case 'Delivered':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'Cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}
</script>

<svelte:head>
	<title>Order History - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-stone-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 py-12 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1 class="font-playfair mb-2 text-3xl font-bold md:text-4xl">Order History</h1>
			<p class="text-white/80">View your past orders and details</p>
		</div>
	</section>

	<!-- Orders -->
	<main class="container mx-auto px-4 py-8">
		{#if $isLoggedIn}
			{#if loading}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each Array(3) as _}
						<div class="animate-pulse rounded-2xl bg-white p-6 shadow-md">
							<div class="mb-4 h-6 w-3/4 rounded bg-gray-200"></div>
							<div class="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
							<div class="h-20 w-full rounded bg-gray-200"></div>
						</div>
					{/each}
				</div>
			{:else if orders.length === 0}
				<div class="py-16 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto h-16 w-16 text-gray-300"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path d="M12 8v4l3 3" />
						<circle cx="12" cy="12" r="10" />
					</svg>
					<h3 class="mt-4 text-lg font-medium text-gray-700">No Order History</h3>
					<p class="mt-1 text-gray-500">You haven't completed any orders yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each orders as order, i}
						<article
							class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg"
							in:fly={{ y: 20, duration: 300, delay: i * 50 }}
						>
							<!-- Header -->
							<div class="mb-4 flex items-start justify-between">
								<div>
									<p class="text-sm text-gray-500">Order Reference</p>
									<h3 class="font-playfair text-lg font-semibold text-gray-900">
										{order.reference}
									</h3>
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
							<div class="mb-4 space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-gray-500">Customer</span>
									<span class="font-medium text-gray-900">{order.name || 'Guest'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Total</span>
									<span class="font-semibold text-amber-700"
										>₦{(order.orderTotal ?? order.totalAmount ?? 0).toLocaleString()}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Items</span>
									<span class="font-medium text-gray-900">{order.quantity}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Type</span>
									<span class="text-gray-900">
										{#if order.deliveryType === 'tableService'}Table Service
										{:else if order.deliveryType === 'home'}Home Delivery
										{:else if order.deliveryType === 'restaurantPickup'}Pickup
										{:else}{order.deliveryType}{/if}
									</span>
								</div>
							</div>

							<!-- Additional Info -->
							{#if order.deliveryType === 'restaurantPickup' && order.pickupTime}
								<p class="mb-3 text-sm text-gray-600">
									<strong>Pickup:</strong>
									{order.pickupTime}
								</p>
							{:else if order.deliveryType === 'home' && order.homeAddress}
								<p class="mb-3 text-sm text-gray-600">
									<strong>Address:</strong>
									{order.homeAddress}
								</p>
							{:else if order.deliveryType === 'tableService' && order.tableNumber}
								<p class="mb-3 text-sm text-gray-600">
									<strong>Table:</strong>
									{order.tableNumber}
								</p>
							{/if}

							<!-- Dishes -->
							<div class="mb-4 border-t border-gray-100 pt-4">
								<button
									class="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
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
										<div class="flex justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
											<span class="text-gray-800">{item.name}</span>
											<span class="text-gray-500">×{item.quantity}</span>
										</div>
									{/each}
								</div>
							</div>

							<!-- Footer -->
							<div class="border-t border-gray-100 pt-3 text-xs text-gray-400">
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
					class="mx-auto h-16 w-16 text-gray-300"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
					<polyline points="10 17 15 12 10 7" />
					<line x1="15" x2="3" y1="12" y2="12" />
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-700">Login Required</h3>
				<p class="mt-1 text-gray-500">Please login to view your order history.</p>
				<a href="/login" class="btn btn-primary mt-4">Sign In</a>
			</div>
		{/if}
	</main>
</div>
