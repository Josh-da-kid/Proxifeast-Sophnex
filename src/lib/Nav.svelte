<script lang="ts">
	import { derived } from 'svelte/store';
	import { menuItems, toggleMenu, getHref, isAdminPage } from './menuItems.svelte';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import pb from './pb';
	import { writable } from 'svelte/store';

	let isAdmin = false;

	const unsubscribe = isAdminPage.subscribe((val) => {
		isAdmin = val;
	});

	onDestroy(unsubscribe);

	let isMenuOpen = $state(false);

	let previousScrollY = 0;
	let showHeader = $state(true);
	let notificationsEnabled = $state(false);
	let isEnablingNotifications = $state(false);

	function handleScroll() {
		const currentScrollY = window.scrollY;
		showHeader = currentScrollY < previousScrollY || currentScrollY < 50;
		previousScrollY = currentScrollY;
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll);

		checkNotificationStatus();

		return () => window.removeEventListener('scroll', handleScroll);
	});

	async function checkNotificationStatus() {
		if (!('Notification' in window)) {
			notificationsEnabled = false;
			return;
		}

		if (Notification.permission === 'granted') {
			notificationsEnabled = true;
		} else {
			notificationsEnabled = false;
		}
	}

	async function toggleNotifications() {
		if (notificationsEnabled) {
			try {
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.getSubscription();
				if (subscription) {
					await subscription.unsubscribe();
					await fetch('/api/unsubscribe-push', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ userId: get(user)?.id })
					});
				}
				notificationsEnabled = false;
			} catch (err) {
				console.error('Failed to unsubscribe:', err);
			}
		} else {
			isEnablingNotifications = true;
			try {
				const permission = await Notification.requestPermission();
				if (permission === 'granted') {
					const registration = await navigator.serviceWorker.ready;
					const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

					const subscription = await registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(vapidKey || '')
					});

					await fetch('/api/subscribe-push', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							userId: get(user)?.id,
							endpoint: subscription.endpoint,
							p256dh: subscription.keys?.p256dh,
							auth: subscription.keys?.auth
						})
					});

					notificationsEnabled = true;
				}
			} catch (err) {
				console.error('Failed to enable notifications:', err);
			}
			isEnablingNotifications = false;
		}
	}

	function urlBase64ToUint8Array(base64String: string): Uint8Array {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	const user = derived(page, ($page) => $page.data.user);
	const isSuper = derived(page, ($page) => $page.data.isSuper ?? false);
	const isAdminForRestaurant = derived(page, ($page) => $page.data.isAdminForRestaurant ?? false);

	const restaurantName = get(page).data.restaurant?.name;

	let logoutModalAdmin: HTMLDialogElement;
	let logoutModalUser: HTMLDialogElement;
	let isLoggingOut = $state(false);
	let isLoggingOutAdmin = $state(false);

	// Cart store for mobile
	const cart = writable<any[]>([]);

	async function fetchCart() {
		const currentUser = get(page).data.user;

		// First check localStorage for guest cart
		const guestCart = localStorage.getItem('guestCart');
		let guestItems: any[] = [];
		if (guestCart) {
			try {
				guestItems = JSON.parse(guestCart);
			} catch (e) {}
		}

		// If logged in, fetch from server
		if (currentUser?.id) {
			try {
				const records = await pb.collection('cart').getFullList({
					filter: `user="${currentUser.id}"`,
					expand: 'dish'
				});
				// Combine guest cart with user cart
				cart.set([...guestItems, ...records]);
			} catch (err) {
				console.error('Failed to fetch cart:', err);
				cart.set(guestItems);
			}
		} else {
			// Not logged in, use guest cart
			cart.set(guestItems);
		}
	}

	onMount(() => {
		fetchCart();

		// Subscribe to cart changes for real-time updates
		pb.collection('cart').subscribe('*', async (e) => {
			if ($user?.id) {
				await fetchCart();
			}
		});

		// Listen for localStorage changes (from other components)
		window.addEventListener('storage', fetchCart);
		// Custom event for same-window updates
		window.addEventListener('cartUpdated', fetchCart);

		return () => {
			pb.collection('cart').unsubscribe('*');
			window.removeEventListener('storage', fetchCart);
			window.removeEventListener('cartUpdated', fetchCart);
		};
	});

	// Also update cart when user changes
	$effect(() => {
		if ($user) {
			fetchCart();
		}
	});

	const cartCount = $derived($cart.length);
</script>

<nav
	class="navbar sticky inset-0 top-0 z-[1000px] mx-auto flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 text-gray-700 shadow-sm transition-all duration-300 ease-in-out md:px-6"
	class:shadow-md={!showHeader}
>
	<!-- Logo Section -->
	<div class="flex items-center gap-3">
		<a href="/" class="flex items-center gap-2">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-lg"
				style="background-color: #0f4c38;"
			>
				<span class="text-lg font-bold text-white">P</span>
			</div>
			<span class="font-heading hidden text-xl font-bold text-gray-900 sm:block">
				{restaurantName || 'Proxifeast'}
			</span>
		</a>
	</div>

	<!-- Desktop Navigation -->
	<div class="hidden items-center gap-1 md:flex lg:gap-2">
		<a href="/restaurants" class="nav-link-ordr">
			<span class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
					<path d="M7 2v20" />
					<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
				</svg>
				Restaurants
			</span>
		</a>
		<a href="/about" class="nav-link">
			<span class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="M12 16v-4" />
					<path d="M12 8h.01" />
				</svg>
				About
			</span>
		</a>
		<a href="/contact" class="nav-link">
			<span class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
				</svg>
				Contact
			</span>
		</a>
		<a href="/reservation" class="nav-link">
			<span class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
					<line x1="16" y1="2" x2="16" y2="6" />
					<line x1="8" y1="2" x2="8" y2="6" />
					<line x1="3" y1="10" x2="21" y2="10" />
				</svg>
				Reservations
			</span>
		</a>
		<a href="/subscriptions" class="nav-link">
			<span class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<rect x="2" y="5" width="20" height="14" rx="2" />
					<line x1="2" y1="10" x2="22" y2="10" />
				</svg>
				Pricing
			</span>
		</a>
		<a href="/install-guide" class="nav-link-ordr">
			<span class="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M12 2v20M2 12h20" />
				</svg>
				Install App
			</span>
		</a>
		<a href="/checkout" class="nav-link relative flex items-center justify-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
				<path d="M3 6h18" />
				<path d="M16 10a4 4 0 0 1-8 0" />
			</svg>
			{#if cartCount > 0}
				<span
					class="absolute -top-1 -right-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white shadow-md"
					style="font-size: 10px;"
				>
					{cartCount > 9 ? '9+' : cartCount}
				</span>
			{/if}
		</a>
		{#if $user}
			<a href="/favorites" class="nav-link relative">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
					/>
				</svg>
			</a>
			<a href="/pending" class="nav-link relative">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
					/>
				</svg>
			</a>
			{#if $isSuper || $isAdminForRestaurant}
				<div class="dropdown dropdown-end">
					<button tabindex="0" class="nav-link flex items-center gap-1">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M3 3v18h18" />
							<path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
						</svg>
						Admin
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="12"
							height="12"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>
					<ul
						tabindex="0"
						class="dropdown-content menu rounded-box mt-2 w-48 border border-slate-100 bg-white p-2 shadow-lg"
					>
						<li><a href="/admin" class="text-slate-700">Dashboard</a></li>
						<li><a href="/admin/admin-order" class="text-slate-700">Orders</a></li>
						<li><a href="/admin/admin-menu" class="text-slate-700">Menu</a></li>
						<li><a href="/admin/admin-history" class="text-slate-700">History</a></li>
						<li><a href="/admin/admin-reservation" class="text-slate-700">Reservations</a></li>
						<li><a href="/admin/analytics" class="text-slate-700">Analytics</a></li>
						<li><a href="/admin/statistics" class="text-slate-700">Statistics</a></li>
						<li><a href="/admin/billing" class="text-slate-700">Billing</a></li>
						<li><a href="/admin/user-analysis" class="text-slate-700">Customers</a></li>
						<li><a href="/admin/today-menu" class="text-slate-700">Today's Menu</a></li>
					</ul>
				</div>
			{/if}
			<div class="dropdown dropdown-end">
				<button
					tabindex="0"
					class="btn btn-ghost btn-circle avatar !overflow-hidden !p-0"
					style="height: 36px; min-height: 36px; width: 36px; line-height: 36px; padding: 0;"
				>
					<div
						class="flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-base font-semibold text-white"
						style="height: 36px; width: 36px;"
					>
						{$user.name?.charAt(0).toUpperCase() || 'U'}
					</div>
				</button>
				<ul
					tabindex="0"
					class="dropdown-content menu rounded-box mt-2 w-52 border border-slate-100 bg-white p-2 shadow-lg"
				>
					<li class="menu-title px-3 py-2">
						<span class="font-semibold text-slate-900">{$user.name}</span>
						<span class="text-xs text-slate-500">{$user.email}</span>
					</li>
					<li><a href="/history" class="text-slate-700">Order History</a></li>
					{#if $isSuper || $isAdminForRestaurant}
						<li><a href="/admin" class="text-slate-700">Admin Dashboard</a></li>
					{/if}
					<li>
						<button onclick={toggleNotifications} class="w-full text-left text-slate-700">
							{notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
						</button>
					</li>
					<li>
						<button onclick={() => logoutModalUser.showModal()} class="text-red-600">Logout</button>
					</li>
				</ul>
			</div>
		{:else}
			<a href="/login" class="btn-ghost-custom">Login</a>
			<a href="/signup" class="btn-primary-custom !px-4 !py-2 !text-sm">Sign Up</a>
		{/if}
	</div>

	<!-- Mobile Menu Button -->
	<div class="flex items-center gap-2 md:hidden">
		{#if $user}
			<a href="/checkout" class="btn btn-ghost btn-circle relative">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
					<path d="M3 6h18" />
					<path d="M16 10a4 4 0 0 1-8 0" />
				</svg>
				{#if cartCount > 0}
					<span
						class="absolute -top-1 -right-1 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white shadow-md"
						style="font-size: 10px;"
					>
						{cartCount > 9 ? '9+' : cartCount}
					</span>
				{/if}
			</a>
		{/if}
		<button onclick={() => (isMenuOpen = true)} class="btn btn-ghost btn-circle">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<line x1="4" x2="20" y1="12" y2="12" />
				<line x1="4" x2="20" y1="6" y2="6" />
				<line x1="4" x2="20" y1="18" y2="18" />
			</svg>
		</button>
	</div>
</nav>

<!-- Mobile Drawer -->
{#if isMenuOpen}
	<div class="fixed inset-0 z-[110] md:hidden">
		<!-- Backdrop -->
		<button
			class="absolute inset-0 bg-slate-900/50"
			onclick={() => (isMenuOpen = false)}
			aria-label="Close menu"
		></button>

		<!-- Drawer -->
		<div
			class="animate-scale-in absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-100 p-4">
				<span class="font-heading text-lg font-bold text-slate-900">Menu</span>
				<button onclick={() => (isMenuOpen = false)} class="btn btn-ghost btn-sm btn-circle">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="flex h-[calc(100%-64px)] flex-col overflow-y-auto">
				<!-- User Info -->
				{#if $user}
					<div class="border-b border-slate-100 p-4">
						<div class="flex items-center gap-3">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xl leading-none font-bold text-white"
							>
								{$user.name?.charAt(0).toUpperCase() || 'U'}
							</div>
							<div>
								<p class="font-semibold text-slate-900">{$user.name}</p>
								<p class="text-sm text-slate-500">{$user.email}</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- Navigation Links -->
				<ul class="menu flex-1 gap-1 p-4">
					<li>
						<a href="/" class="font-medium text-slate-700" onclick={() => (isMenuOpen = false)}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
							</svg>
							Home
						</a>
					</li>
					<li>
						<a
							href="/restaurants"
							class="font-medium text-slate-700"
							onclick={() => (isMenuOpen = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
								<path d="M7 2v20" />
								<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
							</svg>
							Restaurants
						</a>
					</li>
					<li>
						<a
							href="/checkout"
							class="font-medium text-slate-700"
							onclick={() => (isMenuOpen = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
								<path d="M3 6h18" />
								<path d="M16 10a4 4 0 0 1-8 0" />
							</svg>
							Checkout
						</a>
					</li>
					<li>
						<a
							href="/restaurants"
							class="font-medium text-slate-700"
							onclick={() => (isMenuOpen = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
								<path d="M7 2v20" />
								<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
							</svg>
							Restaurants
						</a>
					</li>
					{#if $user}
						<li>
							<a
								href="/favorites"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
									/>
								</svg>
								Favorites
							</a>
						</li>
						<li>
							<a
								href="/pending"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10" />
									<polyline points="12 6 12 12 16 14" />
								</svg>
								Pending Orders
							</a>
						</li>
						<li>
							<a
								href="/history"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M3 3v18h18" />
									<path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
								</svg>
								Order History
							</a>
						</li>
					{/if}
					<li>
						<a
							href="/about"
							class="font-medium text-slate-700"
							onclick={() => (isMenuOpen = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 16v-4" />
								<path d="M12 8h.01" />
							</svg>
							About
						</a>
					</li>
					<li>
						<a
							href="/contact"
							class="font-medium text-slate-700"
							onclick={() => (isMenuOpen = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
							Contact
						</a>
					</li>
					<li>
						<a
							href="/reservation"
							class="font-medium text-slate-700"
							onclick={() => (isMenuOpen = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
								<line x1="16" y1="2" x2="16" y2="6" />
								<line x1="8" y1="2" x2="8" y2="6" />
								<line x1="3" y1="10" x2="21" y2="10" />
							</svg>
							Reservations
						</a>
					</li>
					<li>
						<a
							href="/subscriptions"
							class="font-medium text-slate-700"
							onclick={() => (isMenuOpen = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="2" y="5" width="20" height="14" rx="2" />
								<line x1="2" y1="10" x2="22" y2="10" />
							</svg>
							Pricing
						</a>
					</li>
					<li>
						<a
							href="/install-guide"
							class="font-medium text-slate-700"
							onclick={() => (isMenuOpen = false)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 2v20M2 12h20" />
							</svg>
							Install App
						</a>
					</li>
					{#if $isSuper || $isAdminForRestaurant}
						<div class="divider my-1">Admin</div>
						<li>
							<a
								href="/admin"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M3 3v18h18" />
									<path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
								</svg>
								Dashboard
							</a>
						</li>
						<li>
							<a
								href="/admin/admin-order"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
									<path d="M3 6h18" />
									<path d="M16 10a4 4 0 0 1-8 0" />
								</svg>
								Orders
							</a>
						</li>
						<li>
							<a
								href="/admin/admin-menu"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
									<path d="M7 2v20" />
									<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
								</svg>
								Menu
							</a>
						</li>
						<li>
							<a
								href="/admin/admin-history"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M3 3v18h18" />
									<path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
								</svg>
								History
							</a>
						</li>
						<li>
							<a
								href="/admin/admin-reservation"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
									<line x1="16" y1="2" x2="16" y2="6" />
									<line x1="8" y1="2" x2="8" y2="6" />
									<line x1="3" y1="10" x2="21" y2="10" />
								</svg>
								Reservations
							</a>
						</li>
						<li>
							<a
								href="/admin/analytics"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="18" y1="20" x2="18" y2="10" />
									<line x1="12" y1="20" x2="12" y2="4" />
									<line x1="6" y1="20" x2="6" y2="14" />
								</svg>
								Analytics
							</a>
						</li>
						<li>
							<a
								href="/admin/statistics"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M3 3v18h18" />
									<path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
								</svg>
								Statistics
							</a>
						</li>
						<li>
							<a
								href="/admin/billing"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
									<line x1="1" y1="10" x2="23" y2="10" />
								</svg>
								Billing
							</a>
						</li>
						<li>
							<a
								href="/admin/user-analysis"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
									<circle cx="9" cy="7" r="4" />
									<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
									<path d="M16 3.13a4 4 0 0 1 0 7.75" />
								</svg>
								Customers
							</a>
						</li>
						<li>
							<a
								href="/admin/today-menu"
								class="font-medium text-slate-700"
								onclick={() => (isMenuOpen = false)}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M12 2v20M2 12h20" />
									<circle cx="12" cy="12" r="10" />
								</svg>
								Today's Menu
							</a>
						</li>
					{/if}
				</ul>

				<!-- Footer -->
				<div class="border-t border-slate-100 p-4">
					{#if $user}
						<button
							onclick={() => logoutModalUser.showModal()}
							class="btn btn-outline w-full border-red-200 text-red-600 hover:bg-red-50"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
								<polyline points="16 17 21 12 16 7" />
								<line x1="21" y1="12" x2="9" y2="12" />
							</svg>
							Logout
						</button>
					{:else}
						<div class="flex gap-2">
							<a href="/login" class="btn btn-outline flex-1">Login</a>
							<a href="/signup" class="btn-primary-custom flex-1 text-center">Sign Up</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Logout Modal -->
<dialog bind:this={logoutModalUser} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Confirm Logout</h3>
		<p class="py-4">Are you sure you want to logout?</p>
		<div class="modal-action">
			<form method="dialog">
				<button class="btn" disabled={isLoggingOut}>Cancel</button>
			</form>
			<form action="/logout" method="POST">
				{#if isLoggingOut}
					<button class="btn btn-error" disabled>
						<span class="loading loading-spinner loading-sm"></span>
					</button>
				{:else}
					<button class="btn btn-error">Logout</button>
				{/if}
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<style>
	.font-heading {
		font-family: 'Poppins', sans-serif;
	}
</style>
