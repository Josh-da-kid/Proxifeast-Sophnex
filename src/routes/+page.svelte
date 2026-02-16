<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Nav from '$lib/Nav.svelte';
	import { derived, get, writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import pb from '$lib/pb';
	import { addToCartPB } from '$lib/addToCart';

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
	const user = derived(page, ($page) => $page.data.user);

	// Data from server
	const restaurants = $derived($page.data.restaurants ?? []);
	const allRestaurants = $derived($page.data.allRestaurants ?? []);
	const featuredDishes = $derived($page.data.featuredDishes ?? []);
	const selectedRestaurant = $derived($page.data.selectedRestaurant);
	const dishes = $derived($page.data.dishes ?? []);
	const categories = $derived($page.data.categories ?? []);
	const searchQuery = $derived($page.data.searchQuery ?? '');
	const searchType = $derived($page.data.searchType ?? 'restaurant');

	// State management
	let viewMode = $state('list'); // 'list' or 'menu'
	let searchInput = $state('');
	let searchTypeInput = $state('restaurant');
	let selectedCategoryInput = $state('All');
	let hasSearched = $state(false);
	let dishQuantities = $state<Record<string, number>>({});
	let addToCartAlert = $state(false);
	let cartErrorAlert = $state(false);

	// Modal states
	let modalImage: string | null = $state(null);
	let modalDish: string | null = $state(null);
	let modalPrice: string | null = $state(null);
	let modalDescription: string | null = $state(null);
	let modalDefault: any | null = $state(null);
	let modalPromo: any | null = $state(null);
	let modalAvailability: string | null = $state(null);
	let modalId: string | null = $state(null);
	let modalRestaurantId: string | null = $state(null);

	let deleteModal: HTMLDialogElement;
	let clearModal: HTMLDialogElement;
	let dishToDelete: any = $state(null);

	let unsubscribeDish: () => void;
	let unsubscribeCart: () => void;

	// Initialize state from URL on mount
	onMount(() => {
		searchInput = searchQuery;
		searchTypeInput = searchType;

		if (selectedRestaurant) {
			viewMode = 'menu';
		}

		// Initialize dish quantities
		for (const dish of dishes) {
			dishQuantities[dish.id] = 1;
		}

		// Setup subscriptions if user is logged in
		if ($isLoggedIn) {
			setupSubscriptions();
			fetchCart();
		}

		// Check URL hash for menu scroll
		if (window.location.hash === '#menu' && viewMode === 'menu') {
			setTimeout(() => {
				const el = document.getElementById('menu');
				if (el) {
					el.scrollIntoView({ behavior: 'smooth' });
				}
			}, 100);
		}
	});

	onDestroy(() => {
		cleanupSubscriptions();
	});

	async function setupSubscriptions() {
		if (!$user?.id) return;

		unsubscribeDish = await pb.collection('dishes').subscribe('*', async ({ action, record }) => {
			if (action === 'update') {
				await invalidateAll();
				await fetchCart();
			}
		});

		unsubscribeCart = await pb.collection('cart').subscribe('*', async ({ action, record }) => {
			if (record.user === $user.id) {
				await fetchCart();
			}
		});
	}

	function cleanupSubscriptions() {
		unsubscribeDish?.();
		unsubscribeCart?.();
	}

	// Search functionality
	async function handleSearchSubmit(e: Event) {
		e.preventDefault();

		if (!searchInput.trim()) {
			await goto('/');
			return;
		}

		const query = new URLSearchParams();
		query.set('search', searchInput.trim());
		query.set('type', searchTypeInput);

		await goto(`/?${query.toString()}`);
		hasSearched = true;
	}

	async function clearSearch() {
		searchInput = '';
		hasSearched = false;
		await goto('/');
	}

	// Restaurant selection
	async function selectRestaurant(restaurant: any) {
		viewMode = 'menu';
		await goto(`/?restaurant=${restaurant.id}#menu`);
	}

	async function backToRestaurants() {
		viewMode = 'list';
		cleanupSubscriptions();
		await goto('/');
	}

	// Select restaurant from featured dish
	async function selectRestaurantFromDish(dish: any) {
		const restaurant = allRestaurants.find((r: any) => r.id === dish.restaurantId);
		if (restaurant) {
			await selectRestaurant(restaurant);
		}
	}

	// Category filter
	async function handleCategoryChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedCategoryInput = target.value;

		if (selectedRestaurant) {
			const query = new URLSearchParams();
			query.set('restaurant', selectedRestaurant.id);
			if (selectedCategoryInput !== 'All') {
				query.set('category', selectedCategoryInput);
			}
			await goto(`/?${query.toString()}#menu`);
		}
	}

	// Cart functionality
	export const cart = writable<any[]>([]);

	export const total = derived(cart, ($cart) =>
		$cart.reduce((acc, item) => {
			if (item.expand?.dish?.availability === 'Available') {
				const price = item.expand?.dish?.promoAmount ?? item.expand?.dish?.defaultAmount ?? 0;
				return acc + price * item.quantity;
			}
			return acc;
		}, 0)
	);

	export async function fetchCart() {
		try {
			if (!$user?.id) return cart.set([]);

			const records = await pb.collection('cart').getFullList({
				filter: `user="${$user.id}"`,
				expand: 'dish'
			});

			cart.set(records);
		} catch (err) {
			console.error('Failed to fetch cart:', err);
		}
	}

	async function handleAddToCart(dish: any) {
		if (dish.availability !== 'Available') return;

		const quantity = Number(dishQuantities[dish.id] || 1);

		try {
			if ($isLoggedIn) {
				await addToCartPB(
					pb,
					dish.id,
					quantity,
					$user.id,
					dish.defaultAmount,
					dish.promoAmount,
					dish.restaurantId
				);

				await fetchCart();

				addToCartAlert = true;
				setTimeout(() => {
					addToCartAlert = false;
				}, 2000);
			} else {
				cartErrorAlert = true;
				setTimeout(() => {
					cartErrorAlert = false;
				}, 2000);
			}
		} catch (err) {
			cartErrorAlert = true;
			setTimeout(() => {
				cartErrorAlert = false;
			}, 2000);
		}
	}

	export async function clearCart(clearModal?: HTMLDialogElement) {
		const userId = $user?.id;
		if (!userId) return;

		try {
			const items = await pb.collection('cart').getFullList({
				filter: `user="${userId}"`
			});

			await Promise.all(items.map((item) => pb.collection('cart').delete(item.id)));
			await fetchCart();

			clearModal?.close();
		} catch (err) {
			console.error('Failed to clear cart:', err);
		}
	}

	export async function removeFromCart(id: string) {
		try {
			await pb.collection('cart').delete(id);
			await fetchCart();
		} catch (err) {
			console.error('Failed to remove item:', err);
		}
	}

	async function updateQuantity({
		itemId,
		dishId,
		userId,
		newQty,
		promoAmount,
		defaultAmount
	}: {
		itemId: string;
		dishId: string;
		userId: string;
		newQty: number;
		promoAmount?: number;
		defaultAmount: number;
	}) {
		const unitPrice = promoAmount ?? defaultAmount;

		if (newQty < 1) {
			await removeFromCart(itemId);
			return;
		}

		try {
			const updatedAmount = unitPrice * newQty;

			await pb.collection('cart').update(itemId, {
				quantity: newQty,
				amount: updatedAmount
			});

			await fetchCart();
		} catch (err) {
			console.error('Failed to update quantity:', err);
		}
	}

	function updateDishQuantity(dishId: string, change: number) {
		if (dishQuantities[dishId] === undefined) {
			dishQuantities[dishId] = 1;
		}
		dishQuantities[dishId] = Math.max(1, dishQuantities[dishId] + change);
	}

	function closeSideBar() {
		const drawer = document.getElementById('my-drawer-5') as HTMLInputElement;
		if (drawer) drawer.checked = false;
	}

	function closeModal() {
		modalImage = null;
		modalDish = null;
		modalPrice = null;
		modalDescription = null;
		modalDefault = null;
		modalPromo = null;
		modalAvailability = null;
		modalId = null;
		modalRestaurantId = null;
	}

	// Derived data for grouped dishes
	const groupedDishes = $derived.by(() => {
		const groups: Record<string, typeof dishes> = {};
		for (const dish of dishes) {
			dish.quantity = dishQuantities[dish.id] || 1;
			if (dish.category) {
				if (!groups[dish.category]) {
					groups[dish.category] = [];
				}
				groups[dish.category].push(dish);
			}
		}
		return groups;
	});

	// Get restaurant name for featured dish
	function getRestaurantNameForDish(dish: any): string {
		if (dish.expand?.restaurantId?.name) {
			return dish.expand.restaurantId.name;
		}
		const restaurant = allRestaurants.find((r: any) => r.id === dish.restaurantId);
		return restaurant?.name || 'Unknown Restaurant';
	}
</script>

<!-- Cart FAB Icon -->
{#if viewMode === 'menu' && selectedRestaurant}
	<label for="my-drawer-5">
		<div
			class="tooltip indicator bg-secondary fixed right-4 bottom-22 z-10 cursor-pointer rounded-full p-4 text-white shadow-xl transition-transform duration-300 hover:scale-105"
			data-tip="view cart"
		>
			<span class="indicator-item indicator-start badge badge-sm bg-white font-bold text-black">
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
{/if}

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
	<!-- Hero Section -->
	<section
		id="home"
		class="hero md:px-20l flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-6 text-center md:px-0"
	>
		<h3 class="text-secondary mt-4 ml-4 animate-bounce text-2xl font-bold md:mt-8">
			Hi {$user?.name || 'there'}!!
		</h3>
		<h1
			class="font-playfair text-primary mb-4 text-4xl font-bold drop-shadow-md sm:text-6xl lg:text-7xl"
			in:fly={{ y: -100, duration: 800 }}
		>
			{#if viewMode === 'menu' && selectedRestaurant}
				{selectedRestaurant.motto}
			{:else}
				Discover Great Food
			{/if}
		</h1>
		<p
			class="text-base-content mb-8 max-w-xl text-lg md:text-xl"
			in:fade={{ delay: 600, duration: 900 }}
		>
			{#if viewMode === 'menu' && selectedRestaurant}
				{selectedRestaurant.description}
			{:else}
				Explore restaurants and find your favorite dishes all in one place
			{/if}
		</p>
		<img
			src={viewMode === 'menu' && selectedRestaurant
				? selectedRestaurant.logoUrl
				: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'}
			alt={viewMode === 'menu' && selectedRestaurant ? selectedRestaurant.name : 'Delicious Food'}
			class="flex max-w-xl items-center justify-center rounded-xl text-center shadow-lg transition-transform duration-700 ease-in-out hover:scale-105 md:h-[450px] md:w-screen md:max-w-full"
			in:scale={{ duration: 1000, easing: cubicOut }}
		/>
	</section>

	<!-- Today's Special - Only show when in list view or when we have featured dishes -->
	{#if featuredDishes.length > 0}
		<section class="relative py-12">
			<h2
				class="font-playfair text-primary mt-8 mb-8 text-center text-3xl font-semibold sm:mt-15 sm:text-5xl"
				in:fly={{ x: -200, duration: 800 }}
			>
				Today's Special
			</h2>

			<section class="overflow-hidden py-6">
				<div
					class="animate-marquee flex w-fit items-center gap-6 overflow-x-auto scroll-smooth px-4 whitespace-nowrap"
				>
					{#each Array(4) as _}
						{#each featuredDishes as dish}
							<div class="group relative w-72 flex-shrink-0 snap-center outline-none" tabindex="0">
								<div
									class="card bg-base-100 cursor-pointer shadow-xl transition-transform duration-300 group-hover:scale-105"
									onclick={() => selectRestaurantFromDish(dish)}
								>
									<figure class="relative h-40 overflow-hidden">
										<img src={dish.image} alt={dish.name} class="h-full w-full object-cover" />
										<!-- Restaurant Tag -->
										<div class="absolute top-2 left-2">
											<span class="badge badge-primary text-white">
												{getRestaurantNameForDish(dish)}
											</span>
										</div>
									</figure>
									<div class="card-body p-4">
										<h3 class="card-title font-playfair text-lg whitespace-normal">
											{dish.name}
										</h3>
										<div class="flex items-baseline gap-2">
											{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
												<p class="text-secondary font-bold">
													₦{Number(dish.promoAmount).toLocaleString()}
												</p>
												<p class="text-xs text-gray-400 line-through">
													₦{Number(dish.defaultAmount).toLocaleString()}
												</p>
											{:else}
												<p class="text-secondary font-bold">
													₦{Number(dish.defaultAmount).toLocaleString()}
												</p>
											{/if}
										</div>
									</div>
								</div>
								<!-- View Restaurant Button Overlay -->
								<div
									class="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100"
								>
									<button
										class="btn btn-primary"
										onclick={(e) => {
											e.stopPropagation();
											selectRestaurantFromDish(dish);
										}}
									>
										View Restaurant
									</button>
								</div>
							</div>
						{/each}
					{/each}
				</div>
			</section>
		</section>
	{/if}

	<!-- Search Section -->
	<section id="menu" class="mt-15 items-center justify-center gap-2 px-6">
		<h2
			class="font-playfair text-primary mt-8 mb-8 text-center text-5xl font-semibold sm:mt-15"
			in:fly={{ x: -200, duration: 800 }}
		>
			{#if viewMode === 'menu' && selectedRestaurant}
				{selectedRestaurant.name} Menu
			{:else}
				Available Restaurants
			{/if}
		</h2>

		{#if viewMode === 'menu' && selectedRestaurant}
			<!-- Back Button -->
			<div class="mb-6 text-center">
				<button onclick={backToRestaurants} class="btn btn-outline btn-secondary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-2 h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					Back to Restaurants
				</button>
			</div>
		{/if}

		{#if viewMode === 'list'}
			<!-- Restaurant Search -->
			<form onsubmit={handleSearchSubmit} class="justify-center gap-2 sm:flex">
				<div class="mx-auto items-center justify-center gap-2 p-2 sm:flex">
					<div class="flex flex-col gap-2 px-2 sm:flex-row">
						<input
							type="text"
							name="search"
							placeholder={searchTypeInput === 'restaurant'
								? 'Search restaurants...'
								: 'Search dishes...'}
							bind:value={searchInput}
							class="input input-bordered border-primary focus:ring-primary w-full max-w-xs border focus:ring-2 focus:outline-none md:w-[400px]"
						/>

						<select
							bind:value={searchTypeInput}
							class="select select-bordered border-primary focus:ring-primary"
						>
							<option value="restaurant">Search Restaurants</option>
							<option value="dish">Search Dishes</option>
						</select>

						{#if hasSearched}
							<button type="button" onclick={clearSearch} class="btn btn-primary"> Cancel </button>
						{:else if searchInput.length > 0}
							<button type="submit" class="btn btn-primary">Search</button>
						{:else}
							<button type="submit" class="btn btn-primary">Search</button>
						{/if}
					</div>
				</div>
			</form>
		{:else}
			<!-- Category Filter for Menu View -->
			<div class="mb-6 flex justify-center gap-2">
				<select
					bind:value={selectedCategoryInput}
					onchange={handleCategoryChange}
					class="select select-bordered border-secondary focus:ring-secondary"
				>
					<option value="All">All Categories</option>
					{#each categories as category}
						<option value={category}>{category}</option>
					{/each}
				</select>
			</div>
		{/if}
	</section>

	<!-- Restaurant List View -->
	{#if viewMode === 'list'}
		<section class="px-6 py-8">
			{#if hasSearched && restaurants.length === 0}
				<p class="mt-10 text-center text-lg font-medium text-gray-500">
					❌ No restaurants found matching "<span class="text-yellow-600">{searchInput}</span>"
				</p>
			{:else}
				{#if hasSearched && restaurants.length >= 1}
					<h3 class="mb-6 text-center">
						Showing results for <span class="text-gray-500">'{searchInput}'</span>
					</h3>
				{/if}

				<div class="mx-auto mt-8 grid max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-3">
					{#each restaurants as r}
						<div
							class="flex flex-col rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg"
						>
							<div class="mb-4 flex items-center space-x-4">
								<img
									src={r.faviconUrl || r.logoUrl}
									alt={r.name}
									class="h-16 w-16 rounded-full border object-contain"
								/>
								<div>
									<h2 class="text-xl font-semibold">{r.name}</h2>
									<p class="text-sm text-gray-500">{r.motto}</p>
								</div>
							</div>

							<p class="mb-4 line-clamp-3 text-gray-600">{r.description}</p>

							<div class="mb-6 text-sm text-gray-500">📍 {r.restaurantAddress}</div>

							<button
								onclick={() => selectRestaurant(r)}
								class="mt-auto inline-block cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-center font-medium text-white transition hover:bg-blue-500"
							>
								View Menu
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{:else}
		<!-- Menu View -->
		{#if dishes.length === 0}
			<p class="mt-6 py-12 text-center text-gray-500">
				No dishes found in {selectedCategoryInput !== 'All' ? `${selectedCategoryInput}` : 'all'} category.
			</p>
		{:else}
			{#each Object.entries(groupedDishes).sort( (a, b) => a[0].localeCompare(b[0]) ) as [category, dishesInCategory]}
				<section class="mb-10 p-6">
					<div class="text-secondary mb-6 ml-4 w-fit text-3xl">
						<h3 class="font-semibold">{category}</h3>
						<div class="border-2 underline"></div>
					</div>

					<div class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each dishesInCategory as dish}
							<div class="group relative" in:fly={{ y: 50, duration: 600 }}>
								<article
									class="card card-compact bg-base-200 transform cursor-pointer overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
									onclick={() => (
										(modalImage = dish.image),
										(modalDish = dish.name),
										(modalId = dish.id),
										(modalRestaurantId = dish.restaurantId),
										(modalPrice = dish.amount),
										(modalDescription = dish.description),
										(modalPromo = dish.promoAmount),
										(modalDefault = dish.defaultAmount),
										(modalAvailability = dish.availability)
									)}
								>
									<figure>
										<img
											src={dish.image}
											alt={dish.name}
											class="h-48 w-full rounded-lg object-cover transition-transform duration-200 hover:scale-105"
										/>
									</figure>

									<div class="card-body">
										<h4 class="card-title text-primary font-playfair">{dish.name}</h4>

										<p class="text-base-content">{dish.description}</p>

										<div class="mt-1 mb-1 flex justify-between">
											<div
												class="tooltip"
												data-tip={dish.availability !== 'Available'
													? 'Dish is unavailable'
													: 'Set quantity'}
											>
												<span class="font-semibold">Quantity </span>
												<div class="mt-2 flex items-center justify-center gap-4">
													<button
														onclick={(e) => {
															e.stopPropagation();
															updateDishQuantity(dish.id, -1);
														}}
														disabled={(dishQuantities[dish.id] ?? 1) <= 1}
														class="cursor-pointer rounded-full bg-blue-500 text-white disabled:cursor-not-allowed disabled:opacity-50"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 12 12"
														>
															<path
																fill="currentColor"
																d="M2 6a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 2 6"
															/>
														</svg>
													</button>
													<span class="text-secondary">{dishQuantities[dish.id] || 1}</span>
													<button
														onclick={(e) => {
															e.stopPropagation();
															updateDishQuantity(dish.id, 1);
														}}
														class="hover:text-secondary cursor-pointer rounded-full bg-blue-500 text-white"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="24"
															height="24"
															viewBox="0 0 24 24"
														>
															<path
																fill="currentColor"
																d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1"
															/>
														</svg>
													</button>
												</div>
											</div>
										</div>

										<div class="mr-3 flex justify-between">
											<div class="flex items-baseline gap-2">
												{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
													<div class="flex gap-2">
														<p class="text-secondary font-bold">
															₦{Number(dish.promoAmount).toLocaleString()}
														</p>
														<p class="text-gray-400 line-through">
															₦{Number(dish.defaultAmount).toLocaleString()}
														</p>
													</div>

													<div
														class="absolute top-3 right-0 left-0 mx-auto mt-1 flex justify-between px-3"
													>
														<span
															class="badge badge-accent"
															class:bg-gray-100={dish.availability !== 'Available'}
															class:border-gray-200={dish.availability !== 'Available'}
														>
															-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
														</span>

														{#if dish.availability === 'Available'}
															<span class="badge badge-success">Available</span>
														{:else if dish.availability === 'Unavailable'}
															<span class="badge badge-error">Unavailable</span>
														{/if}
													</div>
												{:else}
													<p class="text-secondary font-bold">
														₦{Number(dish.defaultAmount).toLocaleString()}
													</p>
												{/if}
											</div>
										</div>
										<div
											class="mt-2 flex items-center justify-center rounded-xl transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100"
										>
											<button
												class="btn btn-primary"
												onclick={(e) => {
													e.stopPropagation();
													handleAddToCart(dish);
												}}
												disabled={dish.availability !== 'Available'}>Add to Cart</button
											>
										</div>
									</div>
								</article>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		{/if}
	{/if}
</div>

<!-- Cart Drawer -->
{#if viewMode === 'menu' && selectedRestaurant && $isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

			<div class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4">
				<div class="">
					<button
						onclick={closeSideBar}
						class="hover:text-secondary items-start justify-start hover:underline"
					>
						<span class="text-secondary">&lt;&lt;</span> Back</button
					>
					<h2 class="text-xl font-bold">Your Cart</h2>

					<div class="z-100 mx-auto rounded-lg p-4">
						<p class="text-lg font-semibold">Total: ₦{$total.toLocaleString()}</p>
						<div class="mt-2 flex gap-2">
							<button
								onclick={() => {
									clearModal.showModal();
								}}
								class="btn btn-sm btn-secondary">Clear</button
							>
							<a onclick={closeSideBar} href="/checkout" class="btn btn-sm btn-primary">Checkout</a>

							<dialog id="my_modal_3" bind:this={clearModal} class="modal">
								<div class="modal-box">
									<h3 class="text-lg font-bold">
										Hey <span class="text-secondary">{$user?.name}!</span>
									</h3>

									<p class="py-4">Are you sure you want to clear your cart?</p>

									<div class="modal-action">
										<form method="dialog">
											<button class="btn">Close</button>
										</form>
										<button
											onclick={() => {
												clearCart(clearModal);
											}}
											class="btn btn-xs btn-error bg-red-500 p-5 text-lg text-white"
										>
											Clear Cart
										</button>
									</div>
								</div>
							</dialog>
						</div>
					</div>
				</div>

				{#if $cart.length > 0}
					<ul class="scroll-hidden max-h-[80vh] justify-center space-y-4 overflow-y-auto pr-2">
						{#each $cart as item (item.id)}
							<li
								class="flex items-center justify-between border-b border-gray-400 pb-2 text-lg"
								class:opacity-50={item.expand.dish.availability !== 'Available'}
							>
								<div class="relative mx-auto flex flex-col gap-1 text-center">
									<div class="relative">
										<img
											src={item.expand.dish.image}
											alt={item.expand.dish.name}
											class="h-25 w-25 rounded-full"
										/>
										{#if item.expand.dish.availability !== 'Available'}
											<span class="badge absolute top-1 right-1 bg-gray-300">Unavailable</span>
										{/if}
									</div>
									<p class="font-semibold">{item.expand.dish.name}</p>
									<!-- Restaurant Name Tag -->
									<span class="badge badge-primary text-xs text-white">
										{allRestaurants.find((r: any) => r.id === item.expand.dish.restaurantId)
											?.name || 'Unknown Restaurant'}
									</span>
									<div class="flex gap-3 text-start">
										{#if item.expand.dish.promoAmount && item.expand.dish.promoAmount < item.expand.dish.defaultAmount}
											<span
												class="badge badge-accent mt-1"
												class:bg-gray-100={item.expand.dish.availability !== 'Available'}
												class:border-gray-200={item.expand.dish.availability !== 'Available'}
											>
												-{Math.round(
													(1 - item.expand.dish.promoAmount / item.expand.dish.defaultAmount) * 100
												)}%
											</span>
											<div class="flex gap-2">
												<p class="text-secondary font-bold">
													₦{Number(item.expand.dish.promoAmount).toLocaleString()}
												</p>
												<p class="text-gray-400 line-through">
													₦{Number(item.expand.dish.defaultAmount).toLocaleString()}
												</p>
											</div>
										{:else}
											<p class="text-secondary font-bold">
												₦{Number(item.expand.dish.defaultAmount).toLocaleString()}
											</p>
										{/if}
									</div>
								</div>

								<div class="flex items-center justify-center gap-4">
									<button
										onclick={() => {
											if (item.quantity <= 1) {
												dishToDelete = item;
												deleteModal.showModal();
											} else {
												updateQuantity({
													itemId: item.id,
													dishId: item.dish,
													userId: $user.id,
													newQty: item.quantity - 1,
													promoAmount: item.expand.dish.promoAmount,
													defaultAmount: item.expand.dish.defaultAmount
												});
											}
										}}
										class="hover:text-secondary cursor-pointer rounded-full bg-blue-500 text-white"
										disabled={item.expand.dish.availability !== 'Available'}
										class:opacity-50={item.expand.dish.availability !== 'Available'}
										class:cursor-not-allowed={item.expand.dish.availability !== 'Available'}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 12 12"
										>
											<path
												fill="currentColor"
												d="M2 6a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 2 6"
											/>
										</svg>
									</button>
									<span class="text-secondary">{item.quantity}</span>
									<button
										onclick={() => {
											updateQuantity({
												itemId: item.id,
												dishId: item.dish,
												userId: $user.id,
												newQty: item.quantity + 1,
												promoAmount: item.expand.dish.promoAmount,
												defaultAmount: item.expand.dish.defaultAmount
											});
										}}
										class="hover:text-secondary cursor-pointer rounded-full bg-blue-500 text-white"
										disabled={item.expand.dish.availability !== 'Available'}
										class:opacity-50={item.expand.dish.availability !== 'Available'}
										class:cursor-not-allowed={item.expand.dish.availability !== 'Available'}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
										>
											<path
												fill="currentColor"
												d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1"
											/>
										</svg>
									</button>

									<button
										class=" btn-sm cursor-pointer text-red-500 transition-transform duration-300 hover:text-gray-500"
										onclick={() => {
											dishToDelete = item;
											deleteModal.showModal();
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
										>
											<path
												fill="currentColor"
												d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z"
											/>
										</svg>
									</button>
								</div>

								<dialog id="my_modal_2" bind:this={deleteModal} class="modal">
									<div class="modal-box">
										<h3 class="text-lg font-bold">
											Hey <span class="text-secondary">{$user?.name}!</span>
										</h3>
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
{:else if viewMode === 'menu' && selectedRestaurant}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

			<div
				class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4 pl-6 md:min-w-1/3"
			>
				<div>
					<button
						onclick={closeSideBar}
						class="hover:text-secondary cursor-pointer items-start justify-start hover:underline"
					>
						<span class="text-secondary">&lt;&lt;</span> Back</button
					>
				</div>
				<h2 class="mb-2 text-xl font-bold">Your Cart</h2>

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
					<span>You must be logged in to view cart.</span>
					<div>
						<a onclick={closeSideBar} href="/login">
							<button class="btn btn-sm btn-primary">Login</button>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&family=Roboto&display=swap');

	:global(html, body) {
		font-family: 'Roboto', sans-serif;
	}

	:global(h1, h2, h3) {
		font-family: 'Playfair Display', serif;
	}

	* {
		scroll-behavior: smooth;
	}

	.nav-link:hover {
		transition: color 0.3s ease;
	}
</style>
