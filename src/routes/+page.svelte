<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Nav from '$lib/Nav.svelte';
	// import { cart, fetchCart, total } from '$lib/stores/cart';
	import { derived, get, writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { afterNavigate, goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import pb from '$lib/pb';
	import { addToCartPB } from '$lib/addToCart';

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
	// src/routes/admin/+page.svelte
	const dishes = $page.form?.dishes ?? $page.data.dishes;

	const categories = $page.data.categories ?? [];

	const searchTerm = derived(page, ($page) => $page.url.searchParams.get('search') ?? '');
	const selectedCategory = derived(
		page,
		($page) => $page.url.searchParams.get('category') ?? 'All'
	);

	const searchSubmitted = derived(page, ($page) => {
		return ($page.url.searchParams.get('search')?.trim() ?? '') !== '';
	});

	let successAlert = false;
	let errorAlert = false;
	if ($page.form?.success) {
		successAlert = true;
	} else if ($page.form?.error) {
		errorAlert = true;
	}

	const groupedDishes: Record<string, typeof dishes> = {};

	for (const dish of dishes) {
		dish.quantity = 1;
		if (dish.category) {
			if (!groupedDishes[dish.category]) {
				groupedDishes[dish.category] = [];
			}
			groupedDishes[dish.category].push(dish);
		}
	}

	console.log('Grouped dishes:', groupedDishes);

	let addToCartAlert = $state(false);

	let cartErrorAlert = $state(false);
	let dishQuantities = $state<Record<string, number>>({});

	async function handleAddToCart(dish: any) {
		if (dish.availability !== 'Available') return;
		const quantity = Number(dishQuantities[dish.id] || 1);

		// 2. Add to PocketBase cart collection
		try {
			if ($isLoggedIn) {
				await addToCartPB(pb, dish.id, quantity, $user.id, dish.defaultAmount, dish.promoAmount);
				console.log('done');
				addToCartAlert = true;
				setTimeout(() => {
					addToCartAlert = false;
				}, 2000);
				window.location.reload();
			} else {
				cartErrorAlert = true;
				setTimeout(() => {
					cartErrorAlert = false;
				}, 2000);
			}
		} catch (err) {
			console.log('Error adding to cart. Please try again.', err);
			cartErrorAlert = true;
			setTimeout(() => {
				cartErrorAlert = false;
			}, 2000);
		}

		console.log('add to cart function called');
	}

	function closeSideBar() {
		const drawer = document.getElementById('my-drawer-4') as HTMLInputElement;
		if (drawer) drawer.checked = false;
	}

	function back() {
		const drawer = document.getElementById('my-drawer-5') as HTMLInputElement;
		if (drawer) drawer.checked = false;
	}

	let searchInput = $state('');
	let selectedCategoryInput = $state('All');

	onMount(() => {
		fetchCart();
		const url = get(page).url;
		if (window.location.hash === '#menu') {
			const el = document.getElementById('menu');
			if (el) {
				el.scrollIntoView({ behavior: 'smooth' }); // Or 'smooth' if you want animation
			}
		}

		for (const dish of dishes) {
			dishQuantities[dish.id] = 1;
		}

		searchInput = $page.url.searchParams.get('search') ?? '';
		selectedCategoryInput = $page.url.searchParams.get('category') ?? 'All';

		if (successAlert) {
			setTimeout(() => {
				successAlert = false;
			}, 2000);
		}
		if (errorAlert) {
			setTimeout(() => {
				errorAlert = false;
			}, 2000);
		}
	});

	// function updateQuantity(dishId: string, value: string) {
	// 	const qty = parseInt(value);
	// 	dishQuantities[dishId] = isNaN(qty) || qty < 1 ? 1 : qty;
	// 	dishQuantities = { ...dishQuantities }; // ✅ trigger reactivity
	// }

	let alert = $state(false);

	export const user = derived(page, ($page) => $page.data.user);

	async function clearSearch() {
		// searchInput = '';
		window.location.href = '/#menu';
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

		const target = `/?${query.toString()}#menu`;

		await goto(target); // navigate
		window.location.reload(); // force full page reload
	}

	export const cart = writable<any[]>([]);

	export const total = derived(cart, ($cart) =>
		$cart.reduce((acc, item) => acc + (item.amount || 0), 0)
	);

	// export async function fetchCart() {
	// 	try {
	// 		const records = await pb.collection('cart').getFullList();
	// 		cart.set(records);
	// 	} catch (err) {
	// 		console.error('Failed to fetch cart:', err);
	// 	}
	// }

	export async function fetchCart() {
		try {
			console.log('Current user ID:', $user.id);
			if (!$user.id) return cart.set([]);

			const records = await pb.collection('cart').getFullList({
				filter: `user="${$user.id}"`,
				expand: 'dish' // if dish is a relation
			});

			cart.set(records);
		} catch (err) {
			console.error('Failed to fetch cart:', err);
		}
	}

	export async function clearCart() {
		const userId = $user.id;
		if (!userId) return;
		try {
			const items = await pb.collection('cart').getFullList();
			await Promise.all(items.map((item) => pb.collection('cart').delete(item.id)));
			await fetchCart();
		} catch (err) {
			console.error('Failed to clear cart:', err);
		}
		// deleteModal.close();
	}

	export async function removeFromCart(id: string) {
		try {
			await pb.collection('cart').delete(id);
			await fetchCart();
		} catch (err) {
			console.error('Failed to remove item:', err);
		}
	}

	let deleteModal: HTMLDialogElement;
	let clearModal: HTMLDialogElement;
	let dishToDelete: any = $state(null);

	async function handleDeleteDish() {
		if (!dishToDelete) return;

		try {
			await pb.collection('cart').delete(dishToDelete.id);
			console.log('Dish deleted');

			// deleteModal.close();
			// deleteSuccessful = true;
			// if (deleteSuccessful) {
			// 	setTimeout(() => {
			// 		deleteSuccessful = false;
			// 	}, 2000);
			// }
			// window.location.reload();
		} catch (error) {
			console.error('Failed to delete dish:', error);
			// deleteUnsuccessful = true;
			// if (deleteUnsuccessful) {
			// 	setTimeout(() => {
			// 		deleteUnsuccessful = false;
			// 	}, 2000);
			// }
		}
	}
</script>

<!-- Cart FAB Icon -->
<label for="my-drawer-5">
	<div
		class="tooltip indicator bg-secondary fixed top-48 right-4 z-10 cursor-pointer rounded-full p-4 text-white shadow-xl transition-transform duration-300 hover:scale-105"
		data-tip="view cart"
	>
		<span class="indicator-item indicator-start badge badge-sm bg-white font-bold text-black">
			<!-- {$cart.reduce((sum, item) => sum + item.quantity, 0)} -->
			{$cart.length}
		</span>
		<svg
			class="drawer-button"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				d="M7.308 21.116q-.633 0-1.067-.434t-.433-1.066t.433-1.067q.434-.433 1.067-.433t1.066.433t.434 1.067t-.434 1.066t-1.066.434m9.384 0q-.632 0-1.066-.434t-.434-1.066t.434-1.067q.434-.433 1.066-.433t1.067.433q.433.434.433 1.067q0 .632-.433 1.066q-.434.434-1.067.434M5.881 5.5l2.669 5.616h6.635q.173 0 .307-.087q.135-.087.231-.24l2.616-4.75q.115-.212.019-.375q-.097-.164-.327-.164zm-.489-1h13.02q.651 0 .98.532q.33.531.035 1.095l-2.858 5.208q-.217.365-.564.573t-.763.208H8.1l-1.215 2.23q-.154.231-.01.5t.433.27h10.384q.214 0 .357.143t.143.357t-.143.356t-.357.144H7.308q-.875 0-1.306-.738t-.021-1.482l1.504-2.68L3.808 3.5H2.5q-.213 0-.357-.143T2 3t.143-.357T2.5 2.5h1.433q.236 0 .429.121q.192.121.298.338zm3.158 6.616h7z"
			/>
		</svg>
	</div>
</label>

{#if addToCartAlert}
	<div
		role="alert"
		class="alert alert-success fixed top-1/2 z-20 mb-4 ml-2 px-6"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Dish added to cart successfully!</span>
	</div>
{/if}

{#if cartErrorAlert}
	<div
		role="alert"
		class="alert alert-error fixed top-1/2 z-20 mb-4"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
			/>
		</svg>
		{#if $isLoggedIn}
			<span>Dish Could not be Added to Cart</span>
		{:else}
			<span>You must be logged in to add a dish to cart</span>
		{/if}
	</div>
{/if}

<div class="text-base-content flex min-h-screen flex-col">
	<section
		id="home"
		class="hero md:px-20l flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-6 text-center md:px-0"
	>
		<h3 class="text-secondary mt-4 ml-4 animate-bounce font-bold">Hi {$user?.name || 'there'}!!</h3>
		<h1
			class="font-playfair text-primary mb-4 text-6xl font-bold drop-shadow-md md:text-7xl"
			in:fly={{ y: -100, duration: 800 }}
		>
			Your Best Life Now
		</h1>
		<p
			class="text-base-content mb-8 max-w-xl text-lg md:text-xl"
			in:fade={{ delay: 600, duration: 900 }}
		>
			Authentic Nigerian flavors crafted with love and passion. Fresh, local ingredients in every
			bite.
		</p>
		<img
			src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80"
			alt="Delicious Nigerian dish"
			class="flex max-w-xl items-center justify-center rounded-xl text-center shadow-lg transition-transform duration-700 ease-in-out hover:scale-105 md:h-[450px] md:w-screen md:max-w-full"
			in:scale={{ duration: 1000, easing: cubicOut }}
		/>
	</section>

	<!-- Search Input -->
	<section id="menu" class="mt-15 items-center justify-center gap-2">
		<h2
			class="font-playfair text-primary mt-15 mb-8 text-center text-5xl font-semibold"
			in:fly={{ x: -200, duration: 800 }}
		>
			Our Menu
		</h2>

		<form method="GET" onsubmit={handleSearchSubmit} class="gap-2 sm:flex">
			<div class="mx-auto flex items-center justify-center gap-2 p-2">
				<input
					type="text"
					name="search"
					placeholder="Search dishes..."
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
						<option value="All">All Categories</option>
						{#each categories as category}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</div>
			</div>
		</form>
	</section>

	{#if dishes.length > 0 && $searchSubmitted}
		<p class="mt-6 text-center text-gray-500">Showing results for "{searchInput}".</p>
	{/if}

	{#if dishes.length === 0}
		<p class="mt-6 text-center text-gray-500">
			No dishes found in {selectedCategoryInput ? `${selectedCategoryInput}` : 'all'} category
			{searchInput ? ` for "${searchInput}"` : ''}.
		</p>
	{/if}

	{#each Object.entries(groupedDishes).sort( (a, b) => a[0].localeCompare(b[0]) ) as [category, dishesInCategory]}
		<section class="mb-10 p-6">
			<div class="text-secondary mb-6 ml-4 w-fit text-3xl">
				<h3 class="font-semibold">{category}</h3>
				<div class="border-2 underline"></div>
			</div>

			<div class="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each dishesInCategory as dish}
					<article
						class="card card-compact bg-base-200 transform overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
						in:fly={{ y: 50, duration: 600 }}
					>
						<figure>
							<img src={dish.image} alt={dish.name} class="h-48 w-full object-cover" />
						</figure>

						<div class="card-body">
							<h4 class="card-title text-primary font-playfair">{dish.name}</h4>

							<p class="text-base-content">{dish.description}</p>

							<!-- <p>Availability: {dish.availability}</p> -->

							<div class="mt-1 mb-1 flex justify-between">
								<div
									class="tooltip"
									data-tip={dish.availability !== 'Available'
										? 'Dish is unavailable'
										: 'Set quantity'}
								>
									<span class="font-semibold">Quantity </span>
									<input
										type="number"
										bind:value={dishQuantities[dish.id]}
										class="border-secondary focus:ring-secondary w-[80px] border p-1 focus:ring-2 focus:outline-none disabled:cursor-not-allowed"
										min="1"
										disabled={dish.availability !== 'Available'}
									/>
								</div>
							</div>
							<div>
								{#if dish.availability === 'Available'}
									<span class="badge badge-success">Available</span>
								{:else if dish.availability === 'Unavailable'}
									<span class="badge badge-error">Unavailable</span>
								{/if}
							</div>

							<!-- <p class="text-xs text-gray-500">Debug: qty = {dishQuantities[dish.id]}</p> -->

							<div class="mr-3 flex justify-between">
								<div class="flexx items-baseline gap-2">
									{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
										<div class="flex gap-2">
											<p class="text-secondary font-bold">
												₦{Number(dish.promoAmount).toLocaleString()}
											</p>
											<p class="text-gray-400 line-through">
												₦{Number(dish.defaultAmount).toLocaleString()}
											</p>
										</div>
										<span
											class="badge badge-accent mt-1"
											class:bg-gray-100={dish.availability !== 'Available'}
											class:border-gray-200={dish.availability !== 'Available'}
										>
											-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
										</span>
									{:else}
										<p class="text-secondary font-bold">
											₦{Number(dish.defaultAmount).toLocaleString()}
										</p>
									{/if}
								</div>

								<!-- Icons or actions -->
								<div class="flex gap-3">
									<!-- View, Edit, etc. -->

									<div
										class="tooltip tooltip-left z-5"
										data-tip={dish.availability !== 'Available'
											? 'Dish is unavailable'
											: 'Add to cart'}
									>
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<svg
											onclick={() => handleAddToCart(dish)}
											class="text-secondary"
											class:text-gray-300={dish.availability !== 'Available'}
											class:cursor-not-allowed={dish.availability !== 'Available'}
											class:text-secondary={dish.availability === 'Available'}
											class:cursor-pointer={dish.availability === 'Available'}
											xmlns="http://www.w3.org/2000/svg"
											width="28"
											height="28"
											viewBox="0 0 24 24"
											><path
												fill="none"
												stroke="currentColor"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4m8 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4m-8.5-3h9.25L19 7H7.312"
											/></svg
										>
									</div>
								</div>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>

<label for="my-drawer-5" class="drawer-button cursor-pointer">
	<div class="bg-secondary text-primary-content fixed right-4 bottom-4 rounded-lg p-4 shadow-lg">
		<p class="text-xl font-semibold">Cart Total: ₦{$total.toLocaleString('en-NG')}</p>
		<p>Items in cart: {$cart.length}</p>
	</div>
</label>

{#if alert}
	<div
		role="alert"
		class="alert alert-success fixed top-1/2 left-2 z-10"
		in:fly={{ x: -200, duration: 800 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Your purchase has been confirmed!</span>
	</div>
{/if}

<!-- cart -->
<div class="drawer drawer-end z-[9999]">
	<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content"></div>
	<div class="drawer-side">
		<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

		<div class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4">
			<div>
				<button
					onclick={back}
					class="hover:text-secondary items-start justify-start hover:underline"
					><span class="text-secondary">&lt&lt</span> Back</button
				>
			</div>
			<h2 class="mb-2 text-xl font-bold">Your Cart</h2>

			{#if $cart.length > 0}
				<ul class="space-y-4">
					{#each $cart as item (item.id)}
						<li class="flex items-center justify-between border-b pb-2 text-lg">
							<div class="mx-auto flex flex-col gap-1 text-center">
								<img
									src={item.expand.dish.image}
									alt={item.expand.dish.name}
									class="h-25 w-25 rounded-full"
								/>
								<p class="font-semibold">{item.expand.dish.name}</p>
								<p class="text-sm">
									Qty: {item.quantity} × ₦{item.expand.dish.promoAmount
										? item.expand.dish.promoAmount
										: item.expand.dish.defaultAmount} = ₦{item.amount.toLocaleString()}
								</p>
							</div>

							<button
								onclick={() => {
									dishToDelete = item;
									deleteModal.showModal();
								}}
								class="btn btn-xs btn-error mt-2 bg-red-500 p-4 text-lg text-white"
							>
								Remove
							</button>

							<!-- Open the modal using ID.showModal() method -->

							<dialog id="my_modal_2" bind:this={deleteModal} class="modal">
								<div class="modal-box">
									<h3 class="text-lg font-bold">
										Hey <span class="text-secondary">{$user.name}!</span>
									</h3>
									<!-- <p class="py-4">Are you sure you want to remove  from cart?</p> -->
									{#if dishToDelete}
										<p class="py-4">
											Are you sure you want to remove <span class="font-bold"
												>{dishToDelete.expand.dish.name}</span
											> from your cart?
										</p>
									{:else}
										<p class="py-4">Loading dish info...</p>
									{/if}
									<div class="modal-action">
										<form method="dialog">
											<!-- if there is a button in form, it will close the modal -->
											<button class="btn">Close</button>
										</form>
										<button
											onclick={() => {
												removeFromCart(dishToDelete.id);
												deleteModal.close();
											}}
											class="btn btn-xs btn-error bg-red-500 p-4 text-lg text-white"
										>
											Remove
										</button>
									</div>
								</div>
							</dialog>
						</li>
					{/each}
				</ul>

				<div class="mt-4">
					<p class="text-lg font-semibold">Total: ₦{$total.toLocaleString()}</p>
					<div class="mt-2 flex gap-2">
						<button
							onclick={() => {
								clearModal.showModal();
							}}
							class="btn btn-sm btn-secondary">Clear</button
						>
						<button onclick={closeSideBar} class="btn btn-sm btn-primary">Checkout</button>

						<dialog id="my_modal_3" bind:this={clearModal} class="modal">
							<div class="modal-box">
								<h3 class="text-lg font-bold">
									Hey <span class="text-secondary">{$user.name}!</span>
								</h3>
								<!-- <p class="py-4">Are you sure you want to remove  from cart?</p> -->

								<p class="py-4">Are you sure you want to clear your cart?</p>

								<div class="modal-action">
									<form method="dialog">
										<!-- if there is a button in form, it will close the modal -->
										<button class="btn">Close</button>
									</form>
									<button
										onclick={clearCart}
										class="btn btn-xs btn-error bg-red-500 p-5 text-lg text-white"
									>
										Clear Cart
									</button>
								</div>
							</div>
						</dialog>
					</div>
				</div>
			{:else}
				<div role="alert" class="alert alert-info mt-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span>Your cart is currently empty.</span>
					<div>
						<a onclick={closeSideBar} href="/#menu">
							<button class="btn btn-sm btn-primary">Order</button>
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&family=Roboto&display=swap');

	:global(html, body) {
		font-family: 'Roboto', sans-serif;
	}

	:global(h1, h2, h3) {
		font-family: 'Playfair Display', serif;
	}

	/* Smooth scrolling for anchor links */
	* {
		scroll-behavior: smooth;
	}

	/* Animate nav links on hover */
	.nav-link:hover {
		transition: color 0.3s ease;
	}
</style>
