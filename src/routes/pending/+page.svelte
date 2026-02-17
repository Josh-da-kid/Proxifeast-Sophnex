<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import type { RecordModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	import {
		subscribeToPushNotifications,
		checkNotificationStatus,
		showLocalNotification
	} from '$lib/notifications';

	export const user = derived(page, ($page) => $page.data.user);

	let orders: RecordModel[] = $state([]);
	let loading = $state(true);
	let searchInput = $state('');
	let selectedCategoryInput = $state('All');
	const restaurantName = get(page).data.restaurant?.name;
	let unsubscribe: (() => void) | null = null;
	let showNotificationPrompt = $state(false);

	const categories = $page.data.categories ?? [];

	const searchSubmitted = derived(page, ($page) => {
		return ($page.url.searchParams.get('search')?.trim() ?? '') !== '';
	});

	export async function fetchPendingOrders() {
		const userId = get(user)?.id;
		const restaurantId = get(page).data.restaurant?.id;
		const searchParams = get(page).url.searchParams;
		const search = searchParams.get('search')?.trim() ?? '';
		const category = searchParams.get('category')?.trim() ?? 'All';

		if (!userId) return;

		// Build filter - only filter by user, not restaurant (to show multi-restaurant orders)
		let filter = `user="${userId}"`;

		if (category !== 'All') {
			filter += ` && status="${category}"`;
		} else {
			filter += ` && (status="Pending" || status="Preparing" || status="Ready")`;
		}

		if (search) {
			filter += ` && (reference~"${search}" || name~"${search}" || phone~"${search}" || deliveryType~"${search}" || restaurantName~"${search}")`;
		}

		try {
			const records = await pb.collection('orders').getFullList({
				filter,
				sort: '-created',
				expand: 'dish'
			});
			return records;
		} catch (err) {
			console.error('Failed to fetch pending orders:', err);
		}
	}

	onMount(async () => {
		searchInput = $page.url.searchParams.get('search') ?? '';
		selectedCategoryInput = $page.url.searchParams.get('category') ?? 'All';
		orders = (await fetchPendingOrders()) || [];
		loading = false;

		// Check if push notifications are enabled
		const hasNotifications = await checkNotificationStatus();
		if (!hasNotifications && Notification.permission === 'default') {
			showNotificationPrompt = true;
		}

		// Subscribe to real-time order updates for this user
		const userId = get(user)?.id;
		if (userId) {
			unsubscribe = await pb.collection('orders').subscribe('*', async (e) => {
				const order = e.record;

				// Only update if this order belongs to the current user
				if (order.user === userId) {
					if (e.action === 'create') {
						// New order created
						orders = [order, ...orders];
					} else if (e.action === 'update') {
						// Order updated - check if status changed
						const oldOrder = orders.find((o) => o.id === order.id);
						if (oldOrder && oldOrder.status !== order.status) {
							// Status changed - show notification
							const statusMessages: Record<string, string> = {
								Ready: 'Your order is ready!',
								Cancelled: 'Your order has been cancelled',
								Delivered: 'Your order has been delivered',
								Preparing: 'Your order is being prepared'
							};

							showLocalNotification(`Order ${order.status}`, {
								body:
									statusMessages[order.status] ||
									`Order #${order.reference} status updated to ${order.status}`,
								data: { url: '/pending' }
							});
						}
						// Refresh orders list
						orders = (await fetchPendingOrders()) || [];
					} else if (e.action === 'delete') {
						// Order deleted
						orders = orders.filter((o) => o.id !== order.id);
					}
				}
			});
		}
	});

	// Cleanup subscription on unmount
	$effect(() => {
		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});

	async function enableNotifications() {
		const userId = get(user)?.id;
		if (userId) {
			const success = await subscribeToPushNotifications(userId);
			if (success) {
				showNotificationPrompt = false;
			}
		}
	}

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	async function clearSearch() {
		window.location.href = '/pending';
	}

	async function handleSearchSubmit(e: Event) {
		e.preventDefault();

		if (!searchInput.trim() && selectedCategoryInput === 'All') {
			return;
		}

		const query = new URLSearchParams();
		if (searchInput.trim()) query.set('search', searchInput.trim());
		if (selectedCategoryInput && selectedCategoryInput !== 'All')
			query.set('category', selectedCategoryInput);

		const target = `/pending/?${query.toString()}`;
		await goto(target);
		window.location.reload();
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'Pending':
				return 'bg-amber-100 text-amber-800 border-amber-200';
			case 'Preparing':
				return 'bg-orange-100 text-orange-800 border-orange-200';
			case 'Ready':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'Delivered':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'Cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}
</script>

<svelte:head>
	<title>Pending Orders - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-stone-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 py-12 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1 class="font-playfair mb-2 text-3xl font-bold md:text-4xl">Pending Orders</h1>
			<p class="text-white/80">Track your active orders in real-time</p>
		</div>
	</section>

	<!-- Push Notification Prompt -->
	{#if showNotificationPrompt}
		<section class="container mx-auto -mt-6 px-4" transition:fly={{ y: -20, duration: 300 }}>
			<div class="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white shadow-lg">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							/>
						</svg>
						<div>
							<p class="font-semibold">Stay Updated!</p>
							<p class="text-sm text-white/90">
								Enable notifications to get real-time updates on your orders
							</p>
						</div>
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => (showNotificationPrompt = false)}
							class="rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
						>
							Later
						</button>
						<button
							onclick={enableNotifications}
							class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-amber-600 hover:bg-white/90"
						>
							Enable
						</button>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- Search & Filter -->
	<section class="container mx-auto -mt-6 px-4">
		<form
			onsubmit={handleSearchSubmit}
			class="flex flex-col gap-4 md:flex-row md:items-center md:justify-center"
		>
			<div
				class="flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-lg shadow-amber-900/10"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-gray-400"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<input
					type="text"
					bind:value={searchInput}
					placeholder="Search by reference, name, phone..."
					class="bg-transparent py-2 text-gray-700 placeholder-gray-400 focus:outline-none"
				/>
				{#if searchInput}
					<button
						type="button"
						onclick={clearSearch}
						class="text-sm text-gray-500 hover:text-gray-700"
					>
						Clear
					</button>
				{/if}
			</div>

			<select
				bind:value={selectedCategoryInput}
				class="rounded-xl border-0 bg-white px-4 py-3 shadow-lg shadow-amber-900/10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
				onchange={(e) => {
					const selected = e.currentTarget.value;
					if (selected === 'All') {
						clearSearch();
					} else {
						e.currentTarget.form?.requestSubmit();
					}
				}}
			>
				<option value="All">All Statuses</option>
				<option value="Pending">Pending</option>
				<option value="Preparing">Preparing</option>
				<option value="Ready">Ready</option>
				<option value="Completed">Delivered</option>
				<option value="Cancelled">Cancelled</option>
			</select>
		</form>
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
						<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
						<rect x="9" y="3" width="6" height="4" rx="1" />
						<path d="M9 12h6" />
						<path d="M9 16h6" />
					</svg>
					<h3 class="mt-4 text-lg font-medium text-gray-700">No Pending Orders</h3>
					<p class="mt-1 text-gray-500">You don't have any active orders at the moment.</p>
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
								<div class="flex flex-col items-end gap-1">
									<span
										class="rounded-full border px-3 py-1 text-xs font-medium {getStatusColor(
											order.status
										)}"
									>
										{order.status}
									</span>
									{#if order.restaurantName}
										<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
											{order.restaurantName}
										</span>
									{/if}
								</div>
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
								<div class="mb-3 space-y-1 text-sm">
									<p class="text-gray-600">
										<strong>Address:</strong>
										{order.homeAddress}
									</p>
									{#if order.deliveryFee > 0}
										<p class="text-gray-600">
											<strong>Delivery:</strong>
											₦{order.deliveryFee.toLocaleString()}
											{#if order.deliveryDistance > 0}
												<span class="text-gray-400">({order.deliveryDistance}km)</span>
											{/if}
										</p>
									{/if}
								</div>
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
								Ordered: {new Date(order.created).toLocaleDateString()} at {new Date(
									order.created
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
				<p class="mt-1 text-gray-500">Please login to view your pending orders.</p>
				<a href="/login" class="btn btn-primary mt-4">Sign In</a>
			</div>
		{/if}
	</main>
</div>
