<script lang="ts">
	import { writable, derived, get } from 'svelte/store';
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import pb from '$lib/pb';
	import { goto } from '$app/navigation';
	import { fly, slide, fade } from 'svelte/transition';

	export const ssr = false;
	export const prerender = false;
	// Custom SVG Icons
	const iconArrowLeft = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
	const iconShoppingBag = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
	const iconCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
	const iconUtensilsCrossed = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8V2h-6z"/><path d="m17 11-1.3 1.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0l2.3-2.3V11h-7z"/><path d="m5 11-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L11 17V11H5z"/><path d="m5 2 1.8 1.8a3 3 0 0 1 0 4.2L5 9.8A3 3 0 0 1 .8 9.8L2 8V2h3z"/></svg>`;
	const iconPackage = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
	const iconHome = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
	const iconHash = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>`;
	const iconMapPin = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
	const iconPhone = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>`;
	const iconLock = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
	const iconShield = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;
	const iconCreditCard = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;
	const iconAlertCircle = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
	const iconInfo = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
	const iconChevronDown = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
	const iconTrash2 = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
	const iconPlus = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
	const iconMinus = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>`;
	const iconReceipt = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6"/><path d="M16 12h-6"/><path d="M16 16h-6"/></svg>`;
	const iconClock = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
	const iconStore = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2.5"/><path d="M2 17.5a.5.5 0 0 1 .5-.5h19a.5.5 0 0 1 .5.5v1a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5Z"/><path d="m4 7.5 1.6 6.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L20 7.5"/></svg>`;

	const paystackKey = derived(page, ($page) => {
		const restaurant = $page.data.restaurant;
		if (!restaurant) return undefined;
		return restaurant.paystackKey || undefined;
	});
	const allRestaurants = derived(page, ($page) => $page.data.allRestaurants ?? []);
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
	export const user = derived(page, ($page) => $page.data.user);
	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	let deleteModal: HTMLDialogElement;
	let clearModal: HTMLDialogElement;
	let dishToDelete: any = $state(null);
	let loading = $state(true);
	let showDetails = $state(false);
	let unsubscribeDish: () => void;
	let unsubscribeCart: () => void;

	function groupCartByRestaurant(cartItems: any[]) {
		const grouped = new Map();
		cartItems.forEach((item) => {
			const restaurantId = item.expand?.dish?.restaurantId || item.restaurantId;
			if (!grouped.has(restaurantId)) {
				grouped.set(restaurantId, []);
			}
			grouped.get(restaurantId).push(item);
		});
		return grouped;
	}

	function getRestaurantName(restaurantId: string, restaurantName?: string) {
		return (
			restaurantName ||
			$allRestaurants.find((r: any) => r.id === restaurantId)?.name ||
			'Restaurant'
		);
	}

	async function setupSubscriptions() {
		if (!get(user)?.id) return;
		unsubscribeDish = await pb.collection('dishes').subscribe('*', async ({ action, record }) => {
			if (action === 'update') {
				const isDishInCart = get(cart).some((item) => item.dish === record.id);
				if (isDishInCart) await fetchCart();
			}
		});
		unsubscribeCart = await pb.collection('cart').subscribe('*', async ({ action, record }) => {
			if (record.user === get(user).id) await fetchCart();
		});
	}

	function cleanupSubscriptions() {
		unsubscribeDish?.();
		unsubscribeCart?.();
	}

	export async function fetchCart() {
		try {
			const currentUser = get(user);
			const userId = currentUser?.id;

			if (!userId) {
				console.log('No user logged in');
				loading = false;
				return;
			}

			const records = await pb.collection('cart').getFullList({
				filter: `user="${userId}"`,
				expand: 'dish'
			});
			cart.set(records);
		} catch (err) {
			console.error('Failed to fetch cart:', err);
		} finally {
			loading = false;
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

	export async function clearCart() {
		const userId = get(user)?.id;
		if (!userId) return;
		try {
			const items = await pb.collection('cart').getFullList({ filter: `user="${userId}"` });
			await Promise.all(items.map((item) => pb.collection('cart').delete(item.id)));
			await fetchCart();
			clearModal?.close();
		} catch (err) {
			console.error('Failed to clear cart:', err);
		}
	}

	async function updateQuantity({
		itemId,
		newQty,
		promoAmount,
		defaultAmount
	}: {
		itemId: string;
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
			await pb.collection('cart').update(itemId, { quantity: newQty, amount: unitPrice * newQty });
			await fetchCart();
		} catch (err) {
			console.error('Failed to update quantity:', err);
		}
	}

	onMount(() => {
		fetchCart();
		setupSubscriptions();

		// Safety timeout - ensure loading is false after 5 seconds
		const timeout = setTimeout(() => {
			if (loading) {
				console.log('Safety timeout - setting loading to false');
				loading = false;
			}
		}, 5000);

		return () => clearTimeout(timeout);
	});
	onDestroy(() => {
		cleanupSubscriptions();
	});

	let deliveryOption = $state('');
	let phone = $state('');
	let prefix = $state('+234');
	let tableNumber = $state('');
	let homeAddress = $state('');
	let hour = $state('12');
	let minutes = $state('00');
	let meridian = $state('PM');
	let pickupTime = $derived(`${hour}:${minutes} ${meridian}`);
	const formattedPhone = $derived(`${prefix}${phone}`);
	let email = $state('');
	let amount = $state(0);

	// Delivery fees state - Map<restaurantId, { fee, distance, restaurantName }>
	let deliveryFees = $state(
		new Map<
			string,
			{
				canDeliver: boolean;
				fees: {
					deliveryFee: number;
					deliveryTier: string;
					serviceFee: number;
					smallOrderFee: number;
					total: number;
				};
				distance: number;
				restaurantName: string;
				customerState: string;
				restaurantState: string;
				error?: string;
			}
		>()
	);
	let calculatingDeliveryFees = $state(false);
	let deliveryFeeError = $state('');
	let customerState = $state('');
	let mixedStateError = $state('');

	// Calculate total fees (delivery + service + small order)
	const totalDeliveryFee = $derived(() => {
		let total = 0;
		deliveryFees.forEach((data) => {
			if (data.canDeliver && data.fees) {
				total += data.fees.total;
			}
		});
		return total;
	});

	// Calculate total food subtotal
	const foodSubtotal = $derived(() => {
		return get(total);
	});

	// Calculate grand total (food + all fees)
	const grandTotal = $derived(() => {
		return foodSubtotal() + totalDeliveryFee();
	});

	// Check if all restaurants are from the same state as customer
	const hasMixedStates = $derived(() => {
		const states = new Set<string>();
		deliveryFees.forEach((data) => {
			if (data.restaurantState) {
				states.add(data.restaurantState);
			}
		});
		return states.size > 1;
	});

	// Check if any restaurant cannot deliver
	const hasDeliveryRestrictions = $derived(() => {
		let hasErrors = false;
		deliveryFees.forEach((data) => {
			if (!data.canDeliver) {
				hasErrors = true;
			}
		});
		return hasErrors;
	});

	// Check if cart has items from multiple restaurants (for table service restriction)
	const uniqueRestaurantsCount = $derived(() => {
		const unique = new Set(
			get(cart).map((item) => item.expand?.dish?.restaurantId || item.restaurantId)
		);
		return unique.size;
	});

	const isMultiRestaurant = $derived(() => uniqueRestaurantsCount() > 1);

	// Auto-switch delivery option if table service selected but multi-restaurant
	$effect(() => {
		if (deliveryOption === 'tableService' && isMultiRestaurant()) {
			deliveryOption = '';
		}
	});

	// Address autocomplete state (Glovo/Bolt style with ORS API)
	interface AddressSuggestion {
		id: string;
		label: string;
		name: string;
		street: string;
		locality: string;
		region: string;
		confidence: number;
	}

	let addressSuggestions = $state<AddressSuggestion[]>([]);
	let showAddressSuggestions = $state(false);
	let selectedAddressIndex = $state(-1);
	let isLoadingSuggestions = $state(false);
	let autocompleteError = $state('');

	// Debounce timer for API calls
	let debounceTimer: ReturnType<typeof setTimeout>;

	async function fetchAddressSuggestions(query: string) {
		console.log('Fetching suggestions for:', query);
		if (!query || query.length < 3) {
			addressSuggestions = [];
			showAddressSuggestions = false;
			return;
		}

		isLoadingSuggestions = true;
		autocompleteError = '';

		try {
			const response = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(query)}`);
			const data = await response.json();
			console.log('API response:', data);

			if (data.success) {
				addressSuggestions = data.suggestions;
				showAddressSuggestions = addressSuggestions.length > 0;
				console.log(`Found ${addressSuggestions.length} suggestions`);
			} else {
				addressSuggestions = [];
				showAddressSuggestions = false;
				if (data.error) {
					autocompleteError = data.error;
				}
			}
		} catch (err) {
			console.error('Autocomplete fetch error:', err);
			addressSuggestions = [];
			showAddressSuggestions = false;
		} finally {
			isLoadingSuggestions = false;
			selectedAddressIndex = -1;
		}
	}

	function debouncedFetchSuggestions(query: string) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			fetchAddressSuggestions(query);
		}, 300); // 300ms debounce like Glovo
	}

	function selectAddressSuggestion(index: number) {
		if (index >= 0 && index < addressSuggestions.length) {
			const suggestion = addressSuggestions[index];
			homeAddress = suggestion.label;
			showAddressSuggestions = false;
			addressSuggestions = [];
			autocompleteError = '';
		}
	}

	function handleAddressInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		const value = target.value;

		// Clear previous timer
		clearTimeout(debounceTimer);

		if (value.length >= 3) {
			// Show loading immediately
			isLoadingSuggestions = true;
			// Debounce the API call
			debouncedFetchSuggestions(value);
		} else {
			addressSuggestions = [];
			showAddressSuggestions = false;
			isLoadingSuggestions = false;
		}
	}

	function handleAddressKeydown(event: KeyboardEvent) {
		if (!showAddressSuggestions || addressSuggestions.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedAddressIndex = (selectedAddressIndex + 1) % addressSuggestions.length;
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedAddressIndex =
					selectedAddressIndex <= 0 ? addressSuggestions.length - 1 : selectedAddressIndex - 1;
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedAddressIndex >= 0) {
					selectAddressSuggestion(selectedAddressIndex);
				}
				break;
			case 'Escape':
				showAddressSuggestions = false;
				break;
		}
	}

	$effect(() => {
		const currentUser = get(user);
		if (currentUser) {
			email = currentUser.email || '';
		}
	});

	function isValidPhone(prefix: string, phone: string): boolean {
		prefix = prefix.trim();
		phone = phone.trim().replace(/\s+/g, '');
		if (!/^\d+$/.test(phone)) return false;
		if (prefix === '+234') return /^[789][01]\d{8}$/.test(phone);
		return phone.length >= 7 && phone.length <= 15;
	}

	// Calculate delivery fees for all restaurants in cart
	async function calculateDeliveryFees() {
		if (!homeAddress || homeAddress.trim().length < 5) {
			deliveryFeeError = 'Please enter a valid delivery address';
			return;
		}

		calculatingDeliveryFees = true;
		deliveryFeeError = '';
		mixedStateError = '';

		const newFees = new Map<
			string,
			{
				canDeliver: boolean;
				fees: {
					deliveryFee: number;
					deliveryTier: string;
					serviceFee: number;
					smallOrderFee: number;
					total: number;
				};
				distance: number;
				restaurantName: string;
				customerState: string;
				restaurantState: string;
				error?: string;
			}
		>();

		try {
			// Get unique restaurants from cart
			const grouped = groupCartByRestaurant(get(cart));
			let firstRestaurantState = '';
			let hasStateMismatch = false;

			// Calculate fee for each restaurant
			for (const [restaurantId, items] of grouped) {
				const restaurantName = getRestaurantName(restaurantId);

				// Calculate order subtotal for this restaurant
				const orderSubtotal = items.reduce((acc: number, item: any) => {
					const price = item.expand?.dish?.promoAmount ?? item.expand?.dish?.defaultAmount ?? 0;
					return acc + price * item.quantity;
				}, 0);

				const response = await fetch('/api/delivery-fee', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						restaurantId,
						address: homeAddress,
						orderSubtotal
					})
				});

				const data = await response.json();

				// Track the first restaurant's state
				if (data.restaurantState && !firstRestaurantState) {
					firstRestaurantState = data.restaurantState;
				}

				// Check for state mismatch
				if (
					data.restaurantState &&
					firstRestaurantState &&
					data.restaurantState !== firstRestaurantState
				) {
					hasStateMismatch = true;
				}

				if (data.success && data.canDeliver) {
					newFees.set(restaurantId, {
						canDeliver: true,
						fees: data.fees,
						distance: data.distance,
						restaurantName: data.restaurantName || restaurantName,
						customerState: data.customerState,
						restaurantState: data.restaurantState
					});

					// Store customer state for validation
					if (data.customerState) {
						customerState = data.customerState;
					}
				} else {
					console.error(`Failed to calculate delivery fee for ${restaurantName}:`, data.error);
					newFees.set(restaurantId, {
						canDeliver: false,
						fees: { deliveryFee: 0, deliveryTier: '', serviceFee: 0, smallOrderFee: 0, total: 0 },
						distance: data.distance || 0,
						restaurantName: data.restaurantName || restaurantName,
						customerState: data.customerState || '',
						restaurantState: data.restaurantState || '',
						error: data.error || 'Cannot deliver to this location'
					});
				}
			}

			// Check if we're mixing restaurants from different states
			if (hasStateMismatch) {
				mixedStateError =
					'⚠️ You have items from restaurants in different locations. Please order from restaurants in the same city/area only.';
			}

			deliveryFees = newFees;
		} catch (err) {
			console.error('Error calculating delivery fees:', err);
			deliveryFeeError = 'Failed to calculate delivery fees. Please try again.';
		} finally {
			calculatingDeliveryFees = false;
		}
	}

	// Clear delivery fees when address changes significantly or delivery option changes
	$effect(() => {
		if (deliveryOption !== 'home') {
			deliveryFees = new Map();
			deliveryFeeError = '';
		}
	});

	function payWithPaystack(e: Event) {
		e.preventDefault();

		const currentPaystackKey = get(paystackKey);
		const PaystackPop = (window as any).PaystackPop;

		// Debug: log what's in the page data
		const pageData = get(page).data;
		console.log('Page data:', pageData);
		console.log('Restaurant:', pageData.restaurant);
		console.log('Restaurant paystackKey:', pageData.restaurant?.paystackKey);
		console.log('All restaurants:', pageData.allRestaurants);
		console.log('Paystack Key:', currentPaystackKey);
		console.log('PaystackPop available:', !!PaystackPop);

		if (!currentPaystackKey) {
			alert('Payment configuration error. Please contact support.');
			console.error('Paystack key is missing');
			return;
		}

		if (!PaystackPop) {
			alert('Payment system is loading. Please try again in a moment.');
			return;
		}

		if (!isValidPhone(prefix, phone)) {
			alert('Please enter a valid Nigerian phone number.');
			return;
		}

		// For home delivery, ensure delivery fees are calculated
		if (deliveryOption === 'home') {
			if (deliveryFees.size === 0) {
				alert('Please calculate delivery fees first. Click "Calculate Delivery Fees" button.');
				return;
			}

			// Check for mixed state error
			if (mixedStateError) {
				alert(
					'You cannot order from restaurants in different locations. Please remove items from restaurants outside your area.'
				);
				return;
			}

			// Check if any restaurant cannot deliver
			if (hasDeliveryRestrictions()) {
				alert(
					'Some restaurants cannot deliver to your location. Please remove those items from your cart.'
				);
				return;
			}
		}

		amount = grandTotal();
		const handler = PaystackPop.setup({
			key: currentPaystackKey,
			email: email,
			amount: amount * 100,
			currency: 'NGN',
			ref: 'ORD-' + Math.floor(Math.random() * 1000000000 + 1),
			callback: function (response: any) {
				alert('Payment complete! Reference: ' + response.reference);

				// Use promise chain instead of async/await for Paystack compatibility
				const saveOrdersPromise = new Promise<void>((resolve, reject) => {
					try {
						// Group cart by restaurant
						const grouped = groupCartByRestaurant(get(cart));
						const savePromises: Promise<any>[] = [];

						// Create separate order for each restaurant
						grouped.forEach((items, restaurantId) => {
							const restaurantName = getRestaurantName(restaurantId);
							const deliveryFeeInfo = deliveryFees.get(restaurantId);

							// Get fee details for this restaurant
							const feeInfo = deliveryOption === 'home' ? deliveryFees.get(restaurantId) : null;
							const foodSubtotal = items.reduce((acc: number, item: any) => {
								const price =
									item.expand?.dish?.promoAmount ?? item.expand?.dish?.defaultAmount ?? 0;
								return acc + price * item.quantity;
							}, 0);

							const orderData = {
								reference: response.reference + '-' + restaurantId.slice(0, 6),
								mainReference: response.reference,
								totalAmount: foodSubtotal + (feeInfo?.fees?.total || 0),
								foodTotal: foodSubtotal,
								deliveryFee: feeInfo?.fees?.deliveryFee || 0,
								serviceFee: feeInfo?.fees?.serviceFee || 0,
								smallOrderFee: feeInfo?.fees?.smallOrderFee || 0,
								deliveryDistance: feeInfo?.distance || 0,
								deliveryTier: feeInfo?.fees?.deliveryTier || '',
								customerState: feeInfo?.customerState || '',
								restaurantState: feeInfo?.restaurantState || '',
								type: deliveryOption,
								user: get(user).id,
								dishes: items.map((item: any) => ({
									dish: item.expand?.dish?.id,
									name: item.expand?.dish?.name,
									quantity: item.quantity,
									amount: item.amount
								})),
								name: get(user).name,
								email: get(user).email,
								quantity: items.length,
								formattedPhone,
								tableNumber,
								homeAddress,
								pickupTime,
								restaurantId: restaurantId,
								restaurantName: restaurantName,
								isMultiRestaurantOrder: grouped.size > 1,
								totalRestaurants: grouped.size
							};

							const savePromise = fetch('/api/save-order', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(orderData)
							}).then((res) => {
								if (!res.ok) {
									throw new Error(`Failed to save order for ${restaurantName}`);
								}
								return res.json();
							});

							savePromises.push(savePromise);
						});

						Promise.all(savePromises)
							.then(() => {
								alert('Orders saved successfully!');
								goto('/pending');
								clearCart();
								resolve();
							})
							.catch((err) => {
								console.error('Error saving orders:', err);
								alert(
									'Error saving some orders. Please contact support with reference: ' +
										response.reference
								);
								reject(err);
							});
					} catch (err) {
						console.error('Error in save orders:', err);
						alert(
							'Error processing orders. Please contact support with reference: ' +
								response.reference
						);
						reject(err);
					}
				});
			},
			onClose: function () {
				alert('Transaction was cancelled');
			}
		});
		handler.openIframe();
	}
</script>

<!-- Progress Bar -->
<div class="bg-base-100 border-base-200 sticky top-0 z-4 border-b">
	<div class="mx-auto max-w-7xl px-4 py-4">
		<div class="mb-4 flex items-center justify-between">
			<button
				onclick={() => goto('/#menu')}
				class="text-base-content/70 hover:text-primary flex items-center gap-2 text-sm transition-colors"
			>
				{@html iconArrowLeft}
				<span class="hidden sm:inline">Back to Menu</span>
				<span class="sm:hidden">Back</span>
			</button>
			<span class="text-base-content/70 text-sm font-medium">Step 2 of 3</span>
		</div>
		<div class="flex items-center gap-2 sm:gap-4">
			<button onclick={() => goto('/#menu')} class="group flex items-center gap-2">
				<div
					class="bg-primary text-primary-content flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10"
				>
					{@html iconCheck}
				</div>
				<span class="text-primary hidden text-sm font-medium sm:block">Cart</span>
			</button>
			<div class="bg-primary h-1 flex-1 rounded-full"></div>
			<div class="flex items-center gap-2">
				<div
					class="bg-primary text-primary-content ring-primary/20 flex h-8 w-8 items-center justify-center rounded-full ring-4 sm:h-10 sm:w-10"
				>
					<span class="font-bold">2</span>
				</div>
				<span class="text-primary hidden text-sm font-bold sm:block">Checkout</span>
			</div>
			<div class="bg-base-300 h-1 flex-1 rounded-full"></div>
			<div class="flex items-center gap-2 opacity-50">
				<div
					class="bg-base-300 text-base-content/50 flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10"
				>
					<span class="font-bold">3</span>
				</div>
				<span class="text-base-content/50 hidden text-sm sm:block">Confirmation</span>
			</div>
		</div>
	</div>
</div>

{#if $cart.length === 0 && !loading}
	<div
		class="fixed top-20 left-1/2 z-40 -translate-x-1/2 transform"
		transition:fly={{ y: -20, duration: 300 }}
	>
		<div
			class="bg-warning/10 border-warning/20 text-warning flex items-center gap-2 rounded-xl border px-6 py-3 shadow-lg"
		>
			{@html iconAlertCircle}<span>Your cart is empty</span>
		</div>
	</div>
{/if}

<main class="bg-base-200/50 min-h-screen pb-24">
	{#if !$isLoggedIn}
		<div class="mx-auto max-w-7xl px-4 py-8 text-center">
			<div class="bg-base-100 rounded-2xl p-8 shadow-sm">
				{@html iconLock}
				<h2 class="mt-4 text-xl font-bold">Please Log In</h2>
				<p class="text-base-content/70 mt-2">You need to be logged in to view your checkout.</p>
				<a href="/login" class="btn btn-primary mt-4">Log In</a>
			</div>
		</div>
	{:else if loading}
		<div class="mx-auto max-w-7xl px-4 py-8">
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div class="space-y-4">
					<div class="bg-base-300 h-8 w-1/3 animate-pulse rounded"></div>
					{#each Array(3) as _}<div class="bg-base-300 h-24 animate-pulse rounded-xl"></div>{/each}
				</div>
				<div class="space-y-4"><div class="bg-base-300 h-64 animate-pulse rounded-xl"></div></div>
			</div>
		</div>
	{:else}
		<div class="mx-auto max-w-7xl px-4 py-6 sm:py-8">
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
				<div class="space-y-6 lg:col-span-2" in:fade={{ duration: 300, delay: 100 }}>
					<div class="bg-base-100 rounded-2xl p-6 shadow-sm">
						<div class="mb-6 flex items-center gap-3">
							<div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
								{@html iconShoppingBag}
							</div>
							<div>
								<h2 class="text-xl font-bold">Your Order</h2>
								<p class="text-base-content/60 text-sm">
									{$cart.length} item{$cart.length !== 1 ? 's' : ''}
								</p>
							</div>
						</div>
						{#if $cart.length === 0}
							<div class="py-12 text-center">
								<div
									class="bg-base-200 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
								>
									{@html iconShoppingBag}
								</div>
								<p class="text-base-content/60 mb-4">Your cart is empty</p>
								<button onclick={() => goto('/#menu')} class="btn btn-primary">Browse Menu</button>
							</div>
						{:else}
							{@const groupedItems = groupCartByRestaurant($cart)}
							<div class="space-y-6">
								{#each Array.from(groupedItems.entries()) as [restId, items], groupIndex}
									<div in:slide={{ duration: 300, delay: groupIndex * 100 }}>
										<div class="border-base-200 mb-4 flex items-center gap-3 border-b pb-3">
											<div
												class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full"
											>
												{@html iconStore}
											</div>
											<div class="flex-1">
												<p class="text-primary font-semibold">
													{getRestaurantName(restId, items.restaurantName)}
												</p>
												<p class="text-base-content/60 text-xs">
													{items.length} item{items.length !== 1 ? 's' : ''}
												</p>
											</div>
										</div>
										<div class="space-y-3">
											{#each items as item, itemIndex}
												<div
													class="bg-base-200/50 hover:bg-base-200 flex gap-4 rounded-xl p-4 transition-all duration-200"
													class:opacity-50={item.expand.dish.availability !== 'Available'}
													in:fade={{ duration: 200, delay: itemIndex * 50 }}
												>
													<div
														class="bg-base-300 h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24"
													>
														<img
															src={item.expand.dish.image}
															alt={item.expand.dish.name}
															class="h-full w-full object-cover"
														/>
													</div>
													<div class="min-w-0 flex-1">
														<div class="flex items-start justify-between gap-2">
															<h3 class="truncate font-semibold">{item.expand.dish.name}</h3>
															<button
																onclick={() => {
																	dishToDelete = item;
																	deleteModal.showModal();
																}}
																class="text-error/60 hover:text-error p-1 transition-colors"
																aria-label="Remove item"
															>
																{@html iconTrash2}
															</button>
														</div>
														<p class="text-base-content/60 mt-1 line-clamp-2 text-sm">
															{item.expand.dish.description}
														</p>
														<div class="mt-2 flex items-center gap-2">
															{#if item.expand.dish.promoAmount && item.expand.dish.promoAmount < item.expand.dish.defaultAmount}
																<span class="text-primary font-bold"
																	>₦{item.expand.dish.promoAmount.toLocaleString()}</span
																>
																<span class="text-base-content/40 text-sm line-through"
																	>₦{item.expand.dish.defaultAmount.toLocaleString()}</span
																>
																<span class="badge badge-accent badge-sm"
																	>-{Math.round(
																		(1 -
																			item.expand.dish.promoAmount /
																				item.expand.dish.defaultAmount) *
																			100
																	)}%</span
																>
															{:else}
																<span class="text-primary font-bold"
																	>₦{item.expand.dish.defaultAmount.toLocaleString()}</span
																>
															{/if}
															{#if item.expand.dish.availability !== 'Available'}<span
																	class="badge badge-error badge-sm">Unavailable</span
																>{/if}
														</div>
														<div class="mt-3 flex items-center gap-1">
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
																class="bg-base-100 hover:bg-base-300 text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
																disabled={item.expand.dish.availability !== 'Available'}
															>
																{@html iconMinus}
															</button>
															<span class="w-10 text-center font-semibold">{item.quantity}</span>
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
																class="bg-base-100 hover:bg-base-300 text-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
																disabled={item.expand.dish.availability !== 'Available'}
															>
																{@html iconPlus}
															</button>
														</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
							<div class="border-base-200 mt-6 border-t pt-6">
								<button
									onclick={() => clearModal.showModal()}
									class="text-error/70 hover:text-error flex items-center gap-2 text-sm transition-colors"
								>
									{@html iconTrash2} Clear all items
								</button>
							</div>
						{/if}
					</div>
				</div>
				<div class="lg:col-span-3" in:fade={{ duration: 300, delay: 200 }}>
					<div class="sticky top-28 space-y-6">
						<div class="bg-base-100 border-base-200 rounded-2xl border p-6 shadow-lg">
							<div class="border-base-200 mb-6 flex items-center gap-3 border-b pb-4">
								<div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
									{@html iconReceipt}
								</div>
								<div>
									<h2 class="text-xl font-bold">Order Summary</h2>
									<p class="text-base-content/60 text-sm">Review your order details</p>
								</div>
							</div>
							{#if $cart.length > 0}
								<div class="mb-6 space-y-3">
									<div class="flex items-center justify-between">
										<span class="text-base-content/70">Items ({$cart.length})</span>
										<button
											onclick={() => (showDetails = !showDetails)}
											class="text-primary flex items-center gap-1 text-sm hover:underline"
										>
											{showDetails ? 'Hide' : 'View'} Details
											<span class="transition-transform {showDetails ? 'rotate-180' : ''}"
												>{@html iconChevronDown}</span
											>
										</button>
									</div>
									{#if showDetails}
										<div
											class="bg-base-200/50 space-y-2 rounded-lg p-3"
											transition:slide={{ duration: 300 }}
										>
											{#each $cart as item}
												<div class="flex justify-between text-sm">
													<span class="text-base-content/70 mr-2 flex-1 truncate"
														>{item.quantity}x {item.expand.dish.name}</span
													>
													<span class="font-medium"
														>₦{(
															(item.expand.dish.promoAmount || item.expand.dish.defaultAmount) *
															item.quantity
														).toLocaleString()}</span
													>
												</div>
											{/each}
										</div>
									{/if}
									<div class="flex justify-between text-sm">
										<span class="text-base-content/70">Subtotal</span><span class="font-medium"
											>₦{$total.toLocaleString()}</span
										>
									</div>

									<!-- Delivery Fees Section -->
									{#if deliveryOption === 'home'}
										{#if mixedStateError}
											<div class="bg-error/10 border-error/30 mt-2 rounded-lg border p-3">
												<p class="text-error text-sm font-medium">{mixedStateError}</p>
											</div>
										{/if}

										{#if deliveryFees.size > 0}
											<div class="border-base-200 mt-2 space-y-3 border-t pt-2">
												<p class="text-base-content/70 text-xs font-medium">
													Delivery Fees by Restaurant:
												</p>
												{#each Array.from(deliveryFees.entries()) as [restaurantId, feeData]}
													<div class="bg-base-200/50 flex flex-col gap-2 rounded-lg p-3">
														<div class="flex items-center justify-between">
															<span class="text-sm font-medium">{feeData.restaurantName}</span>
															{#if feeData.canDeliver}
																<span class="text-success text-xs">✓ Can Deliver</span>
															{:else}
																<span class="text-error text-xs">✗ Cannot Deliver</span>
															{/if}
														</div>

														{#if feeData.canDeliver}
															<div class="space-y-1 text-sm">
																<div class="flex justify-between">
																	<span class="text-base-content/70">Distance</span>
																	<span>{feeData.distance}km ({feeData.fees.deliveryTier})</span>
																</div>
																<div class="flex justify-between">
																	<span class="text-base-content/70">Delivery Fee</span>
																	<span>₦{feeData.fees.deliveryFee.toLocaleString()}</span>
																</div>
																<div class="flex justify-between">
																	<span class="text-base-content/70">Service Fee</span>
																	<span>₦{feeData.fees.serviceFee.toLocaleString()}</span>
																</div>
																{#if feeData.fees.smallOrderFee > 0}
																	<div class="text-warning flex justify-between">
																		<span>Small Order Fee</span>
																		<span>₦{feeData.fees.smallOrderFee.toLocaleString()}</span>
																	</div>
																{/if}
																<div
																	class="border-base-300 flex justify-between border-t pt-1 font-semibold"
																>
																	<span>Total Fees</span>
																	<span>₦{feeData.fees.total.toLocaleString()}</span>
																</div>
															</div>
														{:else}
															<div class="bg-error/10 rounded p-2">
																<p class="text-error text-xs">{feeData.error}</p>
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{:else}
											<div class="flex justify-between text-sm">
												<span class="text-base-content/70">Delivery Fee</span>
												<span class="text-warning font-medium">Click calculate below</span>
											</div>
										{/if}
									{:else}
										<div class="flex justify-between text-sm">
											<span class="text-base-content/70">Delivery Fee</span>
											<span class="text-success font-medium">Free</span>
										</div>
									{/if}

									<div class="border-base-300 mt-4 border-t-2 pt-4">
										<div class="flex items-end justify-between">
											<div>
												<p class="text-sm font-semibold">Total Amount</p>
												<p class="text-base-content/60 text-xs">Including all taxes & delivery</p>
											</div>
											<p class="text-primary text-3xl font-bold">
												₦{grandTotal().toLocaleString()}
											</p>
										</div>
									</div>
									{#if $cart.length > 0}
										{@const uniqueRestaurants = new Set(
											$cart.map((item) => item.expand?.dish?.restaurantId || item.restaurantId)
										)}
										{#if uniqueRestaurants.size > 1}
											<div class="bg-warning/10 border-warning/20 mt-4 rounded-lg border p-3">
												<p class="text-warning text-sm">
													<strong>⚠️ Important Notice:</strong> You're ordering from {uniqueRestaurants.size}
													different restaurants. Each restaurant will charge a separate delivery fee,
													which will make your order significantly more expensive. Consider ordering
													from a single restaurant to save on delivery costs.
												</p>
											</div>
										{/if}
									{/if}
								</div>
								<form onsubmit={payWithPaystack} class="space-y-6">
									<div class="space-y-3">
										<p class="flex items-center gap-2 text-sm font-semibold">
											{@html iconPackage} Select Delivery Method
										</p>
										<label
											class="block {isMultiRestaurant()
												? 'cursor-not-allowed opacity-50'
												: 'cursor-pointer'}"
										>
											<input
												type="radio"
												bind:group={deliveryOption}
												value="tableService"
												class="peer sr-only"
												required
												disabled={isMultiRestaurant()}
											/>
											<div
												class="border-base-300 peer-checked:border-primary peer-checked:bg-primary/5 {isMultiRestaurant()
													? ''
													: 'hover:border-primary/30'} group flex items-start gap-4 rounded-xl border-2 p-4 transition-all duration-300 {isMultiRestaurant()
													? 'bg-base-200'
													: ''}"
											>
												<div
													class="bg-primary/10 {isMultiRestaurant()
														? ''
														: 'group-hover:bg-primary/20'} flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors {isMultiRestaurant()
														? 'opacity-50'
														: ''}"
												>
													{@html iconUtensilsCrossed}
												</div>
												<div class="flex-1">
													<div class="mb-1 flex items-center justify-between">
														<p
															class="font-semibold {isMultiRestaurant()
																? 'text-base-content/50'
																: ''}"
														>
															Table Service
														</p>
														<div
															class="border-base-300 peer-checked:border-primary peer-checked:bg-primary flex h-5 w-5 items-center justify-center rounded-full border-2 {isMultiRestaurant()
																? 'opacity-50'
																: ''}"
														>
															<div class="h-2 w-2 rounded-full bg-white"></div>
														</div>
													</div>
													{#if isMultiRestaurant()}
														<p class="text-error text-xs font-medium">
															⚠️ Not available for multi-restaurant orders (DEBUG: {uniqueRestaurantsCount()}
															restaurants detected)
														</p>
														<p class="text-base-content/50 mt-1 text-xs">
															You have items from {uniqueRestaurantsCount()} different restaurants
														</p>
													{:else}
														<p class="text-base-content/70 text-sm">
															We'll serve you at your table in the restaurant
														</p>
													{/if}
												</div>
											</div>
										</label>
										<label class="block cursor-pointer">
											<input
												type="radio"
												bind:group={deliveryOption}
												value="restaurantPickup"
												class="peer sr-only"
											/>
											<div
												class="border-base-300 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 group flex items-start gap-4 rounded-xl border-2 p-4 transition-all duration-300"
											>
												<div
													class="bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
												>
													{@html iconPackage}
												</div>
												<div class="flex-1">
													<div class="mb-1 flex items-center justify-between">
														<p class="font-semibold">Pickup</p>
														<div
															class="border-base-300 peer-checked:border-primary peer-checked:bg-primary flex h-5 w-5 items-center justify-center rounded-full border-2"
														>
															<div class="h-2 w-2 rounded-full bg-white"></div>
														</div>
													</div>
													<p class="text-base-content/70 text-sm">
														Pick up your order at the restaurant counter
													</p>
												</div>
											</div>
										</label>
										<label class="block cursor-pointer">
											<input
												type="radio"
												bind:group={deliveryOption}
												value="home"
												class="peer sr-only"
											/>
											<div
												class="border-base-300 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 group flex items-start gap-4 rounded-xl border-2 p-4 transition-all duration-300"
											>
												<div
													class="bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
												>
													{@html iconHome}
												</div>
												<div class="flex-1">
													<div class="mb-1 flex items-center justify-between">
														<p class="font-semibold">Home Delivery</p>
														<div
															class="border-base-300 peer-checked:border-primary peer-checked:bg-primary flex h-5 w-5 items-center justify-center rounded-full border-2"
														>
															<div class="h-2 w-2 rounded-full bg-white"></div>
														</div>
													</div>
													<p class="text-base-content/70 text-sm">We'll deliver to your doorstep</p>
												</div>
											</div>
										</label>
									</div>
									{#if deliveryOption}
										<div class="space-y-4" transition:slide={{ duration: 300 }}>
											{#if deliveryOption === 'tableService'}
												<div class="space-y-2">
													<label class="block flex items-center gap-2 text-sm font-medium"
														>{@html iconHash} Table Number</label
													>
													<div class="relative">
														<input
															type="number"
															bind:value={tableNumber}
															placeholder="e.g., 12"
															min="1"
															class="border-base-300 focus:border-primary focus:ring-primary/10 bg-base-100 w-full rounded-xl border-2 px-4 py-3 transition-all outline-none focus:ring-4"
															required
														/>
													</div>
													<p class="text-base-content/60 flex items-center gap-1 text-xs">
														{@html iconInfo} Enter the table number where you're currently seated
													</p>
												</div>
											{:else if deliveryOption === 'restaurantPickup'}
												<div class="space-y-2">
													<label class="block flex items-center gap-2 text-sm font-medium"
														>{@html iconClock} Pickup Time</label
													>
													<div class="flex gap-3">
														<select
															bind:value={hour}
															class="border-base-300 focus:border-primary focus:ring-primary/10 bg-base-100 flex-1 cursor-pointer appearance-none rounded-xl border-2 px-4 py-3 outline-none focus:ring-4"
														>
															{#each Array.from({ length: 12 }, (_, i) => i + 1) as h}<option
																	value={h}>{h}</option
																>{/each}
														</select>
														<div class="text-base-content/30 flex items-center text-xl font-bold">
															:
														</div>
														<select
															bind:value={minutes}
															class="border-base-300 focus:border-primary focus:ring-primary/10 bg-base-100 flex-1 cursor-pointer appearance-none rounded-xl border-2 px-4 py-3 outline-none focus:ring-4"
														>
															{#each ['00', '15', '30', '45'] as m}<option value={m}>{m}</option
																>{/each}
														</select>
														<select
															bind:value={meridian}
															class="border-base-300 focus:border-primary focus:ring-primary/10 bg-base-100 w-24 cursor-pointer appearance-none rounded-xl border-2 px-4 py-3 outline-none focus:ring-4"
														>
															<option>AM</option><option>PM</option>
														</select>
													</div>
												</div>
											{:else if deliveryOption === 'home'}
												<div class="space-y-3">
													<div class="relative space-y-2">
														<label class="block flex items-center gap-2 text-sm font-medium"
															>{@html iconMapPin} Delivery Address</label
														>
														<div class="relative">
															<textarea
																bind:value={homeAddress}
																oninput={handleAddressInput}
																onkeydown={handleAddressKeydown}
																onblur={() =>
																	setTimeout(() => {
																		showAddressSuggestions = false;
																	}, 200)}
																placeholder="Start typing your address (min. 3 characters)..."
																rows="3"
																maxlength="200"
																class="border-base-300 focus:border-primary focus:ring-primary/10 bg-base-100 w-full resize-none rounded-xl border-2 px-4 py-3 transition-all outline-none focus:ring-4"
																required
															></textarea>

															{#if isLoadingSuggestions}
																<div
																	class="border-base-300 bg-base-100 absolute z-50 mt-1 w-full rounded-xl border-2 p-3 shadow-lg"
																>
																	<div class="text-base-content/70 flex items-center gap-2 text-sm">
																		<span class="loading loading-spinner loading-sm"></span>
																		Searching addresses...
																	</div>
																</div>
															{/if}

															{#if showAddressSuggestions && addressSuggestions.length > 0}
																<div
																	class="border-base-300 bg-base-100 absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border-2 shadow-lg"
																	role="listbox"
																>
																	<div
																		class="border-base-300 bg-base-200 text-base-content/70 sticky top-0 border-b px-4 py-2 text-xs font-medium"
																	>
																		Select an address
																	</div>
																	{#each addressSuggestions as suggestion, index}
																		<button
																			type="button"
																			class="border-base-200 hover:bg-primary/5 w-full border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0 {index ===
																			selectedAddressIndex
																				? 'bg-primary/10'
																				: ''}"
																			onclick={() => selectAddressSuggestion(index)}
																			role="option"
																			aria-selected={index === selectedAddressIndex}
																		>
																			<div class="flex items-start gap-3">
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
																					class="text-primary mt-0.5 flex-shrink-0"
																				>
																					<path
																						d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
																					/>
																					<circle cx="12" cy="10" r="3" />
																				</svg>
																				<div class="min-w-0 flex-1">
																					<div class="text-base-content font-medium">
																						{suggestion.name || suggestion.label.split(',')[0]}
																					</div>
																					{#if suggestion.street || suggestion.locality}
																						<div
																							class="text-base-content/60 mt-0.5 truncate text-xs"
																						>
																							{#if suggestion.street}{suggestion.street},
																							{/if}
																							{#if suggestion.locality}{suggestion.locality}{/if}
																						</div>
																					{/if}
																					<div
																						class="text-base-content/50 mt-1 flex items-center gap-2 text-xs"
																					>
																						<span>{suggestion.region || 'Nigeria'}</span>
																						{#if suggestion.confidence > 0.8}
																							<span class="text-success">● High confidence</span>
																						{/if}
																					</div>
																				</div>
																			</div>
																		</button>
																	{/each}
																</div>
															{/if}
														</div>
														<div class="flex justify-between text-xs">
															<span class="text-base-content/60 flex items-center gap-1"
																>{@html iconInfo} Start typing for address suggestions (Nigeria-wide)</span
															>
															<span class="text-base-content/40">{homeAddress.length}/200</span>
														</div>
														<!-- DEBUG: Show suggestion count -->
														{#if addressSuggestions.length > 0}
															<div class="text-success mt-1 text-xs">
																✓ {addressSuggestions.length} addresses found
															</div>
														{/if}
														{#if autocompleteError}
															<div class="text-error mt-1 flex items-center gap-1 text-xs">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="12"
																	height="12"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	><circle cx="12" cy="12" r="10" /><line
																		x1="12"
																		y1="8"
																		x2="12"
																		y2="12"
																	/><line x1="12" y1="16" x2="12.01" y2="16" /></svg
																>
																{autocompleteError}
															</div>
														{/if}
													</div>
													<button
														type="button"
														onclick={calculateDeliveryFees}
														disabled={calculatingDeliveryFees || homeAddress.length < 10}
														class="bg-secondary hover:bg-secondary/90 text-secondary-content flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
													>
														{#if calculatingDeliveryFees}
															<span class="loading loading-spinner loading-sm"></span>
															Calculating...
														{:else}
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
																><circle cx="12" cy="12" r="10" /><path
																	d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
																/><path d="M2 12h20" /></svg
															>
															Calculate Delivery Fees
														{/if}
													</button>
													{#if deliveryFeeError}
														<div class="text-error flex items-center gap-1 text-sm">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="14"
																height="14"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
																><circle cx="12" cy="12" r="10" /><line
																	x1="12"
																	y1="8"
																	x2="12"
																	y2="12"
																/><line x1="12" y1="16" x2="12.01" y2="16" /></svg
															>
															{deliveryFeeError}
														</div>
													{/if}
												</div>
											{/if}
										</div>
									{/if}
									<div class="border-base-200 space-y-4 border-t pt-6">
										<div class="space-y-2">
											<label class="block flex items-center gap-2 text-sm font-medium"
												>{@html iconPhone} Phone Number</label
											>
											<div class="flex gap-3">
												<div
													class="border-base-300 bg-base-200 text-base-content/70 flex w-24 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium"
												>
													<span class="text-lg">🇳🇬</span><span>+234</span>
												</div>
												<div class="relative flex-1">
													<input
														type="tel"
														bind:value={phone}
														placeholder="801 234 5678"
														class="border-base-300 focus:border-primary focus:ring-primary/10 bg-base-100 w-full rounded-xl border-2 px-4 py-3 transition-all outline-none focus:ring-4"
														required
													/>
													{#if phone && !isValidPhone(prefix, phone)}
														<div
															class="text-error absolute -bottom-6 left-0 flex items-center gap-1 text-xs"
														>
															{@html iconAlertCircle} Enter a valid Nigerian phone number
														</div>
													{/if}
												</div>
											</div>
										</div>
									</div>
									<div class="border-base-200 space-y-6 border-t pt-6">
										<label class="group flex cursor-pointer items-start gap-3">
											<div class="relative mt-0.5 flex items-center">
												<input type="checkbox" required class="peer sr-only" />
												<div
													class="border-base-300 peer-checked:border-primary peer-checked:bg-primary h-5 w-5 rounded border-2 transition-all"
												></div>
												<span
													class="pointer-events-none absolute top-1 left-1 opacity-0 peer-checked:opacity-100"
													>{@html iconCheck}</span
												>
											</div>
											<span class="text-base-content/80 text-sm leading-relaxed"
												>I agree to the <a
													href="/terms"
													class="text-primary font-medium hover:underline">Terms of Service</a
												>
												and
												<a href="/refund" class="text-primary font-medium hover:underline"
													>Refund Policy</a
												></span
											>
										</label>
										<button
											type="submit"
											class="bg-primary hover:bg-primary/90 text-primary-content shadow-primary/20 flex w-full transform items-center justify-center gap-3 rounded-xl px-6 py-4 text-lg font-bold shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
											disabled={$cart.length === 0 || !deliveryOption}
										>
											{@html iconLock}<span>Pay ₦{grandTotal().toLocaleString()}</span>
										</button>
										<div
											class="text-base-content/50 flex items-center justify-center gap-4 text-xs"
										>
											<div class="flex items-center gap-1">
												{@html iconShield}<span>SSL Secured</span>
											</div>
											<div class="bg-base-content/30 h-1 w-1 rounded-full"></div>
											<div class="flex items-center gap-1">
												{@html iconCreditCard}<span>Secure Payment</span>
											</div>
										</div>
									</div>
								</form>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</main>

<dialog bind:this={deleteModal} class="modal">
	<div class="modal-box max-w-sm text-center">
		<div
			class="bg-error/10 text-error mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
		>
			{@html iconTrash2}
		</div>
		<h3 class="mb-2 text-lg font-bold">Remove Item?</h3>
		{#if dishToDelete}<p class="text-base-content/70 mb-6">
				Are you sure you want to remove <span class="text-base-content font-semibold"
					>{dishToDelete.expand.dish.name}</span
				> from your cart?
			</p>{/if}
		<div class="flex justify-center gap-3">
			<form method="dialog"><button class="btn btn-ghost">Cancel</button></form>
			<button
				class="btn btn-error text-white"
				onclick={async () => {
					await removeFromCart(dishToDelete.id);
					deleteModal.close();
				}}>Remove Item</button
			>
		</div>
	</div>
</dialog>

<dialog bind:this={clearModal} class="modal">
	<div class="modal-box max-w-sm text-center">
		<div
			class="bg-error/10 text-error mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
		>
			{@html iconTrash2}
		</div>
		<h3 class="mb-2 text-lg font-bold">Clear Cart?</h3>
		<p class="text-base-content/70 mb-6">
			Are you sure you want to remove all items from your cart?
		</p>
		<div class="flex justify-center gap-3">
			<form method="dialog"><button class="btn btn-ghost">Cancel</button></form>
			<button class="btn btn-error text-white" onclick={() => clearCart()}>Clear All</button>
		</div>
	</div>
</dialog>
