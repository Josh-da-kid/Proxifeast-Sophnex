<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Nav from '$lib/Nav.svelte';
	import { derived, get, writable } from 'svelte/store';
	import { afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import pb from '$lib/pb';
	import { addToCartPB } from '$lib/addToCart';
	import Footer from '$lib/Footer.svelte';
	import Carousel from '$lib/Carousel.svelte';

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
	const user = derived(page, ($page) => $page.data.user);

	// Loading state
	let isLoading = $state(true);

	// Carousel state
	let specialsScrollPos = $state(0);
	let restaurantsScrollPos = $state(0);
	let specialsContainer: HTMLDivElement;
	let restaurantsContainer: HTMLDivElement;

	function scrollCarousel(container: HTMLDivElement, direction: 'left' | 'right') {
		const scrollAmount = container.offsetWidth * 0.8;
		if (direction === 'left') {
			container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
		} else {
			container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
		}
	}

	function scrollSpecials(direction: 'left' | 'right') {
		if (specialsContainer) scrollCarousel(specialsContainer, direction);
	}

	function scrollRestaurants(direction: 'left' | 'right') {
		if (restaurantsContainer) scrollCarousel(restaurantsContainer, direction);
	}

	// Watch for navigation changes
	$effect(() => {
		const unsubscribe = navigating.subscribe((nav) => {
			if (nav) {
				isLoading = true;
			} else {
				isLoading = false;
			}
		});
		return unsubscribe;
	});

	// Check initial load
	$effect(() => {
		const unsubscribe = page.subscribe(($p) => {
			if ($p.data.dishes !== undefined) {
				isLoading = false;
			}
		});
		return unsubscribe;
	});

	// Data from server
	const restaurants = $derived($page.data.restaurants ?? []);
	const allRestaurants = $derived($page.data.allRestaurants ?? []);
	const allRestaurantsIncludingSuper = $derived($page.data.allRestaurantsIncludingSuper ?? []);
	const featuredDishes = $derived($page.data.featuredDishes ?? []);
	const selectedRestaurant = $derived($page.data.selectedRestaurant);
	const dishes = $derived($page.data.dishes ?? []);
	const categories = $derived($page.data.categories ?? []);
	const searchQuery = $derived($page.data.searchQuery ?? '');
	const searchType = $derived($page.data.searchType ?? 'restaurant');
	const isSuper = $derived($page.data.isSuper ?? false);
	const currentRestaurant = $derived($page.data.currentRestaurant);

	// Filter featured dishes by selected restaurant when visiting a specific restaurant
	const filteredFeaturedDishes = $derived.by(() => {
		if (selectedRestaurant && !isSuper) {
			return featuredDishes.filter((dish: any) => dish.restaurantId === selectedRestaurant.id);
		}
		return featuredDishes;
	});

	// State management
	let viewMode = $state('list'); // 'list' or 'menu'
	let searchInput = $state('');
	let selectedCategoryInput = $state('All');
	let menuRestaurantId = $state('');
	let dishQuantities = $state<Record<string, number>>({});
	let addToCartAlert = $state(false);
	let cartErrorAlert = $state(false);
	let cartErrorMessage = $state('');
	let locationMismatchAlert = $state(false);
	let locationMismatchMessage = $state('');
	let isAddingToCart = $state(new Map<string, boolean>());
	let isClearingCart = $state(false);
	let lastAddedDishId = $state('');

	// Dish favorites state (for super restaurants)
	let dishFavorites = $state<string[]>([]);

	// Load dish favorites on mount (only for super restaurants)
	$effect(() => {
		if (isSuper && $isLoggedIn) {
			loadDishFavorites();
		}
	});

	async function loadDishFavorites() {
		try {
			const res = await fetch('/api/favorites/dishes');
			if (res.ok) {
				const data = await res.json();
				dishFavorites = data.dishFavorites || [];
			}
		} catch (err) {
			console.error('Failed to load dish favorites:', err);
		}
	}

	async function toggleDishFavorite(dishId: string, e: Event) {
		e.stopPropagation();
		if (!$isLoggedIn) {
			window.location.href = '/login';
			return;
		}

		const action = dishFavorites.includes(dishId) ? 'remove' : 'add';

		try {
			const res = await fetch('/api/favorites/dishes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dishId, action })
			});

			if (res.ok) {
				const data = await res.json();
				dishFavorites = data.dishFavorites;
			}
		} catch (err) {
			console.error('Failed to toggle dish favorite:', err);
		}
	}

	// Client-side filtered data for restaurants (only used in list view)
	let filteredRestaurants = $derived.by(() => {
		if (!searchInput.trim()) {
			return restaurants;
		}
		const query = searchInput.toLowerCase();
		return restaurants.filter(
			(r: any) =>
				r.name.toLowerCase().includes(query) ||
				r.restaurantAddress?.toLowerCase().includes(query) ||
				r.motto?.toLowerCase().includes(query)
		);
	});

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
		// Check URL for restaurant parameter
		const urlParams = new URLSearchParams(window.location.search);
		const restaurantParam = urlParams.get('restaurant');
		const tableParam = urlParams.get('table');

		// Store table number in localStorage if present in URL
		if (tableParam) {
			localStorage.setItem('tableNumber', tableParam);
			console.log('Table number detected from QR:', tableParam);
		}

		if (restaurantParam || selectedRestaurant) {
			viewMode = 'menu';
			// Clear search when loading directly to menu
			searchInput = '';
		} else if (!isSuper && currentRestaurant) {
			// Non-super restaurants auto-select their own restaurant and show menu
			viewMode = 'menu';
			selectRestaurant(currentRestaurant);
			searchInput = '';
		} else {
			// Default to list view (for super restaurants)
			viewMode = 'list';
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

	// Search functionality - only for restaurant list
	function handleSearchSubmit(e: Event) {
		e.preventDefault();
		// Search is handled reactively via filteredRestaurants
		// Always ensure we're in list view when searching
		viewMode = 'list';
	}

	function clearSearch() {
		searchInput = '';
	}

	// Restaurant selection
	async function selectRestaurant(restaurant: any) {
		// Clear search when selecting a restaurant
		searchInput = '';
		selectedCategoryInput = 'All';
		viewMode = 'menu';
		await goto(`/?restaurant=${restaurant.id}#menu`);
	}

	async function backToRestaurants() {
		// Clear state when going back to list
		searchInput = '';
		selectedCategoryInput = 'All';
		viewMode = 'list';
		cleanupSubscriptions();
		await goto('/');
	}

	async function handleMenuRestaurantChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const restaurant = allRestaurants.find((r: any) => r.id === target.value);
		if (restaurant) {
			await selectRestaurant(restaurant);
		}
	}

	// Select restaurant from featured dish
	async function selectRestaurantFromDish(dish: any) {
		const restaurant = allRestaurants.find((r: any) => r.id === dish.restaurantId);
		if (restaurant) {
			await selectRestaurant(restaurant);
		}
	}

	// Category filter - client-side only
	function handleCategoryChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedCategoryInput = target.value;
	}

	// Cart functionality
	export const cart = writable<any[]>([]);

	// Optimistically add item to cart for instant UI update
	function addToCartOptimistic(
		dish: any,
		quantity: number,
		restaurantId: string,
		restaurantName: string
	) {
		const unitPrice = dish.promoAmount || dish.defaultAmount;

		cart.update((items) => {
			// Check if item already exists
			const existingIndex = items.findIndex(
				(item) =>
					(item.expand?.dish?.id || item.dish) === dish.id && item.restaurantId === restaurantId
			);

			if (existingIndex >= 0) {
				// Update quantity
				items[existingIndex].quantity += quantity;
				items[existingIndex].amount = items[existingIndex].quantity * unitPrice;
				return [...items];
			} else {
				// Add new item
				const newItem = {
					id: `temp-${Date.now()}`,
					dish: dish.id,
					quantity: quantity,
					amount: unitPrice * quantity,
					restaurantId: restaurantId,
					restaurantName: restaurantName,
					expand: {
						dish: {
							id: dish.id,
							name: dish.name,
							defaultAmount: dish.defaultAmount,
							promoAmount: dish.promoAmount,
							availability: dish.availability,
							image: dish.image
						}
					}
				};
				return [...items, newItem];
			}
		});
	}

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

			// Filter by restaurant if not a super restaurant
			const currentRestaurantId = $page.data.restaurantId;
			if (currentRestaurantId && !$page.data.isSuper) {
				const filteredRecords = records.filter((item: any) => {
					const itemRestaurantId = item.restaurant || item.restaurantId;
					return itemRestaurantId === currentRestaurantId;
				});
				cart.set(filteredRecords);
			} else {
				cart.set(records);
			}
		} catch (err) {
			console.error('Failed to fetch cart:', err);
		}
	}

	async function handleAddToCart(dish: any) {
		if (dish.availability !== 'Available') return;

		// Check location compatibility for super restaurants with multi-restaurant orders
		if (isSuper && $cart.length > 0) {
			const newRestaurant = allRestaurantsIncludingSuper.find(
				(r: any) => r.id === dish.restaurantId
			);
			if (newRestaurant) {
				const cartRestaurantIds = [
					...new Set($cart.map((item: any) => item.expand?.dish?.restaurantId || item.restaurantId))
				];

				for (const cartRestaurantId of cartRestaurantIds) {
					const cartRestaurant = allRestaurantsIncludingSuper.find(
						(r: any) => r.id === cartRestaurantId
					);
					if (cartRestaurant) {
						const newState = newRestaurant.state?.toLowerCase().trim();
						const cartState = cartRestaurant.state?.toLowerCase().trim();
						const newLGA = newRestaurant.localGovernment?.toLowerCase().trim();
						const cartLGA = cartRestaurant.localGovernment?.toLowerCase().trim();

						// Check if same state
						if (newState !== cartState) {
							locationMismatchMessage = `${newRestaurant.name} (${newRestaurant.state}) is in a different state from ${cartRestaurant.name} (${cartRestaurant.state}). Remove ${cartRestaurant.name} from cart to add ${newRestaurant.name}.`;
							locationMismatchAlert = true;
							setTimeout(() => {
								locationMismatchAlert = false;
							}, 6000);
							return;
						}

						// Check if same LGA (only if both have LGA defined)
						if (newLGA && cartLGA && newLGA !== cartLGA) {
							locationMismatchMessage = `${newRestaurant.name} (${newRestaurant.localGovernment} LGA) is in a different LGA from ${cartRestaurant.name} (${cartRestaurant.localGovernment} LGA). Remove ${cartRestaurant.name} from cart to add ${newRestaurant.name}.`;
							locationMismatchAlert = true;
							setTimeout(() => {
								locationMismatchAlert = false;
							}, 6000);
							return;
						}
					}
				}
			}
		}

		const quantity = Number(dishQuantities[dish.id] || 1);
		const restaurantName = getRestaurantNameForDish(dish);

		// Prevent rapid duplicate clicks for the SAME dish
		if (isAddingToCart.has(dish.id)) {
			return;
		}

		// Check if user is logged in first - if not, prompt them to login
		if (!$isLoggedIn) {
			cartErrorMessage = 'Please login to add items to cart';
			cartErrorAlert = true;
			setTimeout(() => {
				cartErrorAlert = false;
			}, 3000);
			return;
		}

		isAddingToCart.set(dish.id, true);
		lastAddedDishId = dish.id;

		// Show notification IMMEDIATELY for instant feedback
		addToCartAlert = true;
		setTimeout(() => {
			addToCartAlert = false;
		}, 2000);

		// Update cart UI IMMEDIATELY for instant feedback
		addToCartOptimistic(dish, quantity, dish.restaurantId, restaurantName);

		try {
			await addToCartPB(
				pb,
				dish.id,
				quantity,
				$user.id,
				dish.defaultAmount,
				dish.promoAmount,
				dish.restaurantId,
				restaurantName
			);

			await fetchCart();
		} catch (err) {
			console.error('Add to cart error:', err);
			addToCartAlert = false;
			// Even if there's an error, the item might have been added
			await fetchCart();
			const wasAdded = $cart.some((item: any) => item.dish === dish.id);
			if (wasAdded) {
				addToCartAlert = true;
				setTimeout(() => {
					addToCartAlert = false;
				}, 2500);
			} else {
				cartErrorMessage = 'Failed to add item. Please try again.';
				cartErrorAlert = true;
				setTimeout(() => {
					cartErrorAlert = false;
				}, 2500);
			}
		} finally {
			setTimeout(() => {
				isAddingToCart.delete(dish.id);
			}, 300);
		}
	}

	export async function clearCart(clearModal?: HTMLDialogElement) {
		const userId = $user?.id;
		if (!userId) return;

		isClearingCart = true;
		try {
			const items = await pb.collection('cart').getFullList({
				filter: `user="${userId}"`
			});

			await Promise.all(items.map((item) => pb.collection('cart').delete(item.id)));
			await fetchCart();

			clearModal?.close();
		} catch (err) {
			console.error('Failed to clear cart:', err);
		} finally {
			isClearingCart = false;
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
		// Filter by category and search
		let sourceDishes = dishes;

		if (selectedCategoryInput !== 'All') {
			sourceDishes = sourceDishes.filter((d: any) => d.category === selectedCategoryInput);
		}

		if (searchInput.trim()) {
			const query = searchInput.toLowerCase();
			sourceDishes = sourceDishes.filter(
				(d: any) =>
					d.name?.toLowerCase().includes(query) || d.description?.toLowerCase().includes(query)
			);
		}

		const groups: Record<string, typeof dishes> = {};
		for (const dish of sourceDishes) {
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
		// First try to get from expand data (use 'restaurant' as that's what we expand)
		if (dish.expand?.restaurant?.name) {
			return dish.expand.restaurant.name;
		}
		// Fallback: find in allRestaurants by restaurantId
		const restaurant = allRestaurants.find((r: any) => r.id === dish.restaurantId);
		if (restaurant?.name) {
			return restaurant.name;
		}
		// Final fallback
		return 'Unknown Restaurant';
	}
</script>

<!-- Cart FAB Icon -->
{#if $cart.length > 0}
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
		class="toast toast-top toast-center z-50"
		in:fly={{ y: -50, duration: 300 }}
		out:fly={{ y: -50, duration: 300 }}
	>
		<div class="alert gap-3 rounded-2xl border-0 bg-gray-900 px-5 py-3 text-white shadow-2xl">
			<div class="rounded-full bg-green-500/20 p-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-green-400"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div>
				<p class="text-sm font-semibold">Added to cart</p>
				<p class="text-xs text-gray-400">Item has been added successfully</p>
			</div>
		</div>
	</div>
{/if}

{#if cartErrorAlert}
	<div
		class="toast toast-top toast-center z-50"
		in:fly={{ y: -50, duration: 300 }}
		out:fly={{ y: -50, duration: 300 }}
	>
		<div class="alert gap-3 rounded-2xl border-0 bg-gray-900 px-5 py-3 text-white shadow-2xl">
			<div class="rounded-full bg-red-500/20 p-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-red-400"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div class="flex flex-col">
				<p class="text-sm font-semibold">{cartErrorMessage || 'Something went wrong'}</p>
				<p class="text-xs text-gray-400">{cartErrorMessage ? '' : 'Please try again'}</p>
				{#if cartErrorMessage === 'Please login to add items to cart'}
					<a
						href="/login"
						class="btn btn-sm btn-primary mt-2 self-start rounded-lg bg-blue-600 text-white hover:bg-blue-700"
					>
						Login
					</a>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if locationMismatchAlert}
	<div
		class="toast toast-top toast-center z-50"
		in:fly={{ y: -50, duration: 300 }}
		out:fly={{ y: -50, duration: 300 }}
	>
		<div
			class="alert max-w-md gap-3 rounded-2xl border-0 bg-gray-900 px-5 py-3 text-white shadow-2xl"
		>
			<div class="rounded-full bg-amber-500/20 p-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-amber-400"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div>
				<p class="text-sm font-semibold">Location Mismatch</p>
				<p class="text-xs text-gray-400">{locationMismatchMessage}</p>
			</div>
		</div>
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
		class="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
	>
		<!-- Background -->
		<div class="absolute inset-0 bg-gradient-to-b from-amber-50/80 to-white"></div>
		<div
			class="absolute inset-0 opacity-40"
			style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);"
		></div>

		<div class="relative z-10 mx-auto max-w-4xl">
			{#if $user?.name}
				<div
					class="mb-4 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800"
				>
					Welcome back, {$user.name}!
				</div>
			{/if}

			<h1
				class="font-playfair text-primary mb-6 text-5xl leading-tight font-bold sm:text-6xl lg:text-7xl"
				in:fly={{ y: -100, duration: 800 }}
			>
				{#if viewMode === 'menu' && selectedRestaurant}
					{selectedRestaurant.motto}
				{:else}
					Delicious Food<br /><span class="text-amber-600">Delivered Fast</span>
				{/if}
			</h1>
			<p class="text-base-content/70 mb-10 text-xl" in:fade={{ delay: 600, duration: 900 }}>
				{#if viewMode === 'menu' && selectedRestaurant}
					{selectedRestaurant.description}
				{:else}
					Order from your favorite restaurants and enjoy restaurant-quality meals delivered to your
					door
				{/if}
			</p>

			{#if viewMode !== 'menu' || !selectedRestaurant}
				<div
					class="flex flex-col items-center justify-center gap-4 sm:flex-row"
					in:fade={{ delay: 800, duration: 600 }}
				>
					<a
						href="#menu"
						class="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-amber-500/25"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="mr-2"><path d="M3 3h18v18H3zM12 8v8M8 12h8" /></svg
						>
						Order Now
					</a>
					<a href="#specials" class="btn btn-outline btn-secondary btn-lg rounded-full px-8">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="mr-2"
							><polygon
								points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
							/></svg
						>
						View Specials
					</a>
				</div>
			{/if}
		</div>

		<!-- Hero Image -->
		<div class="mt-12 w-full max-w-5xl" in:scale={{ duration: 1000, easing: cubicOut, delay: 300 }}>
			<div class="relative overflow-hidden rounded-3xl shadow-2xl shadow-amber-500/15">
				<img
					src={viewMode === 'menu' && selectedRestaurant
						? selectedRestaurant.logoUrl
						: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80'}
					alt={viewMode === 'menu' && selectedRestaurant
						? selectedRestaurant.name
						: 'Delicious Food'}
					class="h-[280px] w-full object-cover sm:h-[380px] lg:h-[420px]"
				/>
				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
				></div>
			</div>
		</div>

		<!-- Scroll indicator -->
		<div class="absolute bottom-6 left-1/2 -translate-x-1/2">
			<div
				class="flex h-10 w-6 items-start justify-center rounded-full border-2 border-amber-300 p-1"
			>
				<div class="h-2 w-1.5 animate-pulse rounded-full bg-amber-400"></div>
			</div>
		</div>
	</section>

	<!-- Today's Special -->
	{#if isLoading}
		<!-- Featured Dishes Skeleton -->
		<section class="bg-base-100 relative overflow-hidden py-20">
			<div class="container mx-auto px-6">
				<div class="mb-12 text-center">
					<div class="mx-auto mb-4 h-8 w-48 animate-pulse rounded-full bg-gray-300"></div>
					<div class="mx-auto h-12 w-64 animate-pulse rounded bg-gray-300"></div>
				</div>
				<div class="grid gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
					{#each [1, 2, 3, 4] as _}
						<div class="animate-pulse rounded-2xl bg-white p-4 shadow-lg">
							<div class="h-44 w-full rounded-2xl bg-gray-300"></div>
							<div class="mt-4 h-6 w-3/4 animate-pulse rounded bg-gray-300"></div>
							<div class="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-300"></div>
							<div class="mt-3 flex items-center justify-between">
								<div class="h-6 w-20 animate-pulse rounded bg-gray-300"></div>
								<div class="h-10 w-24 animate-pulse rounded-lg bg-gray-300"></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{:else if filteredFeaturedDishes.length > 0}
		<section id="specials" class="bg-base-100 relative overflow-hidden py-20">
			<!-- Decorative -->
			<div class="absolute top-16 -left-24 h-48 w-48 rounded-full bg-amber-200/20"></div>
			<div class="absolute -right-24 bottom-16 h-56 w-56 rounded-full bg-amber-100/30"></div>

			<div class="container mx-auto px-6">
				<div class="mb-12 text-center">
					<span
						class="mb-3 inline-block rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/30"
					>
						Hot & Ready
					</span>
					<h2 class="font-playfair text-primary mt-4 text-4xl font-bold sm:text-5xl">
						{selectedRestaurant ? `${selectedRestaurant.name} Specials` : "Today's Specials"}
					</h2>
					<p class="text-base-content/60 mt-3 text-lg">Handpicked dishes just for you</p>
				</div>

				<div class="container mx-auto px-6">
					<!-- Navigation Arrows -->
					<div class="relative">
						<!-- Left Arrow -->
						<button
							onclick={() => scrollSpecials('left')}
							class="absolute top-1/2 left-0 z-10 flex h-12 w-12 -translate-x-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:border-amber-500 hover:bg-amber-500 hover:text-white disabled:opacity-30"
							aria-label="Previous"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
							</svg>
						</button>

						<!-- Carousel Container -->
						<div
							bind:this={specialsContainer}
							class="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-14 pb-4"
							style="scrollbar-width: none; -ms-overflow-style: none;"
						>
							{#each filteredFeaturedDishes as dish}
								<div
									class="group w-72 shrink-0 cursor-pointer snap-start"
									onclick={() => selectRestaurantFromDish(dish)}
									onkeydown={(e) => e.key === 'Enter' && selectRestaurantFromDish(dish)}
									role="button"
									tabindex="0"
								>
									<article
										class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
									>
										<!-- Image -->
										<div class="relative h-48 shrink-0 overflow-hidden">
											<img
												src={dish.image}
												alt={dish.name}
												class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
											/>
											<!-- Gradient -->
											<div
												class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
											></div>

											<!-- Restaurant Tag - Only show for super restaurants -->
											{#if isSuper}
												<div class="absolute top-3 left-3">
													<span
														class="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-3 w-3"
															viewBox="0 0 24 24"
															fill="currentColor"
														>
															<path
																d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
															/>
														</svg>
														{getRestaurantNameForDish(dish)}
													</span>
												</div>
											{/if}

											<!-- Discount Badge -->
											{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
												<div class="absolute top-3 right-3">
													<span
														class="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg"
													>
														-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
													</span>
												</div>
											{/if}
										</div>

										<!-- Content -->
										<div class="flex flex-1 flex-col p-5">
											<h3
												class="font-playfair mb-2 text-lg leading-tight font-semibold text-slate-900 transition-colors group-hover:text-amber-600"
											>
												{dish.name}
											</h3>
											<p class="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-500">
												{dish.description}
											</p>

											<div class="mt-auto flex flex-col gap-3">
												<div class="flex items-baseline justify-between">
													{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
														<span class="text-xl font-bold text-amber-600">
															₦{Number(dish.promoAmount).toLocaleString()}
														</span>
														<span class="text-sm text-slate-400 line-through">
															₦{Number(dish.defaultAmount).toLocaleString()}
														</span>
													{:else}
														<span class="text-xl font-bold text-slate-900">
															₦{Number(dish.defaultAmount).toLocaleString()}
														</span>
													{/if}
												</div>
												<div class="flex items-center gap-2">
													{#if isSuper}
														<button
															class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-amber-500 text-amber-500 transition-all hover:bg-amber-500 hover:text-white"
															class:bg-amber-500={dishFavorites.includes(dish.id)}
															class:text-white={dishFavorites.includes(dish.id)}
															onclick={(e) => toggleDishFavorite(dish.id, e)}
															title={dishFavorites.includes(dish.id)
																? 'Remove from favorites'
																: 'Add to favorites'}
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="h-5 w-5"
																viewBox="0 0 24 24"
																fill={dishFavorites.includes(dish.id) ? 'currentColor' : 'none'}
																stroke="currentColor"
																stroke-width="2"
															>
																<path
																	d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
																/>
															</svg>
														</button>
													{/if}
													<button
														class="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-xl"
														onclick={(e) => {
															e.stopPropagation();
															handleAddToCart(dish);
														}}
													>
														Order
													</button>
												</div>
											</div>
										</div>
									</article>
								</div>
							{/each}
						</div>

						<!-- Right Arrow -->
						<button
							onclick={() => scrollSpecials('right')}
							class="absolute top-1/2 right-0 z-10 flex h-12 w-12 translate-x-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:border-amber-500 hover:bg-amber-500 hover:text-white disabled:opacity-30"
							aria-label="Next"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</div>

					<div class="mt-12 text-center">
						<a href="#menu" class="btn btn-outline btn-primary btn-lg rounded-full px-8">
							View Full Menu
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class="ml-2"><path d="M5 12h14M12 5l7 7-7 7" /></svg
							>
						</a>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- Floating Back Button -->
	{#if viewMode === 'menu' && selectedRestaurant}
		<div class="fixed top-24 left-4 z-40 md:top-28 md:left-6">
			<button
				onclick={() => {
					viewMode = 'list';
					// Remove restaurant from URL without refreshing
					const url = new URL(window.location.href);
					url.searchParams.delete('restaurant');
					url.searchParams.delete('category');
					url.hash = '';
					window.history.pushState({}, '', url.toString());
				}}
				class="group flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-xl"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 transition-transform group-hover:-translate-x-1"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				<span class="hidden sm:inline">Back</span>
			</button>
		</div>
	{/if}

	<!-- Search Section -->
	<section id="menu" class="container mx-auto mb-8 px-6 py-8">
		<div class="mb-12 text-center">
			<span
				class="mb-2 inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-700"
			>
				{#if viewMode === 'menu' && selectedRestaurant}
					Menu
				{:else}
					Explore
				{/if}
			</span>
			<h2
				class="font-playfair text-primary text-4xl font-bold sm:text-5xl"
				in:fly={{ x: -200, duration: 800 }}
			>
				{#if viewMode === 'menu' && selectedRestaurant}
					{selectedRestaurant.name}
				{:else}
					Our Restaurants
				{/if}
			</h2>
			{#if viewMode !== 'menu' || !selectedRestaurant}
				<p class="text-base-content/60 mt-3 text-lg">Discover your next favorite meal</p>
			{/if}
		</div>

		<!-- Menu View -->
		{#if viewMode === 'menu'}
			<!-- Search & Filters -->
			<div class="mx-auto mb-8 max-w-4xl">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
					<!-- Dish Search -->
					<div class="relative flex-1 sm:max-w-xs">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.3-4.3" />
						</svg>
						<input
							type="text"
							bind:value={searchInput}
							placeholder="Search dishes..."
							class="w-full rounded-xl border-0 bg-white py-3 pr-4 pl-12 placeholder-slate-400 shadow-lg shadow-slate-900/10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
						/>
						{#if searchInput}
							<button
								type="button"
								onclick={() => (searchInput = '')}
								class="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>

					<!-- Restaurant Dropdown - Only for super restaurants -->
					{#if isSuper}
						<div class="relative">
							<select
								value={menuRestaurantId}
								onchange={handleMenuRestaurantChange}
								class="appearance-none rounded-xl border-0 bg-white px-6 py-3 pr-10 text-base font-semibold shadow-lg shadow-slate-900/10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
							>
								<option value="">Select Restaurant</option>
								{#each allRestaurants as restaurant}
									<option value={restaurant.id}>{restaurant.name}</option>
								{/each}
							</select>
							<div class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
								<svg
									class="h-5 w-5 text-slate-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</div>
						</div>
					{/if}

					<!-- Category Filter -->
					<div class="relative">
						<select
							bind:value={selectedCategoryInput}
							onchange={handleCategoryChange}
							class="appearance-none rounded-xl border-0 bg-white px-6 py-3 pr-10 font-medium shadow-lg shadow-slate-900/10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
						>
							<option value="All">All Categories</option>
							{#each categories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
						<div class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
							<svg
								class="h-5 w-5 text-slate-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Restaurant Search for List View - Only for super restaurants -->
			{#if isSuper}
				<div class="mx-auto mb-8 max-w-2xl">
					<form onsubmit={handleSearchSubmit} class="relative">
						<div
							class="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-lg shadow-slate-900/10"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 shrink-0 text-slate-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="11" cy="11" r="8" />
								<path d="m21 21-4.3-4.3" />
							</svg>
							<input
								type="text"
								bind:value={searchInput}
								oninput={() => (viewMode = 'list')}
								placeholder="Search restaurants by name or location..."
								class="flex-1 bg-transparent text-slate-700 placeholder-slate-400 focus:outline-none"
							/>
							{#if searchInput}
								<button
									type="button"
									onclick={clearSearch}
									class="text-sm text-slate-500 hover:text-amber-600"
								>
									Clear
								</button>
							{/if}
						</div>
					</form>
				</div>
			{/if}
		{/if}
	</section>

	<!-- Restaurant List View - Only visible for super restaurants -->
	{#if viewMode === 'list' && isSuper}
		<section class="px-6">
			{#if isLoading}
				<!-- Restaurant List Skeleton -->
				<div class="mt-10 grid gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each [1, 2, 3, 4, 5, 6] as _}
						<div class="animate-pulse rounded-2xl bg-white p-6 shadow-lg">
							<div class="flex items-center gap-4">
								<div class="h-16 w-16 animate-pulse rounded-full bg-gray-300"></div>
								<div class="flex-1">
									<div class="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-300"></div>
									<div class="h-4 w-1/2 animate-pulse rounded bg-gray-300"></div>
								</div>
							</div>
							<div class="mt-4 h-4 w-full animate-pulse rounded bg-gray-300"></div>
							<div class="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-300"></div>
							<div class="mt-4 h-4 w-1/3 animate-pulse rounded bg-gray-300"></div>
							<div class="mt-6 h-10 w-full animate-pulse rounded-lg bg-gray-300"></div>
						</div>
					{/each}
				</div>
			{:else if searchInput && filteredRestaurants.length === 0}
				<p class="mt-10 text-center text-lg font-medium text-gray-500">
					❌ No restaurants found matching "<span class="text-yellow-600">{searchInput}</span>"
				</p>
			{:else}
				{#if searchInput && filteredRestaurants.length >= 1}
					<h3 class="mb-6 text-center">
						Showing results for <span class="text-gray-500">'{searchInput}'</span>
					</h3>
				{:else}
					<div class="mb-8 text-center">
						<span
							class="mb-2 inline-block rounded-full bg-slate-100 px-4 py-1 text-sm font-semibold text-slate-600"
						>
							Choose a Restaurant
						</span>
					</div>
				{/if}

				<!-- Restaurant Carousel -->
				<div class="relative mx-auto max-w-7xl pb-12">
					<!-- Left Arrow -->
					<button
						onclick={() => scrollRestaurants('left')}
						class="absolute top-1/2 left-0 z-10 flex h-12 w-12 -translate-x-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:border-amber-500 hover:bg-amber-500 hover:text-white disabled:opacity-30"
						aria-label="Previous restaurant"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>

					<!-- Carousel Container -->
					<div
						bind:this={restaurantsContainer}
						class="scrollbar-hide flex snap-x snap-mandatory gap-6 overflow-x-auto px-14 pb-4"
						style="scrollbar-width: none; -ms-overflow-style: none;"
					>
						{#each filteredRestaurants as r}
							<article
								class="group relative w-80 shrink-0 snap-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
							>
								<!-- Background Pattern -->
								<div class="absolute inset-0 opacity-5">
									<svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
										<pattern
											id="restaurant-pattern-{r.id}"
											width="20"
											height="20"
											patternUnits="userSpaceOnUse"
										>
											<circle cx="10" cy="10" r="1" fill="currentColor" />
										</pattern>
										<rect width="100" height="100" fill="url(#restaurant-pattern-{r.id})" />
									</svg>
								</div>

								<div class="relative p-6">
									<!-- Header -->
									<div class="mb-5 flex items-start gap-4">
										<div class="shrink-0">
											<img
												src={r.faviconUrl || r.logoUrl}
												alt={r.name}
												class="h-18 w-18 rounded-2xl border-2 border-slate-100 object-contain shadow-sm"
											/>
										</div>
										<div class="min-w-0 flex-1">
											<h2 class="font-playfair truncate text-xl font-bold text-slate-900">
												{r.name}
											</h2>
											{#if r.motto}
												<p class="mt-1 truncate text-sm font-medium text-amber-600">{r.motto}</p>
											{/if}
										</div>
									</div>

									<!-- Description -->
									{#if r.description}
										<p class="mb-5 line-clamp-3 text-sm leading-relaxed text-slate-600">
											{r.description}
										</p>
									{/if}

									<!-- Address -->
									{#if r.restaurantAddress}
										<div class="mb-5 flex items-start gap-2 text-sm text-slate-500">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
												<circle cx="12" cy="10" r="3" />
											</svg>
											<span class="line-clamp-2">{r.restaurantAddress}</span>
										</div>
									{/if}

									<!-- Action -->
									<button
										onclick={() => selectRestaurant(r)}
										class="group/btn mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-500/30 transition-all hover:from-slate-900 hover:to-slate-800 hover:shadow-xl"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 transition-transform group-hover/btn:translate-x-1"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
											<polyline points="10 17 15 12 10 7" />
											<line x1="15" x2="3" y1="12" y2="12" />
										</svg>
										View Menu
									</button>
								</div>
							</article>
						{/each}
					</div>

					<!-- Right Arrow -->
					<button
						onclick={() => scrollRestaurants('right')}
						class="absolute top-1/2 right-0 z-10 flex h-12 w-12 translate-x-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:border-amber-500 hover:bg-amber-500 hover:text-white disabled:opacity-30"
						aria-label="Next restaurant"
					>
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
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</button>
				</div>
			{/if}
		</section>
	{:else}
		<!-- Menu View -->
		{#if isLoading}
			<!-- Skeleton Loading for Dishes -->
			<div class="container mx-auto max-w-7xl px-4 py-6">
				<!-- Category Skeleton -->
				<div class="mb-10">
					<div class="mb-6 ml-4 h-8 w-32 animate-pulse rounded bg-gray-300"></div>
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each [1, 2, 3, 4, 5, 6] as _}
							<div class="animate-pulse rounded-xl bg-white p-4 shadow-lg">
								<div class="h-48 w-full rounded-lg bg-gray-300"></div>
								<div class="mt-4 h-6 w-3/4 animate-pulse rounded bg-gray-300"></div>
								<div class="mt-2 h-4 w-full animate-pulse rounded bg-gray-300"></div>
								<div class="mt-2 h-4 w-2/3 animate-pulse rounded bg-gray-300"></div>
								<div class="mt-4 flex items-center justify-between">
									<div class="h-6 w-20 animate-pulse rounded bg-gray-300"></div>
									<div class="h-10 w-28 animate-pulse rounded-lg bg-gray-300"></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{:else if !selectedRestaurant}
			<!-- No restaurant selected, show prompt -->
			<div class="py-20 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-slate-300"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 3h18v18H3V3z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v8M8 12h8" />
				</svg>
				<p class="mt-4 text-lg text-slate-600">Please select a restaurant to view its menu</p>
				{#if isSuper}
					<button
						onclick={() => (viewMode = 'list')}
						class="mt-4 rounded-xl bg-amber-500 px-6 py-2.5 font-semibold text-white"
					>
						Browse Restaurants
					</button>
				{/if}
			</div>
		{:else if Object.keys(groupedDishes).length === 0}
			<p class="mt-6 py-12 text-center text-gray-500">
				{#if searchInput.trim()}
					No dishes found matching "{searchInput}"
				{:else if selectedCategoryInput !== 'All'}
					No dishes found in {selectedCategoryInput} category.
				{:else}
					No dishes available.
				{/if}
			</p>
		{:else}
			{#each Object.entries(groupedDishes).sort( (a, b) => a[0].localeCompare(b[0]) ) as [category, dishesInCategory]}
				<section class="mb-10 p-6">
					<div class="text-secondary mb-6 ml-4 w-fit text-3xl">
						<h3 class="font-semibold">{category}</h3>
						<div class="border-2 underline"></div>
					</div>

					<Carousel>
						{#each dishesInCategory as dish}
							<div class="group w-80 shrink-0 snap-start" in:fly={{ y: 50, duration: 600 }}>
								<article
									class="relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
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
									<!-- Image Container -->
									<div class="relative h-56 overflow-hidden">
										<img
											src={dish.image}
											alt={dish.name}
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
										/>
										<!-- Gradient Overlay -->
										<div
											class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
										></div>

										<!-- Restaurant Tag - Only show for super restaurants -->
										{#if isSuper}
											<div class="absolute top-3 left-3">
												<span
													class="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-3.5 w-3.5"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
														<path d="M7 2v20" />
														<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
													</svg>
													{getRestaurantNameForDish(dish)}
												</span>
											</div>
										{/if}

										<!-- Discount Badge -->
										{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
											<div class="absolute top-3 right-3">
												<span
													class="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg"
												>
													-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
												</span>
											</div>
										{/if}

										<!-- Availability Badge -->
										<div class="absolute right-3 bottom-3">
											{#if dish.availability === 'Available'}
												<span
													class="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-sm"
												>
													Available
												</span>
											{:else if dish.availability === 'Unavailable'}
												<span
													class="rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-sm"
												>
													Unavailable
												</span>
											{/if}
										</div>
									</div>

									<!-- Content -->
									<div class="flex flex-1 flex-col p-5">
										<!-- Title -->
										<h4
											class="font-playfair mb-2 text-xl leading-tight font-semibold text-slate-900 transition-colors group-hover:text-amber-600"
										>
											{dish.name}
										</h4>

										<!-- Description -->
										<p class="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-500">
											{dish.description}
										</p>

										<!-- Spacer -->
										<div class="mt-auto">
											<!-- Price -->
											<div class="mb-4 flex items-baseline gap-2">
												{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
													<span class="text-2xl font-bold text-amber-600">
														₦{Number(dish.promoAmount).toLocaleString()}
													</span>
													<span class="text-sm text-slate-400 line-through">
														₦{Number(dish.defaultAmount).toLocaleString()}
													</span>
												{:else}
													<span class="text-2xl font-bold text-slate-900">
														₦{Number(dish.defaultAmount).toLocaleString()}
													</span>
												{/if}
											</div>

											<!-- Quantity & Add to Cart -->
											<div class="mt-auto flex flex-wrap items-center justify-between gap-3">
												<!-- Quantity Selector -->
												<div class="flex items-center gap-2 rounded-full bg-slate-100 p-1">
													<button
														onclick={(e) => {
															e.stopPropagation();
															updateDishQuantity(dish.id, -1);
														}}
														disabled={(dishQuantities[dish.id] ?? 1) <= 1 ||
															dish.availability !== 'Available'}
														class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-amber-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-4 w-4"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2.5"
														>
															<path d="M5 12h14" />
														</svg>
													</button>
													<span class="w-8 text-center font-semibold text-slate-800">
														{dishQuantities[dish.id] || 1}
													</span>
													<button
														onclick={(e) => {
															e.stopPropagation();
															updateDishQuantity(dish.id, 1);
														}}
														disabled={dish.availability !== 'Available'}
														class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all hover:bg-amber-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-4 w-4"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2.5"
														>
															<path d="M12 5v14M5 12h14" />
														</svg>
													</button>
												</div>

												<!-- Favorite Button (Super restaurants only) -->
												{#if isSuper}
													<button
														class="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-amber-500 text-amber-500 transition-all hover:bg-amber-500 hover:text-white"
														class:bg-amber-500={dishFavorites.includes(dish.id)}
														class:text-white={dishFavorites.includes(dish.id)}
														onclick={(e) => toggleDishFavorite(dish.id, e)}
														title={dishFavorites.includes(dish.id)
															? 'Remove from favorites'
															: 'Add to favorites'}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															class="h-5 w-5"
															viewBox="0 0 24 24"
															fill={dishFavorites.includes(dish.id) ? 'currentColor' : 'none'}
															stroke="currentColor"
															stroke-width="2"
														>
															<path
																d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
															/>
														</svg>
													</button>
												{/if}

												<!-- Add to Cart Button -->
												<button
													class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
													onclick={(e) => {
														e.stopPropagation();
														handleAddToCart(dish);
													}}
													disabled={dish.availability !== 'Available'}
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<circle cx="9" cy="21" r="1" />
														<circle cx="20" cy="21" r="1" />
														<path
															d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
														/>
													</svg>
													Add
												</button>
											</div>
										</div>
									</div>
								</article>
							</div>
						{/each}
					</Carousel>
				</section>
			{/each}
		{/if}
	{/if}
</div>

<!-- Cart Drawer -->
{#if $cart.length > 0 || (viewMode === 'menu' && selectedRestaurant && $isLoggedIn)}
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
														{item.restaurantName ||
															allRestaurants.find(
																(r: any) => r.id === item.expand.dish.restaurantId
															)?.name ||
															'Restaurant'}
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
											<!-- svelte-ignore a11y_consider_explicit_label -->
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
				<button onclick={() => clearModal.close()} class="btn btn-ghost" disabled={isClearingCart}
					>Cancel</button
				>
				<button
					onclick={() => clearCart(clearModal)}
					class="btn btn-error"
					disabled={isClearingCart}
				>
					{#if isClearingCart}
						<svg
							class="mr-2 h-4 w-4 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Clearing...
					{:else}
						Clear All
					{/if}
				</button>
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
{:else if $cart.length > 0 || (viewMode === 'menu' && selectedRestaurant)}
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

<div class="bottom-0 z-2">
	<Footer restaurant={$page.data.restaurant} />
</div>

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
