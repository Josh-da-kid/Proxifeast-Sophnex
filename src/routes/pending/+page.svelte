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
		console.log(userId);
		if (!userId) return;

		try {
			const records = await pb.collection('orders').getFullList({
				filter: `user="${userId}" && (status="Pending" || status="Preparing" || status="Ready")`,
				expand: 'dish'
			});
			// Set to your store or return it as needed
			// cart.set(records);
			console.log('Pending orders:', records);
			return records;
		} catch (err) {
			console.error('Failed to fetch pending orders:', err);
		}
	}

	let orders: RecordModel[] = [];
	let loading = true;

	onMount(async () => {
		orders = (await fetchPendingOrders()) || [];
		loading = false;
	});

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
</script>

<main>
	{#if $isLoggedIn}
		<h1 class="mb-4 text-center text-2xl font-bold" in:fly={{ x: 200, duration: 800 }}>
			Unsettled Orders
		</h1>

		<section class="p-4">
			<!-- <h2 class="text-2xl font-bold mb-4">Pending Orders</h2> -->

			{#if loading}
				<p class="text-gray-500">Loading...</p>
			{:else if orders.length === 0}
				<p class="text-gray-600">You have no pending orders.</p>
			{:else}
				<ul class="flex flex-col space-y-4 px-2 md:grid md:grid-cols-2 md:space-x-4 lg:grid-cols-3">
					{#each orders as order}
						<li class="space-y-2 rounded-xl border border-gray-300 p-4 shadow-md">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold">Order Ref: {order.reference}</h3>
								{#if order.status == 'Pending'}
									<span
										class="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800"
									>
										{order.status}
									</span>
								{:else if order.status == 'Preparing'}
									<span
										class="rounded-full bg-orange-200 px-2.5 py-1 text-xs font-semibold text-orange-800"
									>
										{order.status}
									</span>
								{:else if order.status == 'Ready'}
									<span
										class="rounded-full bg-green-200 px-2.5 py-1 text-xs font-semibold text-green-800"
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
								<p><strong>Quantity:</strong> {order.quantity}</p>
								<!-- <p><strong>Delivery Type:</strong> {order.deliveryType}</p> -->
								{#if order.deliveryType === 'pickup'}
									<p><strong>Delivery Type:</strong> Pickup</p>
								{:else if order.deliveryType === 'home'}
									<p><strong>Delivery Type:</strong> Home Delivery</p>
								{:else if order.deliveryType === 'restaurantPickup'}
									<p><strong>Delivery Type:</strong> Dine-in</p>
								{/if}
								{#if order.deliveryType === 'restaurantPickup'}
									<p><strong>Pickup Time:</strong> {order.pickupTime}</p>
								{:else if order.deliveryType === 'home'}
									<p><strong>Address:</strong> {order.homeAddress}</p>
								{:else if order.deliveryType === 'restaurant'}
									<p><strong>Table Number:</strong> {order.tableNumber}</p>
								{/if}
								<p><strong>Phone:</strong> {order.phone}</p>
							</div>

							<p class="text-xs text-gray-400">
								Ordered on: {new Date(order.created).toLocaleString()}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{:else}
		<p class="mt-8 text-center text-gray-500 italic">
			You must be logged in inorder to view pending order.
		</p>
		<a href="/login" class="btn btn-primary mx-auto mt-4 flex w-fit items-center justify-center"
			>Signup/login</a
		>
	{/if}
</main>
