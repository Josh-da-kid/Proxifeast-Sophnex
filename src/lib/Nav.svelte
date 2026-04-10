<script lang="ts">
	import { derived } from 'svelte/store';
	import { menuItems, toggleMenu, getHref, isAdminPage } from './menuItems.svelte';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import pb from './pb';
	import { cart as sharedCart, fetchCart as fetchSharedCart } from './stores/cart';

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
						applicationServerKey: urlBase64ToUint8Array(vapidKey || '') as BufferSource
					});
					const subscriptionJson = subscription.toJSON();

					await fetch('/api/subscribe-push', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							userId: get(user)?.id,
							endpoint: subscription.endpoint,
							p256dh: subscriptionJson.keys?.p256dh,
							auth: subscriptionJson.keys?.auth
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

	// Role-based access
	const userRole = derived(page, ($page) => $page.data.userRole ?? 'owner');
	const isKitchen = derived(page, ($page) => $page.data.isKitchen ?? false);
	const isWaiter = derived(page, ($page) => $page.data.isWaiter ?? false);
	const isManagerOrOwner = derived(page, ($page) => {
		const role = $page.data.userRole ?? 'owner';
		return role === 'owner' || role === 'manager';
	});

	const restaurantName = derived(page, ($page) => $page.data.restaurant?.name ?? 'Proxifeast');

	let logoutModalAdmin: HTMLDialogElement;
	let logoutModalUser: HTMLDialogElement;
	let isLoggingOut = $state(false);
	let isLoggingOutAdmin = $state(false);

	// Use shared cart store
	const cart = sharedCart;

	async function fetchCart() {
		const userId = $user?.id;
		await fetchSharedCart(undefined, userId);
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
				{$restaurantName || 'Proxifeast'}
			</span>
		</a>
	</div>

	<!-- Desktop Navigation -->
	<div class="hidden items-center gap-1 md:flex lg:gap-2">
		{#if $isSuper}
			<a href="/stores" class="nav-link-ordr">
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
					Stores
				</span>
			</a>
		{/if}
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
		<a href="/setup-pricing" class="nav-link-ordr">
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
					<path
						d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
					/>
					<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
					<line x1="12" y1="22.08" x2="12" y2="12" />
				</svg>
				Hardware Setup
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
			<a href="/favorites" aria-label="Favorites" class="nav-link relative">
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
			<a href="/pending" aria-label="Pending orders" class="nav-link relative">
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
			{#if $user && ($isSuper || $isAdminForRestaurant)}
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
						class="dropdown-content menu rounded-box mt-2 w-48 border border-slate-100 bg-white p-2 shadow-lg"
					>
						<li><a href="/admin" class="text-slate-700">Dashboard</a></li>
						<li><a href="/admin/admin-order" class="text-slate-700">Orders</a></li>
						<li><a href="/admin/admin-menu" class="text-slate-700">Menu</a></li>
						{#if $isManagerOrOwner}
							<li><a href="/admin/admin-history" class="text-slate-700">History</a></li>
							<li><a href="/admin/admin-reservation" class="text-slate-700">Reservations</a></li>
							<li><a href="/admin/analytics" class="text-slate-700">Analytics</a></li>
							<li><a href="/admin/statistics" class="text-slate-700">Statistics</a></li>
							<li><a href="/admin/billing" class="text-slate-700">Billing</a></li>
							<li><a href="/admin/user-analysis" class="text-slate-700">Customers</a></li>
							<li><a href="/admin/restaurant-settings" class="text-slate-700">Settings</a></li>
							<li><a href="/admin/qr-scanner" class="text-slate-700">QR Scanner</a></li>
						{/if}
						{#if $isSuper}
							<li><a href="/admin/set-inquiries" class="text-slate-700">Set Inquiries</a></li>
						{/if}
						{#if $isManagerOrOwner || $isKitchen}
							<li><a href="/admin/today-menu" class="text-slate-700">Today's Menu</a></li>
						{/if}
					</ul>
				</div>
			{/if}
			<div class="dropdown dropdown-end">
				<button
					tabindex="0"
					class="btn btn-ghost btn-circle"
				>
					<div class="relative w-10 rounded-full">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-white"
							style="background: linear-gradient(135deg, #0f4c38 0%, #1a7a5a 100%);"
						>
							{$user.name?.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2) || 'U'}
						</div>
						<div class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"></div>
					</div>
				</button>
				<ul
					class="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-box w-56 mt-3"
				>
					<li class="font-semibold text-sm text-slate-800 px-2 py-1">{$user.name}</li>
					<li class="font-normal text-xs text-slate-400 px-2 pb-2">{$user.email}</li>
					<li class="border-t border-slate-100 mt-1 pt-1">
						<a href="/history">Order History</a>
					</li>
					{#if $isSuper || $isAdminForRestaurant}
						<li><a href="/admin">Admin Dashboard</a></li>
					{/if}
					<li><a href="/about">About</a></li>
					<li><a href="/contact">Contact</a></li>
					<li><a href="/install-guide">Install App</a></li>
					<li>
						<button onclick={toggleNotifications} class="w-full text-left">
							{notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
						</button>
					</li>
					<li class="border-b border-slate-100 pb-1">
						<button onclick={() => logoutModalUser.showModal()} class="text-red-600">Logout</button>
					</li>
				</ul>
			</div>
		{:else}
			<a href="/about" class="nav-link">About</a>
			<a href="/contact" class="nav-link">Contact</a>
			<a href="/install-guide" class="nav-link">Install App</a>
			<a href="/login" class="btn-ghost-custom">Login</a>
			<a href="/signup" class="btn-primary-custom !px-4 !py-2 !text-sm">Sign Up</a>
		{/if}
	</div>

	<!-- Mobile Menu Button -->
	<div class="flex items-center gap-2 md:hidden">
		{#if $user}
			<a href="/checkout" aria-label="Checkout" class="btn btn-ghost btn-circle relative">
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
		<button aria-label="Open menu" onclick={() => (isMenuOpen = true)} class="btn btn-ghost btn-circle">
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
				<button aria-label="Close menu" onclick={() => (isMenuOpen = false)} class="btn btn-ghost btn-sm btn-circle">
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
						<div class="flex items-center gap-3 overflow-hidden">
							<div class="relative shrink-0">
								<div
									class="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white shadow-sm"
									style="background: linear-gradient(135deg, #0f4c38 0%, #1a7a5a 100%);"
								>
									{$user.name?.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2) || 'U'}
								</div>
								<div class="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400"></div>
							</div>
							<div class="min-w-0 flex-1 overflow-hidden">
								<p class="truncate font-semibold text-slate-900">{$user.name}</p>
								<p class="truncate text-sm text-slate-500">{$user.email}</p>
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
					{#if $isSuper}
						<li>
							<a
								href="/stores"
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
								Stores
							</a>
						</li>
					{/if}
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
							href="/setup-pricing"
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
									d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
								/>
								<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
								<line x1="12" y1="22.08" x2="12" y2="12" />
							</svg>
							Hardware Setup
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
					{#if $user && ($isSuper || $isAdminForRestaurant)}
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
						{#if $isManagerOrOwner}
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
									href="/admin/restaurant-settings"
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
											d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
										/>
										<circle cx="12" cy="12" r="3" />
									</svg>
									Settings
								</a>
							</li>
							<li>
								<a
									href="/admin/qr-scanner"
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
											d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
										/>
									</svg>
									QR Scanner
								</a>
							</li>
							{#if $isSuper}
								<li>
									<a
										href="/admin/set-inquiries"
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
										Set Inquiries
									</a>
								</li>
							{/if}
							{#if $isManagerOrOwner || $isKitchen}
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
						{/if}
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
							<a href="/login" class="btn btn-outline flex-1" onclick={() => (isMenuOpen = false)}
								>Login</a
							>
							<a
								href="/signup"
								class="btn-primary-custom flex-1 text-center"
								onclick={() => (isMenuOpen = false)}>Sign Up</a
							>
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
					<button class="btn btn-error" disabled aria-label="Logging out">
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
		font-family: 'Plus Jakarta Sans', sans-serif;
	}
</style>
