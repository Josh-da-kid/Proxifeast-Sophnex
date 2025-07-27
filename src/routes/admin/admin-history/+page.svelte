<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import type { RecordModel } from 'pocketbase';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fly } from 'svelte/transition';

	export const user = derived(page, ($page) => $page.data.user);

	// let orders: RecordModel[] = [];
	// let orders: any = [];
	// let loading = true;

	let searchInput = $state('');
	let selectedCategoryInput = $state('All');
	// let orders: RecordModel[] = [];
	let orders: any = $state([]);
	let loading = $state(true);

	const categories = $page.data.categories ?? [];

	const searchSubmitted = derived(page, ($page) => {
		return ($page.url.searchParams.get('search')?.trim() ?? '') !== '';
	});

	// Fetch cart data
	// export async function fetchPendingOrders() {
	// 	try {
	// 		const records = await pb.collection('orders').getFullList({
	// 			filter: `status="Delivered" || status="Cancelled"`,
	// 			expand: 'user' // 👈 expand the user relation
	// 		});
	// 		console.log('Pending orders:', records);
	// 		// console.log('User name:', records.expand?.name);
	// 		records.forEach((record) => {
	// 			console.log('Record:', record);
	// 			console.log('Expanded user:', record.expand?.user);
	// 			console.log('User name:', record.expand?.user?.name);
	// 		});

	// 		return records;
	// 	} catch (err) {
	// 		console.error('Failed to fetch pending orders:', err);
	// 	}
	// }

	// Fetch cart data
	export async function fetchPendingOrders() {
		const userId = get(user)?.id;
		console.log(userId);
		// const search = urlParams.get('search')?.trim() ?? '';
		// const category = urlParams.get('category')?.trim() ?? 'All';
		const searchParams = get(page).url.searchParams;
		const search = searchParams.get('search')?.trim() ?? '';
		const category = searchParams.get('category')?.trim() ?? 'All';

		if (!userId) return;

		// Build dynamic filter
		// let filter = `(user="${userId}")`;
		// Build base filter
		let filterParts: string[] = [];

		if (category !== 'All') {
			// filter = ` && status="${category}"`;
			filterParts.push(`status="${category}"`);
		} else {
			// filter = ` && (status="Delivered" || status="Cancelled"`;
			filterParts.push(`(status="Delivered" || status="Cancelled")`);
		}

		if (search) {
			// filter = ` && (reference~"${search}" || name~"${search}" || phone~"${search}")`;
			filterParts.push(`(reference~"${search}" || name~"${search}" || phone~"${search}")`);
		}

		const filter = filterParts.join(' && ');
		try {
			const records = await pb.collection('orders').getFullList({
				// filter: `user="${userId}" && (status="Pending" || status="Preparing" || status="Ready")`,
				filter,
				sort: '-updated',
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

	onMount(async () => {
		searchInput = $page.url.searchParams.get('search') ?? '';
		selectedCategoryInput = $page.url.searchParams.get('category') ?? 'All';
		orders = (await fetchPendingOrders()) || [];
		loading = false;
	});

	async function updateOrderStatus(orderId: any, newStatus: any) {
		try {
			await pb.collection('orders').update(orderId, { status: newStatus });
			// ✅ Refetch orders immediately
			orders = await fetchPendingOrders();
			console.log(`Order ${orderId} updated to ${newStatus}`);
			alert(`Order ${orderId} updated to ${newStatus}`);
		} catch (err) {
			console.error('Failed to update status:', err);
		}
	}

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	async function clearSearch() {
		// searchInput = '';
		window.location.href = '/admin/admin-history';
	}

	async function handleSearchSubmit(e: Event) {
		e.preventDefault();

		if (!searchInput.trim() && selectedCategoryInput === 'All') {
			// Do nothing if no filters
			return;
		}

		const query = new URLSearchParams();
		if (searchInput.trim()) query.set('search', searchInput.trim());
		if (selectedCategoryInput && selectedCategoryInput !== 'All')
			query.set('category', selectedCategoryInput);

		const target = `/admin/admin-history/?${query.toString()}`;

		await goto(target); // navigate
		window.location.reload(); // force full page reload
	}
</script>

<main>
	{#if $isLoggedIn}
		<h1 class="mb-4 text-center text-2xl font-bold" in:fly={{ x: 200, duration: 800 }}>
			Order History
		</h1>

		<form method="GET" onsubmit={handleSearchSubmit} class="gap-2 sm:flex">
			<div class="mx-auto flex items-center justify-center gap-2 p-2">
				<input
					type="text"
					name="search"
					placeholder="Search order..."
					bind:value={searchInput}
					class="input input-bordered border-secondary focus:ring-secondary w-full max-w-xs border focus:ring-2 focus:outline-none md:w-[400px]"
				/>

				{#if searchInput.trim() && $searchSubmitted}
					<!-- svelte-ignore a11y_consider_explicit_label -->

					<button type="button" onclick={clearSearch} class="btn btn-secondary">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
							<path
								fill="none"
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243"
							/>
						</svg>
					</button>
				{/if}
				{#if searchInput.length > 0 && !$searchSubmitted}
					<button type="submit" class="btn btn-secondary">Search</button>
				{/if}

				<div class="ml-4 px-2 sm:ml-0 sm:p-3">
					<select
						name="category"
						bind:value={selectedCategoryInput}
						class="select select-bordered border-secondary focus:ring-secondary w-fit"
						onchange={(e) => {
							const selected = e.currentTarget.value;
							if (selected === 'All') {
								clearSearch();
							} else {
								// auto submit when other categories change
								e.currentTarget.form?.requestSubmit();
							}
						}}
					>
						<option value="All">All Statuses</option>
						<!-- <option value="Pending">Pending</option>
						<option value="Preparing">Preparing</option>
						<option value="Ready">Ready</option> -->
						<option value="Delivered">Delivered</option>
						<option value="Cancelled">Cancelled</option>
					</select>
				</div>
			</div>
		</form>

		<section class="p-4">
			<!-- <h2 class="text-2xl font-bold mb-4">Pending Orders</h2> -->

			{#if loading}
				<!-- <p class="text-gray-500">Loading...</p> -->
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
							<div>
								<p class="text-sm font-medium text-blue-800">
									👤 {order.name || 'Unnamed User'}
								</p>
							</div>
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold">Order Ref: {order.reference}</h3>
								{#if order.status == 'Delivered'}
									<span
										class="rounded-full bg-green-200 px-2.5 py-1 text-xs font-semibold text-green-800"
									>
										{order.status}
									</span>
								{:else if order.status == 'Cancelled'}
									<span
										class="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-800"
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
								{#if order.deliveryType === 'home'}
									<p><strong>Delivery Fee:</strong> ₦2,000</p>
								{/if}
								<p><strong>Quantity:</strong> {order.quantity}</p>
								<!-- <p><strong>Delivery Type:</strong> {order.deliveryType}</p> -->
								{#if order.deliveryType === 'restaurantPickup'}
									<p><strong>Delivery Type:</strong> Pickup</p>
								{:else if order.deliveryType === 'home'}
									<p><strong>Delivery Type:</strong> Home Delivery</p>
								{:else if order.deliveryType === 'restaurant'}
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

							<!-- <select
							class="border-secondary focus:ring-secondary relative items-end justify-end rounded border px-2 py-1 focus:ring-2 focus:outline-none"
							bind:value={order.status}
							on:change={() => updateOrderStatus(order.id, order.status)}
						>
							{#each ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'] as statusOption}
								<option value={statusOption}>
									{statusOption}
								</option>
							{/each}
						</select> -->
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{:else}
		<p class="mt-8 text-center text-gray-500 italic">
			You must be logged in as an admin inorder to view order history.
		</p>
		<a
			href="/admin/admin-login"
			class="btn btn-primary mx-auto mt-4 flex w-fit items-center justify-center">Login</a
		>
	{/if}
</main>
