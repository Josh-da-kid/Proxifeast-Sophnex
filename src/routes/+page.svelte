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
	import HeroCarousel from '$lib/HeroCarousel.svelte';
	import {
		cart as sharedCart,
		total as cartTotal,
		fetchCart as fetchSharedCart
	} from '$lib/stores/cart';

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
	const user = derived(page, ($page) => $page.data.user);

	// Loading state
	let isLoading = $state(true);

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

	// Helper function to check if restaurant is open
	function isRestaurantOpen(restaurant: any): boolean {
		if (!restaurant.openingTime || !restaurant.closingTime) return true; // Always open if no times set

		const now = currentTime;
		const currentMinutes = now.getHours() * 60 + now.getMinutes();

		const [openHour, openMin] = restaurant.openingTime.split(':').map(Number);
		const [closeHour, closeMin] = restaurant.closingTime.split(':').map(Number);

		const openTime = openHour * 60 + openMin;
		const closeTime = closeHour * 60 + closeMin;

		return currentMinutes >= openTime && currentMinutes <= closeTime;
	}

	// Helper function to check if restaurant is closing soon (within 30 minutes)
	function isRestaurantClosingSoon(restaurant: any): {
		closingSoon: boolean;
		minutesUntilClose: number;
	} {
		if (!restaurant.closingTime) return { closingSoon: false, minutesUntilClose: 0 };

		const now = currentTime;
		const currentMinutes = now.getHours() * 60 + now.getMinutes();

		const [closeHour, closeMin] = restaurant.closingTime.split(':').map(Number);
		const closeTime = closeHour * 60 + closeMin;

		const minutesUntilClose = closeTime - currentMinutes;

		return {
			closingSoon: minutesUntilClose > 0 && minutesUntilClose <= 30,
			minutesUntilClose
		};
	}

	// Helper function to check if restaurant is new (within 7 days)
	function isRestaurantNew(restaurant: any): boolean {
		if (!restaurant.created) return false;

		const created = new Date(restaurant.created);
		const now = new Date();
		const diffTime = now.getTime() - created.getTime();
		const diffDays = diffTime / (1000 * 60 * 60 * 24);

		return diffDays <= 7;
	}

	// Helper function to format time
	function formatTime(time: string): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		const h = parseInt(hours);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const h12 = h % 12 || 12;
		return `${h12}:${minutes} ${ampm}`;
	}

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

	// Closed restaurant warning modal
	let closedRestaurantWarning = $state(false);
	let closedRestaurantInfo = $state<{
		name: string;
		openingTime: string;
		closingTime: string;
		isClosed: boolean;
		closingSoon: boolean;
		minutesUntilClose: number;
		dish: any;
		quantity: number;
		restaurantId: string;
		restaurantName: string;
	} | null>(null);

	// Dish favorites state (for super restaurants)
	let dishFavorites = $state<string[]>([]);

	// Current time for reactive updates (updates every minute)
	let currentTime = $state(new Date());
	let timeInterval: ReturnType<typeof setInterval>;
	let restaurantSubscription: any;

	// Load dish favorites on mount (for super restaurants)
	$effect(() => {
		if (isSuper && $isLoggedIn) {
			loadDishFavorites();
		}
	});

	// Update current time every second for exact closing times
	onMount(() => {
		// Update time every second for precise status checks at exact closing/opening times
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		// Subscribe to restaurant changes for real-time updates
		async function subscribeToRestaurants() {
			try {
				console.log('Setting up restaurant subscription...');
				restaurantSubscription = await pb.collection('restaurants').subscribe('*', (e) => {
					console.log('Restaurant event received:', e.action, e.record?.id);
					// Update current time to trigger re-render
					currentTime = new Date();
					// Also invalidate data
					invalidateAll();
				});
				console.log('Restaurant subscription set up successfully');
			} catch (err) {
				console.error('Failed to subscribe to restaurants:', err);
			}
		}

		subscribeToRestaurants();

		// Fallback: periodically refresh data every 30 seconds
		const fallbackInterval = setInterval(() => {
			console.log('Fallback: refreshing restaurant data...');
			currentTime = new Date();
			invalidateAll();
		}, 30000);

		return () => {
			if (timeInterval) clearInterval(timeInterval);
			if (fallbackInterval) clearInterval(fallbackInterval);
			if (restaurantSubscription) {
				pb.collection('restaurants').unsubscribe('*');
			}
		};
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

		// Subscribe to restaurant changes for real-time opening/closing time updates
		if (!restaurantSubscription) {
			restaurantSubscription = await pb
				.collection('restaurants')
				.subscribe('*', async ({ action, record }) => {
					if (action === 'update') {
						console.log('Restaurant updated via subscription:', record.id);
						// Invalidate to refresh data from server
						await invalidateAll();
						// Update current time to trigger re-render
						currentTime = new Date();
					}
				});
		}
	}

	function cleanupSubscriptions() {
		unsubscribeDish?.();
		unsubscribeCart?.();
		if (restaurantSubscription) {
			pb.collection('restaurants').unsubscribe('*');
			restaurantSubscription = null;
		}
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
		window.location.href = `/restaurants/${restaurant.id}`;
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

	// Cart functionality - use shared cart
	export const cart = sharedCart;
	export const total = cartTotal;

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

	export async function fetchCart() {
		const userId = $user?.id;
		await fetchSharedCart(undefined, userId);
	}

	async function handleAddToCart(dish: any) {
		if (dish.availability !== 'Available') return;

		// Check if restaurant is open or closing soon
		const restaurant = allRestaurantsIncludingSuper.find((r: any) => r.id === dish.restaurantId);
		if (restaurant) {
			const isOpen = isRestaurantOpen(restaurant);
			const { closingSoon, minutesUntilClose } = isRestaurantClosingSoon(restaurant);

			// Show warning modal if closed OR closing soon
			if (!isOpen || closingSoon) {
				closedRestaurantInfo = {
					name: restaurant.name,
					openingTime: restaurant.openingTime || 'Unknown',
					closingTime: restaurant.closingTime || 'Unknown',
					isClosed: !isOpen,
					closingSoon: closingSoon,
					minutesUntilClose: minutesUntilClose,
					dish: dish,
					quantity: Number(dishQuantities[dish.id] || 1),
					restaurantId: dish.restaurantId,
					restaurantName: getRestaurantNameForDish(dish)
				};
				closedRestaurantWarning = true;
				return;
			}
		}

		// Proceed with normal add to cart
		await addToCartWithWarning(dish, Number(dishQuantities[dish.id] || 1));
	}

	async function addToCartWithWarning(dish: any, quantity: number) {
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

<!-- Cart FAB / WhatsApp Button -->
{#if $cart.length > 0}
	<!-- Cart Icon -->
	<label for="my-drawer-5">
		<div
			class="tooltip indicator bg-secondary fixed right-4 bottom-22 z-10 cursor-pointer rounded-full p-4 text-white shadow-xl transition-transform duration-300 hover:scale-105 md:right-6 md:bottom-24"
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
{:else}
	<!-- WhatsApp Icon -->
	<a
		href="https://wa.me/2347068346403?text=Hello%20Proxifeast,%20I%20need%20assistance%20with%20my%20order."
		target="_blank"
		rel="noopener noreferrer"
		class="tooltip fixed right-4 bottom-22 z-40 md:right-6 md:bottom-24"
		data-tip="Contact us on WhatsApp"
	>
		<div
			class="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-110 hover:bg-green-600"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<path
					d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
				/>
			</svg>
		</div>
	</a>
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

<!-- Closed Restaurant Warning Modal -->
{#if closedRestaurantWarning && closedRestaurantInfo}
	<div class="toast toast-top toast-center z-50" in:fly={{ y: -50, duration: 300 }}>
		<div
			class="alert max-w-md gap-3 rounded-2xl border-0 bg-gray-900 px-5 py-4 text-white shadow-2xl"
		>
			<div
				class="rounded-full {closedRestaurantInfo.isClosed
					? 'bg-red-500/20'
					: 'bg-amber-500/20'} p-1.5"
			>
				{#if closedRestaurantInfo.isClosed}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-red-400"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="15" y1="9" x2="9" y2="15" />
						<line x1="9" y1="9" x2="15" y2="15" />
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-amber-400"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
				{/if}
			</div>
			<div class="flex-1">
				{#if closedRestaurantInfo.isClosed}
					<p class="text-sm font-semibold">{closedRestaurantInfo.name} is currently closed</p>
					<p class="text-xs text-gray-400">Opens at {closedRestaurantInfo.openingTime}</p>
					<p class="mt-1 text-xs text-amber-400">
						You can still add to cart but won't be able to checkout until they open.
					</p>
				{:else}
					<p class="text-sm font-semibold">{closedRestaurantInfo.name} is closing soon!</p>
					<p class="text-xs text-gray-400">Closes at {closedRestaurantInfo.closingTime}</p>
					<p class="mt-1 text-xs text-amber-400">
						Only {closedRestaurantInfo.minutesUntilClose} minutes left! Order now before they close.
					</p>
				{/if}
			</div>
			<div class="flex flex-col gap-2">
				<button
					class="btn btn-sm border-0 {closedRestaurantInfo.isClosed
						? 'bg-red-500 hover:bg-red-600'
						: 'bg-amber-500 hover:bg-amber-600'} text-white"
					onclick={() => {
						closedRestaurantWarning = false;
						addToCartWithWarning(closedRestaurantInfo.dish, closedRestaurantInfo.quantity);
					}}
				>
					Add Anyway
				</button>
				<button
					class="btn btn-sm btn-ghost text-gray-400"
					onclick={() => {
						closedRestaurantWarning = false;
						closedRestaurantInfo = null;
					}}
				>
					Cancel
				</button>
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

	<!-- Custom Restaurant Hero (When a specific restaurant is selected) -->
	{#if selectedRestaurant}
		<!-- Restaurant Banner -->
		<div class="relative h-[50vh] bg-slate-900 md:h-[60vh]">
			{#if selectedRestaurant.bannerUrl}
				<img
					src={selectedRestaurant.bannerUrl}
					alt={selectedRestaurant.name}
					class="absolute inset-0 h-full w-full object-cover"
				/>
			{:else if selectedRestaurant.imageUrl}
				<img
					src={selectedRestaurant.imageUrl}
					alt={selectedRestaurant.name}
					class="absolute inset-0 h-full w-full object-cover"
				/>
			{:else}
				<div
					class="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"
				></div>
			{/if}
			<!-- Gradient Overlay - stronger for better text contrast -->
			<div
				class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent"
			></div>

			<!-- Restaurant Info Overlay -->
			<div class="absolute right-0 bottom-0 left-0 p-6 md:p-10">
				<div class="mx-auto max-w-5xl">
					<!-- Category Tag -->
					{#if selectedRestaurant.category}
						<span
							class="mb-3 inline-block rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg"
						>
							{selectedRestaurant.category}
						</span>
					{/if}

					<!-- Restaurant Name -->
					<h1
						class="font-playfair mb-2 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
						style="color: #ffffff !important;"
					>
						{selectedRestaurant.name}
					</h1>

					<!-- Motto -->
					{#if selectedRestaurant.motto}
						<p class="mb-4 text-lg" style="color: #e5e7eb !important;">
							{selectedRestaurant.motto}
						</p>
					{/if}

					<!-- Quick Info -->
					<div class="flex flex-wrap items-center gap-4 text-sm" style="color: #d1d5db !important;">
						<!-- Open/Closed Status -->
						<div class="flex items-center gap-2">
							<span
								class="h-2.5 w-2.5 rounded-full {isRestaurantOpen(selectedRestaurant)
									? 'bg-green-400'
									: 'bg-red-400'} animate-pulse"
							></span>
							<span
								class="font-medium {isRestaurantOpen(selectedRestaurant)
									? 'text-green-400'
									: 'text-red-400'}"
								style={isRestaurantOpen(selectedRestaurant)
									? 'color: #4ade80 !important;'
									: 'color: #f87171 !important;'}
							>
								{isRestaurantOpen(selectedRestaurant) ? 'Open Now' : 'Closed'}
							</span>
						</div>

						<!-- Opening Hours -->
						{#if selectedRestaurant.openingTime || selectedRestaurant.closingTime}
							<div class="flex items-center gap-1.5">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
									style="color: #9ca3af !important;"
								>
									<circle cx="12" cy="12" r="10" />
									<polyline points="12 6 12 12 16 14" />
								</svg>
								<span style="color: #d1d5db !important;">
									{selectedRestaurant.openingTime
										? formatTime(selectedRestaurant.openingTime)
										: '24/7'} - {selectedRestaurant.closingTime
										? formatTime(selectedRestaurant.closingTime)
										: '24/7'}
								</span>
							</div>
						{/if}

						<!-- Address -->
						{#if selectedRestaurant.restaurantAddress}
							<div class="flex items-center gap-1.5">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
									style="color: #9ca3af !important;"
								>
									<path d="M21 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
								<span class="line-clamp-1 max-w-xs" style="color: #d1d5db !important;"
									>{selectedRestaurant.restaurantAddress}</span
								>
							</div>
						{/if}
					</div>

					<!-- CTA Button -->
					<div class="mt-6">
						<a
							href="#menu"
							class="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:shadow-xl md:text-base"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
								/>
							</svg>
							Browse Menu
						</a>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Hero Carousel (Super Restaurants) -->
		<HeroCarousel
			slides={[
				{
					id: 1,
					image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
					imageMobile: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
					title: 'Delicious Food Delivered Fast',
					description:
						'Order from your favorite restaurants and enjoy restaurant-quality meals delivered to your doorstep.',
					primaryBtn: { text: 'Order Now', href: '#menu' },
					secondaryBtn: { text: 'Browse Restaurants', href: '/restaurants' }
				},
				{
					id: 2,
					image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
					imageMobile: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
					title: 'Discover Local Favorites',
					description:
						'Explore the best restaurants in your area and discover new culinary experiences.',
					primaryBtn: { text: 'Explore Now', href: '/restaurants' },
					secondaryBtn: { text: 'Learn More', href: '/about' }
				},
				{
					id: 3,
					image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80',
					imageMobile: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
					title: 'Start Your Restaurant Business',
					description:
						'Join thousands of restaurants using Proxifeast to grow their delivery business.',
					primaryBtn: {
						text: $isLoggedIn ? 'View Plans' : 'Get Started Free',
						href: $isLoggedIn ? '/subscriptions' : '/signup'
					},
					secondaryBtn: { text: 'Learn More', href: '/about' }
				}
			]}
			autoplay={true}
			autoplayDelay={6000}
			speed={800}
			navigation={true}
			pagination={true}
			fadeEffect={true}
		/>
	{/if}

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
					<Carousel showArrows={true} showDots={true} autoplay={true} autoplayDelay={5000}>
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
											class="font-playfair mb-2 text-lg leading-tight font-semibold text-white transition-colors group-hover:text-amber-400"
										>
											{dish.name}
										</h3>
										<p class="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-500">
											{dish.description}
										</p>

										<div class="mt-auto flex flex-col gap-3">
											<div class="flex items-baseline justify-between">
												{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
													<span class="text-xl font-bold text-amber-400">
														₦{Number(dish.promoAmount).toLocaleString()}
													</span>
													<span class="text-sm text-gray-400 line-through">
														₦{Number(dish.defaultAmount).toLocaleString()}
													</span>
												{:else}
													<span class="text-xl font-bold text-white">
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
					</Carousel>

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
					Featured Restaurants on Proxifeast
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
				<Carousel showArrows={true} showDots={true} autoplay={true} autoplayDelay={6000}>
					{#each filteredRestaurants as r}
						{@const isOpen = isRestaurantOpen(r)}
						{@const isNew = isRestaurantNew(r)}
						<article
							class="group relative flex w-80 shrink-0 snap-start flex-col overflow-hidden rounded-xl border {isOpen
								? 'border-slate-200'
								: 'border-red-200'} bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
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

							<!-- New Tag -->
							{#if isNew}
								<div class="absolute top-4 right-0 z-10">
									<span
										class="rounded-l-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-md"
									>
										NEW
									</span>
								</div>
							{/if}

							<!-- Open/Closed Tag -->
							<div class="absolute top-4 left-0 z-10">
								<span
									class="rounded-r-full {isOpen
										? 'bg-green-500'
										: 'bg-red-500'} px-3 py-1 text-xs font-bold text-white shadow-md"
								>
									{isOpen ? 'OPEN' : 'CLOSED'}
								</span>
							</div>

							<div class="relative flex flex-col p-6">
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

								<!-- Opening Hours -->
								{#if r.openingTime || r.closingTime}
									<div class="mb-4 flex items-center gap-2 text-sm">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 {isOpen ? 'text-green-500' : 'text-red-500'}"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<circle cx="12" cy="12" r="10" />
											<polyline points="12 6 12 12 16 14" />
										</svg>
										<span class="{isOpen ? 'text-green-600' : 'text-red-600'} font-medium">
											{#if isOpen}
												Open • {formatTime(r.openingTime)} - {formatTime(r.closingTime)}
											{:else}
												Closed • Opens at {formatTime(r.openingTime)}
											{/if}
										</span>
									</div>
								{/if}

								<!-- Action -->
								<button
									onclick={() => isOpen && selectRestaurant(r)}
									disabled={!isOpen}
									class="group/btn mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl {isOpen
										? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-500/30 transition-all hover:from-slate-900 hover:to-slate-800 hover:shadow-xl'
										: 'cursor-not-allowed bg-slate-200 text-slate-400'} px-5 py-3.5 text-sm font-semibold"
								>
									{#if isOpen}
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
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M18 6 6 18" />
											<path d="m6 6 12 12" />
										</svg>
										Closed
									{/if}
								</button>
							</div>
						</article>
					{/each}
				</Carousel>
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

				<!-- WhatsApp Button in Cart Drawer -->
				<div class="border-base-200 border-t p-4">
					<a
						href="https://wa.me/2347068346403?text=Hello%20Proxifeast,%20I%20need%20assistance%20with%20my%20order."
						target="_blank"
						rel="noopener noreferrer"
						class="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-medium text-white transition-all hover:bg-green-600"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
							/>
						</svg>
						Contact on WhatsApp
					</a>
				</div>
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

					<!-- WhatsApp Button in Cart Drawer (Not Logged In) -->
					<div class="border-base-200 border-t p-4">
						<a
							href="https://wa.me/2347068346403?text=Hello%20Proxifeast,%20I%20need%20assistance%20with%20my%20order."
							target="_blank"
							rel="noopener noreferrer"
							class="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-medium text-white transition-all hover:bg-green-600"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path
									d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
								/>
							</svg>
							Contact on WhatsApp
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
