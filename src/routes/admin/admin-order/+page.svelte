<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import type { RecordModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fly, fade } from 'svelte/transition';

	export const user = derived(page, ($page) => $page.data.user);

	let searchInput = $state('');
	let selectedCategoryInput = $state('All');
	let selectedRestaurantInput = $state('All');
	let orders: any = $state([]);
	let filteredOrders: any = $state([]);
	let loading = $state(true);
	const restaurantName = get(page).data.restaurant?.name;
	const allRestaurants = get(page).data.allRestaurants ?? [];
	const currentRestaurantId = get(page).data.restaurantId;
	const isSuper = get(page).data.isSuper ?? false;

	const categories = $page.data.categories ?? [];

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
		filterParts.push(`(status="Pending" || status="Preparing" || status="Ready")`);

		// Filter by restaurant for non-super restaurants
		if (!isSuper && currentRestaurantId) {
			filterParts.push(`restaurantId="${currentRestaurantId}"`);
		}

		const filter = filterParts.join(' && ');

		try {
			const records = await pb.collection('orders').getFullList({
				filter,
				sort: '-created',
				expand: 'dish,restaurant'
			});
			orders = records;
			filteredOrders = records;
			loading = false;
			return records;
		} catch (err) {
			console.error('Failed to fetch pending orders:', err);
			loading = false;
		}
	}

	let unsubscribe: (() => void) | null = null;

	onMount(async () => {
		orders = (await fetchPendingOrders()) || [];
		filteredOrders = orders;
		loading = false;

		unsubscribe = await pb.collection('orders').subscribe('*', async (e) => {
			const order = e.record;

			if (e.action === 'create') {
				const currentFilter = selectedCategoryInput;
				if (currentFilter === 'All' || order.status === currentFilter) {
					orders = [order, ...orders];
					if (Notification.permission === 'granted') {
						new Notification(`New Order from ${order.restaurantName || 'Unknown'}!`, {
							body: `Order ${order.reference} - ₦${(order.totalAmount || 0).toLocaleString()}`,
							icon: '/icons/icon-192x192.png'
						});
					}
				}
			} else if (e.action === 'update') {
				orders = (await fetchPendingOrders()) || [];
			} else if (e.action === 'delete') {
				orders = orders.filter((o) => o.id !== order.id);
			}
		});
	});

	$effect(() => {
		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});

	let successMessage = $state('');

	async function updateOrderStatus(orderId: any, newStatus: any, orderRef: any) {
		try {
			const updatedOrder = await pb.collection('orders').update(orderId, { status: newStatus });

			// Send email for Ready, Cancelled, Delivered
			if (['Ready', 'Cancelled', 'Delivered'].includes(newStatus)) {
				const emailRes = await fetch('/api/send-ready-email', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						email: updatedOrder.email,
						name: updatedOrder.name,
						reference: updatedOrder.reference,
						status: newStatus,
						deliveryType: updatedOrder.deliveryType,
						address: updatedOrder.homeAddress,
						tableNumber: updatedOrder.tableNumber
					})
				});

				if (emailRes.ok) {
					successMessage = await emailRes.text();
					setTimeout(() => {
						successMessage = '';
					}, 5000);
				}
			}

			// Send push notification for ALL status changes
			const statusMessages: Record<string, string> = {
				Pending: 'Your order has been received and is awaiting preparation.',
				Preparing: 'Your order is now being prepared!',
				Ready: 'Your order is ready for pickup/delivery!',
				Delivered: 'Your order has been delivered. Thank you!',
				Cancelled: 'Your order has been cancelled.'
			};

			// Determine redirect URL based on status
			const redirectUrl = ['Delivered', 'Cancelled'].includes(newStatus)
				? `/history?orderId=${updatedOrder.id}&status=${newStatus}`
				: `/pending?orderId=${updatedOrder.id}&status=${newStatus}`;

			await fetch('/api/send-push-notification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: updatedOrder.user,
					title: `Order ${newStatus}`,
					body:
						statusMessages[newStatus] ||
						`Your order #${updatedOrder.reference} is now ${newStatus}`,
					data: {
						url: redirectUrl,
						orderId: updatedOrder.id,
						reference: updatedOrder.reference,
						status: newStatus
					},
					tag: `order-${updatedOrder.id}`
				})
			});

			orders = await fetchPendingOrders();
		} catch (err) {
			console.error('Failed to update status:', err);
		}
	}

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
			case 'Pending':
				return 'bg-amber-100 text-amber-800 border-amber-200';
			case 'Preparing':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'Ready':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200';
			case 'Delivered':
				return 'bg-slate-100 text-slate-800 border-slate-200';
			case 'Cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-slate-100 text-slate-800 border-slate-200';
		}
	}
</script>

<svelte:head>
	<title>Pending Orders - Proxifeast</title>
</svelte:head>

{#if successMessage}
	<div
		class="alert alert-success fixed top-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 shadow-lg"
		in:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>{successMessage}</span>
	</div>
{/if}

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
				Pending Orders
			</h1>
			<p class="text-sm text-slate-300" in:fade={{ duration: 400, delay: 100 }}>
				Note: Emails are sent to customers when order status is updated to "Ready", "Delivered", or
				"Cancelled"
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
					<option value="Pending">Pending</option>
					<option value="Preparing">Preparing</option>
					<option value="Ready">Ready</option>
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
						<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
						<rect x="9" y="3" width="6" height="4" rx="1" />
					</svg>
					<h3 class="mt-4 text-lg font-medium text-slate-700">No Pending Orders</h3>
					<p class="mt-1 text-slate-500">You have no orders at the moment.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredOrders as order}
						<article
							class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-xl"
							in:fly={{ y: 20, duration: 300 }}
						>
							<!-- Status Bar -->
							<div
								class="h-1.5 w-full {getStatusColor(order.status)
									.replace('bg-', 'bg-')
									.replace('text-', 'text-')
									.replace('border-', 'bg-')}"
							></div>

							<div class="p-5">
								<!-- Header -->
								<div class="mb-4 flex items-start justify-between">
									<div>
										<p class="text-xs font-medium tracking-wider text-slate-400 uppercase">Order</p>
										<h3 class="font-mono text-sm font-semibold text-slate-800">
											{order.reference}
										</h3>
									</div>
									<span
										class="rounded-full border px-3 py-1 text-xs font-semibold {getStatusColor(
											order.status
										)}"
									>
										{order.status}
									</span>
								</div>

								<!-- Customer Info -->
								<div class="mb-4 rounded-xl bg-slate-50 p-3">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<div
												class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4 text-slate-500"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle
														cx="12"
														cy="7"
														r="4"
													/></svg
												>
											</div>
											<div>
												<p class="text-sm font-semibold text-slate-800">{order.name || 'Guest'}</p>
												{#if order.phone}
													<a href="tel:{order.phone}" class="text-primary text-xs hover:underline">
														{order.phone}
													</a>
												{/if}
											</div>
										</div>
										{#if order.phone}
											<a
												href="tel:{order.phone}"
												class="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-4 w-4"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													><path
														d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
													/></svg
												>
											</a>
										{/if}
									</div>
								</div>

								<!-- Order Details -->
								<div class="mb-4 space-y-2 border-b border-slate-100 pb-3">
									<div class="flex items-center justify-between">
										<span class="text-sm text-slate-500">Total</span>
										<span class="font-playfair text-lg font-bold text-slate-800"
											>₦{(order.orderTotal ?? order.totalAmount ?? 0).toLocaleString()}</span
										>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-500">Items</span>
										<span class="font-medium text-slate-700">{order.quantity}</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-slate-500">Type</span>
										<span class="font-medium text-slate-700">
											{#if order.deliveryType === 'restaurantPickup'}
												<span class="flex items-center gap-1">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path
															d="M3 6h18"
														/><path d="M16 10a4 4 0 0 1-8 0" /></svg
													>
													Pickup
												</span>
											{:else if order.deliveryType === 'home'}
												<span class="flex items-center gap-1">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path
															d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
														/></svg
													>
													Delivery
												</span>
											{:else if order.deliveryType === 'tableService'}
												<span class="flex items-center gap-1">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-4 w-4"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path
															d="M7 2v20"
														/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg
													>
													Table
												</span>
											{/if}
										</span>
									</div>
								</div>

								<!-- Address Info -->
								{#if order.deliveryType === 'home' && order.homeAddress}
									<div class="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 flex-shrink-0 text-amber-600"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle
												cx="12"
												cy="10"
												r="3"
											/></svg
										>
										<span class="truncate text-slate-600">{order.homeAddress}</span>
									</div>
								{:else if order.deliveryType === 'tableService' && order.tableNumber}
									<div class="mb-4 flex items-center gap-2 rounded-lg bg-slate-100 p-2 text-sm">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 text-slate-500"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path
												d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"
											/></svg
										>
										<span class="font-medium text-slate-700">Table {order.tableNumber}</span>
									</div>
								{/if}

								<!-- Restaurant -->
								<p class="mb-4 text-xs text-slate-400">{order.restaurantName || restaurantName}</p>

								<!-- Dishes -->
								<details class="mb-4">
									<summary
										class="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
									>
										<span class="flex items-center justify-center gap-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-4 w-4"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path
													d="M7 2v20"
												/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg
											>
											View {order.dishes?.length || 0} Dishes
										</span>
									</summary>
									<div class="mt-2 space-y-1">
										{#each order.dishes || [] as item}
											<div
												class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
											>
												<span class="text-slate-700">{item.name}</span>
												<span class="font-semibold text-slate-500">×{item.quantity}</span>
											</div>
										{/each}
									</div>
								</details>

								<!-- Status Update -->
								<select
									bind:value={order.status}
									class="focus:border-primary w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors focus:outline-none"
									onchange={() => updateOrderStatus(order.id, order.status, order.reference)}
								>
									{#each ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'] as statusOption}
										<option value={statusOption}>{statusOption}</option>
									{/each}
								</select>

								<p class="mt-3 text-center text-xs text-slate-400">
									{new Date(order.created).toLocaleString()}
								</p>
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
				<p class="mt-1 text-slate-500">You must be logged in as an admin to view orders.</p>
				<a href="/admin/admin-login" class="btn btn-primary mt-4">Login</a>
			</div>
		{/if}
	</main>
</div>
