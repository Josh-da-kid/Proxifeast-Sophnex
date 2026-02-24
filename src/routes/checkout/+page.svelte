<script lang="ts">
	import { writable, derived, get } from 'svelte/store';
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import pb from '$lib/pb';
	import { goto } from '$app/navigation';
	import { fly, slide, fade } from 'svelte/transition';
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

	const allRestaurants = derived(
		page,
		($page) => $page.data.allRestaurantsIncludingSuper ?? $page.data.allRestaurants ?? []
	);
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

	// Store restaurant data for payment
	let restaurantData = $state<any>(null);
	let userData = $state<any>(null);

	$effect(() => {
		restaurantData = $page.data.restaurant;
		userData = $page.data.user;
	});

	let cartLocationInfo = $state({ valid: true, message: '', mismatchedRestaurants: [] as any[] });
	let showPickupWarning = $state(false);
	const isMultiRestaurantOrder = $derived.by(() => {
		const uniqueRestaurantIds = new Set(
			$cart.map((item: any) => item.expand?.dish?.restaurantId || item.restaurantId)
		);
		return uniqueRestaurantIds.size > 1;
	});

	$effect(() => {
		// Track cart and delivery option changes
		const _ = $cart;
		const _delivery = deliveryOption;
		cartLocationInfo = getCartLocationInfo();

		// Show pickup warning if multiple restaurants and pickup selected
		if (isMultiRestaurantOrder && deliveryOption === 'restaurantPickup') {
			showPickupWarning = true;
		} else {
			showPickupWarning = false;
		}
	});

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

	function getCartLocationInfo() {
		const restaurantIds = [
			...new Set($cart.map((item: any) => item.expand?.dish?.restaurantId || item.restaurantId))
		];
		const restaurants = restaurantIds
			.map((id) => $allRestaurants.find((r: any) => r.id === id))
			.filter(Boolean);

		if (restaurants.length < 2)
			return { valid: true, message: '', mismatchedRestaurants: [] as any[] };

		const states = [
			...new Set(restaurants.map((r: any) => r.state?.toLowerCase().trim()).filter(Boolean))
		];
		const lgas = [
			...new Set(
				restaurants.map((r: any) => r.localGovernment?.toLowerCase().trim()).filter(Boolean)
			)
		];

		// Get all unique states and LGAs with restaurant names
		const stateGroups = new Map<string, any[]>();
		const lgaGroups = new Map<string, any[]>();

		restaurants.forEach((r: any) => {
			const state = r.state || 'Unknown';
			const lga = r.localGovernment || 'Unknown';

			if (!stateGroups.has(state)) stateGroups.set(state, []);
			stateGroups.get(state)!.push(r);

			if (!lgaGroups.has(lga)) lgaGroups.set(lga, []);
			lgaGroups.get(lga)!.push(r);
		});

		if (states.length > 1) {
			const stateMessages = Array.from(stateGroups.entries())
				.map(([state, reses]) => `${reses.map((r: any) => r.name).join(', ')} (${state})`)
				.join(' vs ');
			return {
				valid: false,
				message: `Your cart has restaurants from different states: ${stateMessages}. Remove all but one state to proceed.`,
				mismatchedRestaurants: restaurants
			};
		}

		if (lgas.length > 1) {
			const lgaMessages = Array.from(lgaGroups.entries())
				.map(([lga, reses]) => `${reses.map((r: any) => r.name).join(', ')} (${lga} LGA)`)
				.join(' vs ');
			return {
				valid: false,
				message: `Your cart has restaurants from different LGAs: ${lgaMessages}. Remove all but one LGA to proceed.`,
				mismatchedRestaurants: restaurants
			};
		}

		return { valid: true, message: '', mismatchedRestaurants: [] };
	}

	const cartLocationCheck = derived(cart, () => getCartLocationInfo());

	async function setupSubscriptions() {
		if (!userData?.id) return;
		unsubscribeDish = await pb.collection('dishes').subscribe('*', async ({ action, record }) => {
			if (action === 'update') {
				const isDishInCart = get(cart).some((item) => item.dish === record.id);
				if (isDishInCart) await fetchCart();
			}
		});
		unsubscribeCart = await pb.collection('cart').subscribe('*', async ({ action, record }) => {
			if (record.user === userData.id) await fetchCart();
		});
	}

	function cleanupSubscriptions() {
		unsubscribeDish?.();
		unsubscribeCart?.();
	}

	export async function fetchCart() {
		try {
			const currentUser = userData;
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
	let locationConfirmed = $state(false);
	let showSuccessToast = $state(false);
	let showErrorToast = $state(false);
	let toastMessage = $state('');

	let hour = $state('12');
	let minutes = $state('00');
	let meridian = $state('PM');
	let pickupTime = $derived(`${hour}:${minutes} ${meridian}`);
	const formattedPhone = $derived(`${prefix}${phone}`);
	const grandTotal = $derived($total);

	const cartRestaurantInfo = $derived.by(() => {
		const restaurantIds = [
			...new Set($cart.map((item: any) => item.expand?.dish?.restaurantId || item.restaurantId))
		];
		if (restaurantIds.length === 0) return null;
		const restaurant = $allRestaurants.find((r: any) => r.id === restaurantIds[0]);
		return restaurant || null;
	});

	function isValidPhone(prefix: string, phone: string): boolean {
		prefix = prefix.trim();
		phone = phone.trim().replace(/\s+/g, '');
		if (!/^\d+$/.test(phone)) return false;
		if (prefix === '+234') return /^[789][01]\d{8}$/.test(phone);
		return phone.length >= 7 && phone.length <= 15;
	}

	function payWithPaystack(e: Event) {
		e.preventDefault();

		// Only require location confirmation for home delivery
		if (deliveryOption === 'home' && !locationConfirmed) {
			alert(
				'Please confirm that your delivery address is in the same state/LGA as the restaurant before ordering.'
			);
			return;
		}

		try {
			const PaystackPop = (window as any).PaystackPop;

			if (!PaystackPop) {
				alert('Payment system is loading. Please try again in a moment.');
				return;
			}

			const paystackKeyValue = restaurantData?.paystackKey;

			if (!paystackKeyValue) {
				alert('Payment system not configured. Please contact the restaurant.');
				return;
			}

			const currentUser = userData;

			if (!currentUser) {
				alert('Please log in to make a payment.');
				return;
			}

			const currentEmail = currentUser.email;

			// Calculate total directly from cart store
			const cartSnapshot = $cart;
			const currentAmount = cartSnapshot.reduce((acc, item) => {
				if (item.expand?.dish?.availability === 'Available') {
					const price = item.expand?.dish?.promoAmount ?? item.expand?.dish?.defaultAmount ?? 0;
					return acc + price * item.quantity;
				}
				return acc;
			}, 0);

			if (currentAmount <= 0) {
				alert('Your cart is empty.');
				return;
			}

			// Validate address for home delivery
			if (deliveryOption === 'home') {
				if (!homeAddress || homeAddress.trim() === '') {
					alert('Please enter your delivery address.');
					return;
				}
			}

			if (!isValidPhone(prefix, phone)) {
				alert('Please enter a valid Nigerian phone number.');
				return;
			}

			console.log('Opening Paystack with:', {
				key: paystackKeyValue,
				email: currentEmail,
				amount: currentAmount * 100
			});

			const handler = PaystackPop.setup({
				key: paystackKeyValue,
				email: currentEmail,
				amount: currentAmount * 100,
				currency: 'NGN',
				ref: 'ORD-' + Math.floor(Math.random() * 1000000000 + 1),
				callback: function (response: any) {
					// Show payment success toast immediately
					showSuccessToast = true;
					toastMessage = 'Payment successful! Saving order...';

					const orderedDishes = $cart.map((item) => ({
						dish: item.expand?.dish?.id,
						name: item.expand?.dish?.name,
						quantity: item.quantity,
						amount: item.amount
					}));
					const orderData = {
						reference: response.reference,
						totalAmount: currentAmount,
						type: deliveryOption,
						user: currentUser.id,
						dishes: orderedDishes,
						name: currentUser.name,
						email: currentUser.email,
						quantity: $cart.length,
						formattedPhone,
						tableNumber,
						homeAddress,
						pickupTime,
						payOnDelivery: deliveryOption === 'home',
						restaurantId: cartRestaurantInfo?.id,
						restaurantName: cartRestaurantInfo?.name,
						isMultiRestaurantOrder: isMultiRestaurantOrder,
						totalRestaurants: new Set(
							$cart.map((item: any) => item.expand?.dish?.restaurantId || item.restaurantId)
						).size
					};

					// Clear cart immediately
					clearCart();

					fetch('/api/save-order', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(orderData)
					})
						.then((res) => res.json())
						.then((data) => {
							toastMessage = 'Order placed successfully!';
							setTimeout(() => {
								goto('/pending');
							}, 500);
						})
						.catch((err) => {
							console.error(err);
							showSuccessToast = false;
							showErrorToast = true;
							toastMessage = 'Payment successful but failed to save order. Please contact support.';
							setTimeout(() => (showErrorToast = false), 5000);
						});
				},
				onClose: function () {
					showErrorToast = true;
					toastMessage = 'Payment was cancelled';
					setTimeout(() => (showErrorToast = false), 3000);
				}
			});
			handler.openIframe();
		} catch (err) {
			console.error('Payment error:', err);
			showErrorToast = true;
			toastMessage = 'An error occurred. Please try again.';
			setTimeout(() => (showErrorToast = false), 3000);
		}
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
									{#if deliveryOption === 'home'}
										<div class="flex justify-between text-sm">
											<span class="text-base-content/70">Delivery Fee</span>
											<span class="text-warning font-medium">Pay on delivery</span>
										</div>
									{/if}
									<div class="border-base-300 mt-4 border-t-2 pt-4">
										<div class="flex items-end justify-between">
											<div>
												<p class="text-sm font-semibold">Total Amount</p>
												<p class="text-base-content/60 text-xs">Pay on delivery for home orders</p>
											</div>
											<p class="text-primary text-3xl font-bold">₦{grandTotal.toLocaleString()}</p>
										</div>
									</div>
									{#if $cart.length > 0}
										{@const uniqueRestaurants = new Set(
											$cart.map((item) => item.expand?.dish?.restaurantId || item.restaurantId)
										)}
										{#if uniqueRestaurants.size > 1}
											<div class="bg-warning/10 border-warning/20 mt-4 rounded-lg border p-3">
												<p class="text-warning text-sm">
													<strong>Important Notice:</strong> You're ordering from {uniqueRestaurants.size}
													different restaurants. Delivery fees will be collected on delivery for each
													restaurant.
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
											class="block cursor-pointer"
											class:opacity-50={isMultiRestaurantOrder || !cartLocationInfo.valid}
										>
											<input
												type="radio"
												bind:group={deliveryOption}
												value="tableService"
												class="peer sr-only"
												required
												disabled={isMultiRestaurantOrder || !cartLocationInfo.valid}
											/>
											<div
												class="border-base-300 peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/30 group flex items-start gap-4 rounded-xl border-2 p-4 transition-all duration-300"
												class:opacity-50={isMultiRestaurantOrder || !cartLocationInfo.valid}
											>
												<div
													class="bg-primary/10 group-hover:bg-primary/20 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors"
												>
													{@html iconUtensilsCrossed}
												</div>
												<div class="flex-1">
													<div class="mb-1 flex items-center justify-between">
														<p class="font-semibold">Table Service</p>
														<div
															class="border-base-300 peer-checked:border-primary peer-checked:bg-primary flex h-5 w-5 items-center justify-center rounded-full border-2"
														>
															<div class="h-2 w-2 rounded-full bg-white"></div>
														</div>
													</div>
													<p class="text-base-content/70 text-sm">
														We'll serve you at your table in the restaurant
														{#if isMultiRestaurantOrder}
															<span class="text-error"
																>(Not available for multi-restaurant orders)</span
															>
														{:else if !cartLocationInfo.valid}
															<span class="text-error">(Not available for your location)</span>
														{/if}
													</p>
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
									{#if showPickupWarning}
										{@const uniqueRestaurantCount = new Set(
											$cart.map((item: any) => item.expand?.dish?.restaurantId || item.restaurantId)
										).size}
										<div class="bg-warning/10 rounded-xl p-4">
											<div class="flex items-start gap-2">
												{@html iconAlertCircle}
												<div class="text-sm">
													<p class="font-medium">Pickup from multiple locations!</p>
													<p class="mt-1 opacity-80">
														You have items from {uniqueRestaurantCount} different restaurants. You'll
														need to pick up from {uniqueRestaurantCount} different locations.
													</p>
													<button
														type="button"
														class="btn btn-primary btn-sm mt-3"
														onclick={() => (deliveryOption = 'home')}
													>
														Switch to Home Delivery
													</button>
												</div>
											</div>
										</div>
									{/if}
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
												<div class="space-y-2">
													<label class="block flex items-center gap-2 text-sm font-medium"
														>{@html iconMapPin} Delivery Address</label
													>
													<textarea
														bind:value={homeAddress}
														placeholder="Enter your complete address including landmarks..."
														rows="3"
														maxlength="200"
														class="border-base-300 focus:border-primary focus:ring-primary/10 bg-base-100 w-full resize-none rounded-xl border-2 px-4 py-3 transition-all outline-none focus:ring-4"
														required
													></textarea>
													<div class="flex justify-between text-xs">
														<span class="text-base-content/60 flex items-center gap-1"
															>{@html iconInfo} Include landmarks for easier delivery</span
														>
														<span class="text-base-content/40">{homeAddress.length}/200</span>
													</div>
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
												<select
													bind:value={prefix}
													class="border-base-300 bg-base-200 text-base-content/70 focus:border-primary cursor-pointer rounded-xl border-2 px-2 py-3 font-medium outline-none"
												>
													<option value="+234">🇳🇬 +234</option>
													<option value="+233">🇬🇭 +233</option>
													<option value="+229">🇧🇯 +229</option>
													<option value="+228">🇹🇬 +228</option>
													<option value="+227">🇳🇪 +227</option>
													<option value="+235">🇹🇩 +235</option>
													<option value="+237">🇨🇲 +237</option>
													<option value="+241">🇬🇦 +241</option>
													<option value="+244">🇦🇴 +244</option>
													<option value="+231">🇱🇷 +231</option>
												</select>
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
															{@html iconAlertCircle} Enter a valid phone number
														</div>
													{/if}
												</div>
											</div>
										</div>
									</div>
									<div class="border-base-200 space-y-6 border-t pt-6">
										{#if cartRestaurantInfo && deliveryOption === 'home'}
											<div class="bg-info/10 rounded-xl p-4">
												<div class="flex items-start gap-2">
													{@html iconAlertCircle}
													<div class="text-sm">
														<p class="font-medium">Location Check</p>
														<p class="mt-1 opacity-80">
															Please confirm that your delivery address is in <strong
																>{cartRestaurantInfo.state}</strong
															>
															{cartRestaurantInfo.localGovernment
																? `, ${cartRestaurantInfo.localGovernment} LGA`
																: ''} to order from <strong>{cartRestaurantInfo.name}</strong>.
														</p>
														<label class="mt-3 flex cursor-pointer items-start gap-3">
															<div class="relative mt-0.5 flex items-center">
																<input
																	type="checkbox"
																	bind:checked={locationConfirmed}
																	class="peer sr-only"
																/>
																<div
																	class="border-base-300 peer-checked:border-primary peer-checked:bg-primary h-5 w-5 rounded border-2 transition-all"
																></div>
																<span
																	class="pointer-events-none absolute top-1 left-1 opacity-0 peer-checked:opacity-100"
																	>{@html iconCheck}</span
																>
															</div>
															<span class="text-sm leading-relaxed"
																>I confirm my delivery address is in the same state/LGA as the
																restaurant</span
															>
														</label>
													</div>
												</div>
											</div>
										{/if}
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
										{#if $cart.length > 0}
											{#if !cartLocationInfo.valid}
												<div class="bg-warning/10 space-y-3 rounded-xl p-4">
													<div class="flex items-start gap-2">
														{@html iconAlertCircle}
														<span class="text-sm">{cartLocationInfo.message}</span>
													</div>
													{#if cartLocationInfo.mismatchedRestaurants.length > 0}
														<div class="mt-3 space-y-2">
															<p class="text-xs font-medium">Restaurants in cart:</p>
															{#each cartLocationInfo.mismatchedRestaurants as restaurant}
																{@const cartItemsForRestaurant = $cart.filter(
																	(item: any) =>
																		(item.expand?.dish?.restaurantId || item.restaurantId) ===
																		restaurant.id
																)}
																{#if cartItemsForRestaurant.length > 0}
																	<div
																		class="bg-base-100 flex items-center justify-between rounded-lg p-2"
																	>
																		<div class="flex flex-col">
																			<span class="font-medium">{restaurant.name}</span>
																			<span class="text-xs opacity-70"
																				>{restaurant.state}{restaurant.localGovernment
																					? `, ${restaurant.localGovernment} LGA`
																					: ''}</span
																			>
																		</div>
																		<button
																			type="button"
																			class="btn btn-error btn-sm text-white"
																			onclick={async () => {
																				for (const item of cartItemsForRestaurant) {
																					await removeFromCart(item.id);
																				}
																			}}
																		>
																			{@html iconTrash2} Remove
																		</button>
																	</div>
																{/if}
															{/each}
														</div>
													{/if}
												</div>
											{/if}
										{/if}
										<button
											type="button"
											class="bg-primary hover:bg-primary/90 text-primary-content shadow-primary/20 flex w-full transform items-center justify-center gap-3 rounded-xl px-6 py-4 text-lg font-bold shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
											disabled={$cart.length === 0 ||
												!deliveryOption ||
												!cartLocationInfo.valid ||
												(deliveryOption === 'home' && !locationConfirmed)}
											onclick={payWithPaystack}
										>
											{@html iconLock}<span>Pay ₦{$total.toLocaleString()}</span>
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
										<div
											class="mt-4 rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4"
										>
											<div class="flex items-center justify-center gap-3">
												<div
													class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5 text-green-600"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fill-rule="evenodd"
															d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
															clip-rule="evenodd"
														/>
													</svg>
												</div>
												<div class="text-center">
													<p class="text-sm font-semibold text-green-700">Secured by Paystack</p>
													<p class="text-xs text-green-600">
														Your payment information is encrypted and secure
													</p>
												</div>
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

<!-- Success Toast -->
{#if showSuccessToast}
	<div class="toast toast-top toast-center z-50" in:fly={{ y: -50, duration: 300 }}>
		<div
			class="alert min-w-[300px] gap-4 rounded-2xl border-0 bg-gray-900 px-6 py-4 text-white shadow-2xl"
		>
			<div class="rounded-full bg-green-500/20 p-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-green-400"
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
				<p class="text-base font-bold">Order Confirmed!</p>
				<p class="text-sm text-gray-400">Redirecting to pending orders...</p>
			</div>
		</div>
	</div>
{/if}

<!-- Error Toast -->
{#if showErrorToast}
	<div class="toast toast-top toast-center z-50" in:fly={{ y: -50, duration: 300 }}>
		<div
			class="alert min-w-[300px] gap-4 rounded-2xl border-0 bg-gray-900 px-6 py-4 text-white shadow-2xl"
		>
			<div class="rounded-full bg-red-500/20 p-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 text-red-400"
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
			<div>
				<p class="text-base font-bold">{toastMessage}</p>
			</div>
		</div>
	</div>
{/if}
