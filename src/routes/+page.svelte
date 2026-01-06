<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Nav from '$lib/Nav.svelte';
	// import { cart, fetchCart, total } from '$lib/stores/cart';
	import { derived, get, writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import pb from '$lib/pb';
	import { addToCartPB } from '$lib/addToCart';

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
	// src/routes/admin/+page.svelte
	const dishes = $derived($page.form?.dishes ?? $page.data.dishes);
	const featuredDishes = $derived(
		dishes.filter((d: any) => d.isFeatured && d.availability === 'Available')
	);


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

	const groupedDishes = $derived.by(() => {
		const groups: Record<string, typeof dishes> = {};
		for (const dish of dishes) {
			dish.quantity = 1;
			if (dish.category) {
				if (!groups[dish.category]) {
					groups[dish.category] = [];
				}
				groups[dish.category].push(dish);
			}
		}
		return groups;
	});

	let addToCartAlert = $state(false);

	let cartErrorAlert = $state(false);
	let dishQuantities = $state<Record<string, number>>({});

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

				// ✅ Pass restaurantId to fetchCart
				await fetchCart(dish.restaurantId);

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
	const restaurantId = get(page).data.restaurant.id;

	let deleteModal: HTMLDialogElement;
	let clearModal: HTMLDialogElement;
	let dishToDelete: any = $state(null);

	let unsubscribeDish: () => void;
	let unsubscribeCart: () => void;

	async function setupSubscriptions(restaurantId: string) {
		if (!$user?.id) return;

		// --- Subscribe to dish changes ---
		unsubscribeDish = await pb.collection('dishes').subscribe('*', async ({ action, record }) => {
			if (action === 'update') {
				// Invalidate all page data to refetch dishes and cart
				// This will ensure both the menu and cart are up-to-date
				await invalidateAll();
				await fetchCart(restaurantId); // Also refetch cart for good measure
			}
		});

		// --- Subscribe to cart changes for the current user ---
		unsubscribeCart = await pb.collection('cart').subscribe('*', async ({ action, record }) => {
			// Refetch on any change to the user's cart
			if (record.user === $user.id) {
				await fetchCart(restaurantId);
			}
		});
	}

	function cleanupSubscriptions() {
		unsubscribeDish?.();
		unsubscribeCart?.();
	}

	onMount(() => {
		fetchCart(restaurantId); // make sure restaurantId is in scope
		setupSubscriptions(restaurantId);

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

	onDestroy(() => {
		cleanupSubscriptions();
	});

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
		$cart.reduce((acc, item) => {
			// Only add to total if the dish is available
			if (item.expand?.dish?.availability === 'Available') {
				const price = item.expand?.dish?.promoAmount ?? item.expand?.dish?.defaultAmount ?? 0;
				return acc + price * item.quantity;
			}
			return acc;
		}, 0)
	);

	export async function fetchCart(restaurantId: string) {
		try {
			if (!$user.id || !restaurantId) return cart.set([]);

			const records = await pb.collection('cart').getFullList({
				filter: `user="${$user.id}" && restaurantId="${restaurantId}"`,
				expand: 'dish'
			});

			cart.set(records);
		} catch (err) {
			console.error('Failed to fetch cart:', err);
		}
	}

	export async function clearCart(restaurantId: string, clearModal?: HTMLDialogElement) {
		const userId = $user.id;
		if (!userId || !restaurantId) return;

		try {
			// Get only cart items for this user and restaurant
			const items = await pb.collection('cart').getFullList({
				filter: `user="${userId}" && restaurantId="${restaurantId}"`
			});

			await Promise.all(items.map((item) => pb.collection('cart').delete(item.id)));
			await fetchCart(restaurantId);

			// ✅ Close the modal if provided
			clearModal?.close();
		} catch (err) {
			console.error('Failed to clear cart:', err);
		}
	}

	export async function removeFromCart(id: string, restaurantId: string) {
		try {
			await pb.collection('cart').delete(id);
			await fetchCart(restaurantId);
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
		defaultAmount,
		restaurantId // 👈 include this
	}: {
		itemId: string;
		dishId: string;
		userId: string;
		newQty: number;
		promoAmount?: number;
		defaultAmount: number;
		restaurantId: string; // 👈 include this
	}) {
		const unitPrice = promoAmount ?? defaultAmount;

		if (newQty < 1) {
			await removeFromCart(itemId, restaurantId); // scoped remove
			return;
		}

		try {
			const updatedAmount = unitPrice * newQty;

			await pb.collection('cart').update(itemId, {
				quantity: newQty,
				amount: updatedAmount
			});

			await fetchCart(restaurantId); // scoped fetch
		} catch (err) {
			console.error('Failed to update quantity:', err);
		}
	}

	let modalImage: string | null = $state(null);
	let modalDish: string | null = $state(null);
	let modalPrice: string | null = $state(null);
	let modalDescription: string | null = $state(null);
	let modalDefault: any | null = $state(null);
	let modalPromo: any | null = $state(null);
	let modalAvailability: string | null = $state(null);
	let modalId: string | null = $state(null);
	let modalRestaurantId: string | null = $state(null);

	const restaurantDescription = get(page).data.restaurant.description;
	const restaurantMotto = get(page).data.restaurant.motto;
	const restaurantImage = get(page).data.restaurant.logoUrl;

	function closeModal() {
		// console.log('Closing modal...');
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

	function updateDishQuantity(dishId, change) {
		// initialize if undefined
		if (dishQuantities[dishId] === undefined) {
			dishQuantities[dishId] = 1;
		}

		// apply change (+1 or -1)
		dishQuantities[dishId] = Math.max(1, dishQuantities[dishId] + change);
	}

</script>

<!-- Cart FAB Icon -->
<label for="my-drawer-5">
	<div
		class="tooltip indicator bg-secondary fixed right-4 bottom-22 z-10 cursor-pointer rounded-full p-4 text-white shadow-xl transition-transform duration-300 hover:scale-105"
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
		<h3 class="text-secondary mt-4 ml-4 animate-bounce text-2xl font-bold md:mt-8">
			Hi {$user?.name || 'there'}!!
		</h3>
		<h1
			class="font-playfair text-primary mb-4 text-4xl font-bold drop-shadow-md sm:text-6xl lg:text-7xl"
			in:fly={{ y: -100, duration: 800 }}
		>
			{restaurantMotto}
		</h1>
		<p
			class="text-base-content mb-8 max-w-xl text-lg md:text-xl"
			in:fade={{ delay: 600, duration: 900 }}
		>
			{restaurantDescription}
		</p>
		<!-- https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80 -->
		<img
			src={restaurantImage}
			alt="Delicious Nigerian dish"
			class="flex max-w-xl items-center justify-center rounded-xl text-center shadow-lg transition-transform duration-700 ease-in-out hover:scale-105 md:h-[450px] md:w-screen md:max-w-full"
			in:scale={{ duration: 1000, easing: cubicOut }}
		/>
	</section>


	<!-- today's dishes -->
	<section class="relative">
		<h2
			class="font-playfair text-primary mt-8 mb-8 text-center text-3xl font-semibold sm:text-5xl sm:mt-15"
			in:fly={{ x: -200, duration: 800 }}
		>
			Today's Special
		</h2>

		{#if featuredDishes.length > 0}
			<section class="overflow-hidden py-6">
				<div
					class="animate-marquee flex w-fit items-center gap-6 overflow-x-auto scroll-smooth whitespace-nowrap px-4"
				>
					{#each Array(4) as _}
						{#each featuredDishes as dish}
							<div class="group relative w-72 flex-shrink-0 snap-center outline-none" tabindex="0">
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="card bg-base-100 cursor-pointer shadow-xl transition-transform duration-300 group-hover:scale-105"
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
									<figure class="h-40 overflow-hidden">
										<img src={dish.image} alt={dish.name} class="h-full w-full object-cover" />
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
								<!-- Add to Cart Button Overlay -->
								<div
									class="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
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
						{/each}
					{/each}
				</div>
			</section>
		{/if}
	</section>

	<!-- Search Input -->
	<section id="menu" class="mt-15 items-center justify-center gap-2">
		<h2
			class="font-playfair text-primary mt-8 mb-8 text-center text-5xl font-semibold sm:mt-15"
			in:fly={{ x: -200, duration: 800 }}
		>
			Our Menu
		</h2>

		<form method="GET" onsubmit={handleSearchSubmit} class="gap-2 sm:flex">
			<div class="mx-auto items-center justify-center gap-2 p-2 sm:flex">
				<div class="flex gap-2 px-2">
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
				</div>

				<div class="mt-2 ml-4 px-2 sm:mt-0 sm:ml-0 sm:p-3">
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

	<!-- Modal -->
	{#if modalImage}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black px-6 py-44"
			onclick={closeModal}
		>
			<div
				class="w-fitt relative w-[400px] max-w-2xl rounded-xl bg-white p-4"
				onclick={(e) => e.stopPropagation()}
			>
				<button
					class="btn btn-lg btn-circle bg-secondary absolute top-2 right-2 text-2xl text-white"
					onclick={closeModal}>✕</button
				>

				<div class="flex flex-col items-center">
					<img
						src={modalImage}
						alt="Dish"
						class="h-auto max-h-[80vh] w-full rounded-lg object-contain"
					/>

					<div class="mt-4 w-full">
						<h3 class="font-bold">{modalDish}</h3>

						<div class="mt-2 flex items-baseline gap-2">
							{#if modalPromo && modalPromo < modalDefault}
								<div class="flex gap-2">
									<p class="text-secondary font-bold">
										₦{Number(modalPromo).toLocaleString()}
									</p>
									<p class="text-gray-400 line-through">
										₦{Number(modalDefault).toLocaleString()}
									</p>
								</div>
								<span
									class="badge badge-accent mt-1"
									class:bg-gray-100={modalAvailability !== 'Available'}
									class:border-gray-200={modalAvailability !== 'Available'}
								>
									-{Math.round((1 - modalPromo / modalDefault) * 100)}% OFF
								</span>
							{:else}
								<p class="text-secondary font-bold">
									₦{Number(modalDefault).toLocaleString()}
								</p>
							{/if}
						</div>

						<p class="mt-2">{modalDescription}</p>

						<div class="mt-6 flex justify-center">
							<button
								class="btn btn-primary w-full"
								onclick={() => handleAddToCart({
									id: modalId,
									restaurantId: modalRestaurantId,
									availability: modalAvailability,
									defaultAmount: modalDefault,
									promoAmount: modalPromo
								})}
								disabled={modalAvailability !== 'Available'}>Add to Cart</button
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#each Object.entries(groupedDishes).sort( (a, b) => a[0].localeCompare(b[0]) ) as [category, dishesInCategory]}
		<section class="mb-10 p-6">
			<div class="text-secondary mb-6 ml-4 w-fit text-3xl">
				<h3 class="font-semibold">{category}</h3>
				<div class="border-2 underline"></div>
			</div>

			<div class="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each dishesInCategory as dish}
					<div class="group relative" in:fly={{ y: 50, duration: 600 }}>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
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
							<!-- Dish Figure -->
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
							class="flex mt-2 items-center justify-center rounded-xl  transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
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
</div>

<!-- <label for="my-drawer-5" class="drawer-button cursor-pointer">
	<div
		class="bg-secondary text-primary-content fixed right-4 bottom-4 z-5 rounded-lg p-4 shadow-lg"
	>
		<p class="text-xl font-semibold">Cart Total: ₦{$total.toLocaleString('en-NG')}</p>
		<p>Items in cart: {$cart.length}</p>
	</div>
</label> -->

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
{#if $isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

			<div class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4">
				<div class="">
					<button
						onclick={back}
						class="hover:text-secondary items-start justify-start hover:underline"
					>
						<span class="text-secondary">&lt&lt</span> Back</button
					>
					<h2 class="text-xl font-bold">Your Cart</h2>

					<!-- cart total -->
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
											<!-- if there is a button in form, it will close the modal -->
											<button class="btn">Close</button>
										</form>
										<button
											onclick={() => {
												clearCart(restaurantId, clearModal);
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
											<!-- svelte-ignore node_invalid_placement_ssr -->
											<div class="flex gap-2">
												<p class="text-secondary font-bold">
													₦{Number(item.expand.dish.promoAmount).toLocaleString()}
												</p>
												<p class="text-gray-400 line-through">
													₦{Number(item.expand.dish.defaultAmount).toLocaleString()}
												</p>
											</div>
										{:else}
											<!-- svelte-ignore node_invalid_placement_ssr -->
											<p class="text-secondary font-bold">
												₦{Number(item.expand.dish.defaultAmount).toLocaleString()}
											</p>
										{/if}
									</div>
								</div>

								<div class="flex items-center justify-center gap-4">
									<!-- svelte-ignore a11y_consider_explicit_label -->
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
													defaultAmount: item.expand.dish.defaultAmount,
													restaurantId: item.expand.dish.restaurantId
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
									<!-- svelte-ignore a11y_consider_explicit_label -->
									<button
										onclick={() => {
											updateQuantity({
												itemId: item.id,
												dishId: item.dish,
												userId: $user.id,
												newQty: item.quantity + 1,
												promoAmount: item.expand.dish.promoAmount,
												defaultAmount: item.expand.dish.defaultAmount,
												restaurantId: item.expand.dish.restaurantId
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

									<!-- svelte-ignore a11y_consider_explicit_label -->
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

								<!-- Open the modal using ID.showModal() method -->

								<dialog id="my_modal_2" bind:this={deleteModal} class="modal">
									<div class="modal-box">
										<h3 class="text-lg font-bold">
											Hey <span class="text-secondary">{$user?.name}!</span>
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
													removeFromCart(dishToDelete.id, dishToDelete.restaurantId);
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
							<a onclick={back} href="/#menu">
								<button class="btn btn-sm btn-primary">Order</button>
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
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
						onclick={back}
						class="hover:text-secondary cursor-pointer items-start justify-start hover:underline"
					>
						<span class="text-secondary">&lt&lt</span> Back</button
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
						<a onclick={back} href="/login">
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

	/* Smooth scrolling for anchor links */
	* {
		scroll-behavior: smooth;
	}

	/* Animate nav links on hover */
	.nav-link:hover {
		transition: color 0.3s ease;
	}
</style>
