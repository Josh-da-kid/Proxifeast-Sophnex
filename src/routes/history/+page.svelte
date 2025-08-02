<script lang="ts">
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import type { RecordModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fly } from 'svelte/transition';

	export const user = derived(page, ($page) => $page.data.user);
	// Fetch cart data
	export async function fetchPendingOrders() {
		const userId = get(user)?.id;
		const restaurantId = get(page).data.restaurant?.id;

		if (!userId || !restaurantId) return;

		// Final filter string combining all conditions
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

	let orders: RecordModel[] = [];
	let loading = true;
	const restaurantName = get(page).data.restaurant?.name;

	onMount(async () => {
		orders = (await fetchPendingOrders()) || [];
		loading = false;
	});

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
</script>

<main>
	{#if $isLoggedIn}
		<h1 class="mb-4 text-center text-2xl font-bold md:mt-8" in:fly={{ x: 200, duration: 800 }}>
			Settled Orders
		</h1>
		<section class="p-4">
			<!-- <h2 class="text-2xl font-bold mb-4">Pending Orders</h2> -->

			{#if loading}
				<div class="text-secondary flex items-center justify-center text-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24"
						><path
							fill="none"
							stroke="currentColor"
							stroke-dasharray="16"
							stroke-dashoffset="16"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 3c4.97 0 9 4.03 9 9"
							><animate
								fill="freeze"
								attributeName="stroke-dashoffset"
								dur="0.2s"
								values="16;0"
							/><animateTransform
								attributeName="transform"
								dur="1.5s"
								repeatCount="indefinite"
								type="rotate"
								values="0 12 12;360 12 12"
							/></path
						></svg
					>
				</div>
			{:else if orders.length === 0}
				<p class="text-center text-gray-600">You have no settled orders.</p>
			{:else}
				<ul class="flex flex-col space-y-4 px-2 md:grid md:grid-cols-2 md:space-x-4 lg:grid-cols-3">
					{#each orders as order}
						<li class="space-y-2 rounded-xl border border-gray-300 p-4 shadow-md">
							<h3 class="text-primary text-sm font-bold">👤 {order.name || 'Unnamed User'}</h3>
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold">Order Ref: {order.reference}</h3>
								{#if order.status == 'Delivered'}
									<span
										class="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800"
									>
										{order.status}
									</span>
								{/if}
								{#if order.status == 'Cancelled'}
									<span
										class="rounded-full bg-red-400 px-2.5 py-1 text-xs font-semibold text-white"
									>
										{order.status}
									</span>
								{/if}
							</div>

							<div class="text-sm text-gray-600">
								<p>
									<strong>Total:</strong> ₦{(
										order.orderTotal ??
										order.totalAmount ??
										0
									).toLocaleString()}
								</p>
								{#if order.deliveryType === 'home'}
									<p><strong>Delivery Fee:</strong> ₦{order.deliveryFee}</p>
								{/if}
								<p><strong>Quantity:</strong> {order.quantity}</p>
								<!-- <p><strong>Delivery Type:</strong> {order.deliveryType}</p> -->
								{#if order.deliveryType === 'tableService'}
									<p><strong>Delivery Type:</strong> Table Service</p>
								{:else if order.deliveryType === 'home'}
									<p><strong>Delivery Type:</strong> Home Delivery</p>
								{:else if order.deliveryType === 'restaurantPickup'}
									<p><strong>Delivery Type:</strong> Pickup</p>
								{/if}
								{#if order.deliveryType === 'restaurantPickup'}
									<p><strong>Pickup Time:</strong> {order.pickupTime}</p>
								{:else if order.deliveryType === 'home'}
									<p><strong>Address:</strong> {order.homeAddress}</p>
								{:else if order.deliveryType === 'tableService'}
									<p><strong>Table Number:</strong> {order.tableNumber}</p>
								{/if}
								<p><strong>Phone:</strong> {order.phone}</p>
								<p><strong>Restaurant:</strong> {restaurantName}</p>
							</div>

							<div class="dropdown dropdown-hover">
								<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label tabindex="0" class="btn btn-sm btn-outline mb-1">View Dishes</label>
								<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
								<ul
									tabindex="0"
									class="dropdown-content menu bg-base-100 rounded-box z-[1] mx-auto flex max-h-64 w-64 overflow-y-auto p-2 shadow"
								>
									{#each order.dishes as item, i}
										<li>
											<div>
												🍽️ <strong class="text-primary">{item.name}</strong>

												<span class="text-gray-500"
													>Qty: {item.quantity} × ₦{item.amount.toLocaleString()}</span
												>
											</div>
										</li>
									{/each}
								</ul>
							</div>

							<p class="text-xs text-gray-400">
								Completed on: {new Date(order.updated).toLocaleString()}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{:else}
		<p class="mt-8 text-center text-gray-500 italic">
			You must be logged in inorder to view order history.
		</p>
		<a href="/login" class="btn btn-primary mx-auto mt-4 flex w-fit items-center justify-center"
			>Signup/login</a
		>
	{/if}
</main>
