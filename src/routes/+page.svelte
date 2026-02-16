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

	// PWA Install Banner State
	let showInstallBanner = $state(false);
	let isIOS = $state(false);
	let deferredPrompt: any = null;
	let installDismissed = $state(false);

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

		// Check if install banner was previously dismissed
		const dismissed = localStorage.getItem('pwa-install-dismissed');
		if (dismissed) {
			installDismissed = true;
		}

		// Check if already installed
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true;

		if (!isStandalone && !dismissed) {
			// Check if iOS
			isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

			if (isIOS) {
				// Show iOS banner after 2 seconds
				setTimeout(() => {
					showInstallBanner = true;
				}, 2000);
			} else {
				// Listen for beforeinstallprompt event for Android/Chrome
				window.addEventListener('beforeinstallprompt', (e) => {
					e.preventDefault();
					deferredPrompt = e;
					setTimeout(() => {
						showInstallBanner = true;
					}, 2000);
				});
			}
		}

		// Listen for app installed event
		window.addEventListener('appinstalled', () => {
			showInstallBanner = false;
			deferredPrompt = null;
			localStorage.setItem('pwa-install-dismissed', 'true');
		});
	});

	function dismissInstallBanner() {
		showInstallBanner = false;
		localStorage.setItem('pwa-install-dismissed', 'true');
	}

	async function installPWA() {
		if (isIOS) {
			// iOS requires manual installation, scroll to show instructions
			return;
		}

		if (deferredPrompt) {
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			if (outcome === 'accepted') {
				showInstallBanner = false;
				localStorage.setItem('pwa-install-dismissed', 'true');
			}
			deferredPrompt = null;
		}
	}

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
	<!-- PWA Install Banner -->
	{#if showInstallBanner}
		<div
			class="fixed top-20 right-4 left-4 z-[45] md:right-4 md:left-auto md:w-[400px]"
			transition:fly={{ y: -100, duration: 500 }}
		>
			<div class="bg-primary text-primary-content overflow-hidden rounded-2xl shadow-2xl">
				<!-- Header -->
				<div class="bg-primary/80 flex items-center justify-between p-4">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M12 2v20M2 12h20" /></svg
							>
						</div>
						<div>
							<h3 class="text-sm font-bold">Install Proxifeast App</h3>
							<p class="text-primary-content/80 text-xs">Order faster with our app</p>
						</div>
					</div>
					<button
						onclick={dismissInstallBanner}
						class="btn btn-ghost btn-circle btn-sm hover:bg-white/20"
						aria-label="Dismiss"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
						>
					</button>
				</div>

				<!-- Instructions -->
				<div class="bg-base-100 text-base-content p-4">
					{#if isIOS}
						<!-- iOS Instructions -->
						<div class="space-y-3">
							<p class="text-sm font-medium">Install on iPhone/iPad:</p>
							<ol class="text-base-content/80 space-y-2 text-xs">
								<li class="flex items-start gap-2">
									<span
										class="bg-primary/10 text-primary flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
										>1</span
									>
									<span>Tap the <strong>Share</strong> button at the bottom</span>
								</li>
								<li class="flex items-start gap-2">
									<span
										class="bg-primary/10 text-primary flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
										>2</span
									>
									<span>Scroll down and tap <strong>Add to Home Screen</strong></span>
								</li>
								<li class="flex items-start gap-2">
									<span
										class="bg-primary/10 text-primary flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
										>3</span
									>
									<span>Tap <strong>Add</strong> in the top right</span>
								</li>
							</ol>
						</div>
					{:else}
						<!-- Android Instructions -->
						<div class="space-y-3">
							<p class="text-sm font-medium">Install on Android:</p>
							<ol class="text-base-content/80 space-y-2 text-xs">
								<li class="flex items-start gap-2">
									<span
										class="bg-primary/10 text-primary flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
										>1</span
									>
									<span>Tap the menu (⋮) in the top right</span>
								</li>
								<li class="flex items-start gap-2">
									<span
										class="bg-primary/10 text-primary flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
										>2</span
									>
									<span>Select <strong>Add to Home screen</strong></span>
								</li>
								<li class="flex items-start gap-2">
									<span
										class="bg-primary/10 text-primary flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
										>3</span
									>
									<span>Tap <strong>Install</strong> or <strong>Add</strong></span>
								</li>
							</ol>
							{#if deferredPrompt}
								<button onclick={installPWA} class="btn btn-primary mt-3 w-full">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="mr-2"
										><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
											points="7 10 12 15 17 10"
										/><line x1="12" y1="15" x2="12" y2="3" /></svg
									>
									Install Now
								</button>
							{/if}
						</div>
					{/if}

					<!-- Dismissed message -->
					<p class="text-base-content/60 border-base-200 mt-3 border-t pt-3 text-xs">
						Changed your mind?
						<a
							href="/install-guide"
							class="text-primary font-medium hover:underline"
							onclick={dismissInstallBanner}
						>
							View installation guide
						</a>
					</p>
				</div>
			</div>
		</div>
	{/if}

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

			<div class="bg-base-100 flex h-full w-96 flex-col">
				<!-- Drawer Header -->
				<div class="border-base-200 border-b p-6">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="flex items-center gap-2 text-xl font-bold">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path
									d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
								/></svg
							>
							Your Cart
						</h2>
						<button onclick={closeSideBar} class="btn btn-ghost btn-circle btn-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
							>
						</button>
					</div>
					{#if $cart.length > 0}
						<div class="flex items-end justify-between">
							<div>
								<p class="text-base-content/60 text-sm">Total Amount</p>
								<p class="text-primary text-2xl font-bold">₦{$total.toLocaleString()}</p>
							</div>
							<p class="text-base-content/60 text-sm">
								{$cart.length} item{$cart.length !== 1 ? 's' : ''}
							</p>
						</div>
					{/if}
				</div>

				<!-- Cart Items -->
				{#if $cart.length > 0}
					<div class="flex-1 overflow-y-auto p-4">
						<div class="space-y-4">
							{#each $cart as item (item.id)}
								<div
									class="bg-base-200 rounded-xl p-4 transition-all"
									class:opacity-60={item.expand.dish.availability !== 'Available'}
								>
									<div class="flex gap-4">
										<!-- Image -->
										<div class="bg-base-300 h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
											<img
												src={item.expand.dish.image}
												alt={item.expand.dish.name}
												class="h-full w-full object-cover"
											/>
										</div>

										<!-- Details -->
										<div class="min-w-0 flex-1">
											<div class="flex items-start justify-between gap-2">
												<div>
													<h3 class="truncate font-semibold">{item.expand.dish.name}</h3>
													<span class="badge badge-primary badge-sm mt-1 text-white">
														{allRestaurants.find((r: any) => r.id === item.expand.dish.restaurantId)
															?.name || 'Restaurant'}
													</span>
												</div>
												<button
													onclick={() => {
														dishToDelete = item;
														deleteModal.showModal();
													}}
													class="text-error/60 hover:text-error p-1 transition-colors"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
														><path d="M3 6h18" /><path
															d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
														/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line
															x1="10"
															x2="10"
															y1="11"
															y2="17"
														/><line x1="14" x2="14" y1="11" y2="17" /></svg
													>
												</button>
											</div>

											<!-- Price -->
											<div class="mt-2 flex items-center gap-2">
												{#if item.expand.dish.promoAmount && item.expand.dish.promoAmount < item.expand.dish.defaultAmount}
													<span class="text-primary font-bold"
														>₦{Number(item.expand.dish.promoAmount).toLocaleString()}</span
													>
													<span class="text-base-content/40 text-sm line-through"
														>₦{Number(item.expand.dish.defaultAmount).toLocaleString()}</span
													>
													<span class="badge badge-accent badge-sm"
														>-{Math.round(
															(1 - item.expand.dish.promoAmount / item.expand.dish.defaultAmount) *
																100
														)}%</span
													>
												{:else}
													<span class="text-primary font-bold"
														>₦{Number(item.expand.dish.defaultAmount).toLocaleString()}</span
													>
												{/if}
												{#if item.expand.dish.availability !== 'Available'}
													<span class="badge badge-error badge-sm">Unavailable</span>
												{/if}
											</div>

											<!-- Quantity Controls -->
											<div class="mt-3 flex items-center gap-3">
												<button
													onclick={() => {
														if (item.expand.dish.availability !== 'Available') return;
														if (item.quantity <= 1) {
															dishToDelete = item;
															deleteModal.showModal();
														} else {
															updateQuantity({
																itemId: item.id,
																newQty: item.quantity - 1,
																promoAmount: item.expand.dish.promoAmount,
																defaultAmount: item.expand.dish.defaultAmount
															});
														}
													}}
													class="bg-base-100 hover:bg-base-300 flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
													disabled={item.expand.dish.availability !== 'Available'}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"><path d="M5 12h14" /></svg
													>
												</button>
												<span class="w-8 text-center font-semibold">{item.quantity}</span>
												<button
													onclick={() => {
														if (item.expand.dish.availability !== 'Available') return;
														updateQuantity({
															itemId: item.id,
															newQty: item.quantity + 1,
															promoAmount: item.expand.dish.promoAmount,
															defaultAmount: item.expand.dish.defaultAmount
														});
													}}
													class="bg-base-100 hover:bg-base-300 flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
													disabled={item.expand.dish.availability !== 'Available'}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
													>
												</button>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Footer Actions -->
					<div class="border-base-200 border-t p-4">
						<div class="flex gap-3">
							<button onclick={() => clearModal.showModal()} class="btn btn-ghost flex-1">
								Clear Cart
							</button>
							<a onclick={closeSideBar} href="/checkout" class="btn btn-primary flex-[2]">
								Checkout
							</a>
						</div>
					</div>
				{:else}
					<!-- Empty State -->
					<div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
						<div class="bg-base-200 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-base-content/30"
								><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path
									d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
								/></svg
							>
						</div>
						<h3 class="mb-2 text-lg font-semibold">Your cart is empty</h3>
						<p class="text-base-content/60 mb-6 text-sm">Add some delicious items to get started</p>
						<a onclick={closeSideBar} href="/#menu" class="btn btn-primary"> Browse Menu </a>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Clear Cart Modal -->
	<dialog bind:this={clearModal} class="modal">
		<div class="modal-box max-w-sm text-center">
			<div
				class="bg-error/10 text-error mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
						d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
					/></svg
				>
			</div>
			<h3 class="text-lg font-bold">Clear Cart?</h3>
			<p class="text-base-content/70 mt-2 mb-6">
				Are you sure you want to remove all items from your cart?
			</p>
			<div class="flex justify-center gap-3">
				<button onclick={() => clearModal.close()} class="btn btn-ghost">Cancel</button>
				<button onclick={() => clearCart(clearModal)} class="btn btn-error"> Clear All </button>
			</div>
		</div>
	</dialog>

	<!-- Delete Item Modal -->
	<dialog bind:this={deleteModal} class="modal">
		<div class="modal-box max-w-sm text-center">
			<div
				class="bg-error/10 text-error mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path
						d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
					/></svg
				>
			</div>
			<h3 class="text-lg font-bold">Remove Item?</h3>
			{#if dishToDelete}
				<p class="text-base-content/70 mt-2 mb-6">
					Remove <span class="text-base-content font-semibold">{dishToDelete.expand.dish.name}</span
					> from your cart?
				</p>
			{/if}
			<div class="flex justify-center gap-3">
				<button onclick={() => deleteModal.close()} class="btn btn-ghost">Cancel</button>
				<button
					onclick={() => {
						removeFromCart(dishToDelete.id);
						deleteModal.close();
					}}
					class="btn btn-error"
				>
					Remove
				</button>
			</div>
		</div>
	</dialog>
{:else if viewMode === 'menu' && selectedRestaurant}
	<!-- Not Logged In Drawer -->
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

			<div class="bg-base-100 flex h-full w-96 flex-col">
				<!-- Header -->
				<div class="border-base-200 border-b p-6">
					<div class="flex items-center justify-between">
						<h2 class="flex items-center gap-2 text-xl font-bold">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path
									d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
								/></svg
							>
							Your Cart
						</h2>
						<button onclick={closeSideBar} class="btn btn-ghost btn-circle btn-sm">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
							>
						</button>
					</div>
				</div>

				<!-- Login Required State -->
				<div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
					<div class="bg-base-200 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-base-content/30"
							><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path
								d="M7 11V7a5 5 0 0 1 10 0v4"
							/></svg
						>
					</div>
					<h3 class="mb-2 text-lg font-semibold">Sign In Required</h3>
					<p class="text-base-content/60 mb-6 text-sm">
						Please sign in to view your cart and place orders
					</p>
					<div class="flex w-full flex-col gap-3">
						<a onclick={closeSideBar} href="/login" class="btn btn-primary w-full"> Sign In </a>
						<a onclick={closeSideBar} href="/signup" class="btn btn-outline w-full">
							Create Account
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
