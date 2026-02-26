<script lang="ts">
	import Drawer from '$lib/Drawer.svelte';
	import Footer from '$lib/Footer.svelte';
	import { isAdminPage } from '$lib/menuItems.svelte';
	import Nav from '$lib/Nav.svelte';
	import { cart } from '$lib/stores/cart';
	import { onMount } from 'svelte';
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';

	let { children, data } = $props();

	let showNotificationPrompt = $state(false);
	let isEnablingNotifications = $state(false);

	let isNavigating = $state(false);
	let hasHistory = $state(false);

	onMount(() => {
		// Check if there's history to go back to
		hasHistory = window.history.length > 1;
	});

	$effect(() => {
		isNavigating = get(navigating) !== null;
		const unsub = navigating.subscribe((n) => {
			isNavigating = n !== null;
		});
		return unsub;
	});

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer-4');
		if (drawerToggle instanceof HTMLInputElement) {
			drawerToggle.checked = false;
		}
	}

	function getNumericPrice(price: string): number {
		return parseInt(price.replace(/[₦,]/g, ''), 10);
	}

	let total = $cart.reduce((sum, item) => sum + getNumericPrice(item.price) * item.quantity, 0);

	let isAdmin = false;

	// Keep it reactive using subscription
	const unsubscribe = isAdminPage.subscribe((val) => {
		isAdmin = val;
	});

	onMount(() => {
		// Register service worker for PWA
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/service-worker.js', {
					updateViaCache: 'all'
				})
				.then((registration) => {
					console.log('SW registered:', registration);
					// Check for updates
					registration.addEventListener('updatefound', () => {
						const newWorker = registration.installing;
						if (newWorker) {
							newWorker.addEventListener('statechange', () => {
								if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
									console.log('New SW available');
								}
							});
						}
					});
				})
				.catch((error) => {
					console.log('SW registration failed:', error);
				});
		}

		// Check if user is logged in and should be prompted for notifications
		const user = data.user;

		// Show notification prompt for ALL logged-in users (not just standalone)
		// This ensures notifications work for both PWA and web users
		if (user?.id) {
			const alreadyPrompted = localStorage.getItem('notificationPrompted');
			if (!alreadyPrompted) {
				// Check if notifications are not yet granted
				if (Notification.permission === 'default' || Notification.permission === 'denied') {
					showNotificationPrompt = true;
				}
			}
		}
	});

	async function enableNotifications() {
		isEnablingNotifications = true;
		console.log('[Push] Starting notification enable...');

		try {
			if (!('Notification' in window)) {
				console.error('[Push] Notifications not supported');
				alert('This browser does not support notifications');
				return;
			}

			console.log('[Push] Requesting permission...');
			const permission = await Notification.requestPermission();
			console.log('[Push] Permission result:', permission);

			if (permission === 'granted') {
				console.log('[Push] Permission granted, subscribing...');

				// Check if service worker is ready
				const registration = await navigator.serviceWorker.ready;
				console.log('[Push] SW ready:', registration);

				const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
				console.log('[Push] VAPID key exists:', !!vapidKey);

				const subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(vapidKey || '')
				});

				console.log('[Push] Subscription created:', subscription);

				// Save subscription to backend
				const response = await fetch('/api/subscribe-push', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: data.user.id,
						endpoint: subscription.endpoint,
						p256dh: subscription.keys?.p256dh,
						auth: subscription.keys?.auth
					})
				});

				const result = await response.json();
				console.log('[Push] Subscribe API result:', result);

				showNotificationPrompt = false;
				localStorage.setItem('notificationPrompted', 'true');
				alert('Notifications enabled successfully!');
			} else if (permission === 'denied') {
				alert('Notifications are blocked. Please enable them in your browser settings.');
			}
		} catch (error) {
			console.error('[Push] Error enabling notifications:', error);
		}
		isEnablingNotifications = false;
	}

	function dismissNotificationPrompt() {
		showNotificationPrompt = false;
		localStorage.setItem('notificationPrompted', 'true');
	}

	// Helper to convert VAPID key
	function urlBase64ToUint8Array(base64String: string): Uint8Array {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	afterNavigate(() => {});

	const restaurantName = $page.data.restaurant?.name || 'Proxifeast';
	const restaurantLogo = $page.data.restaurant?.faviconUrl || '/favicon.png';
</script>

<svelte:head>
	<title>Proxifeast - Your Feast Is Just A Scan Away</title>
	<meta
		name="description"
		content="{restaurantName} is a restaurant online food ordering system. It is an online menu where users scan a QR code from the restaurant tables and order easily."
	/>
	<link rel="icon" href="/favicon.png" type="image/png" />
</svelte:head>

{#if showNotificationPrompt}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
		<div class="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
			<div class="mb-4 flex justify-center">
				<div class="rounded-full bg-blue-100 p-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-10 w-10 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
						/>
					</svg>
				</div>
			</div>
			<h3 class="mb-2 text-xl font-bold text-gray-900">Stay Updated!</h3>
			<p class="mb-6 text-gray-600">
				Get notified when your order status changes. Never miss an update!
			</p>
			<div class="flex flex-col gap-3">
				<button
					onclick={enableNotifications}
					disabled={isEnablingNotifications}
					class="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
				>
					{isEnablingNotifications ? 'Enabling...' : 'Enable Notifications'}
				</button>
				<button
					onclick={dismissNotificationPrompt}
					class="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
				>
					Maybe Later
				</button>
			</div>
		</div>
	</div>
{/if}

{#if isNavigating}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
	>
		<div class="relative">
			<div
				class="h-20 w-20 animate-spin rounded-full border-4 border-slate-700 border-t-amber-500"
			></div>
			<div class="absolute inset-0 flex items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 text-amber-500"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
					<path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
					<line x1="6" y1="1" x2="6" y2="4"></line>
					<line x1="10" y1="1" x2="10" y2="4"></line>
					<line x1="14" y1="1" x2="14" y2="4"></line>
				</svg>
			</div>
		</div>
		<p class="mt-6 font-serif text-lg tracking-widest text-slate-300">LOADING</p>
		<p class="mt-2 text-sm text-slate-500">Proxifeast</p>
	</div>
{/if}

<div class="flex min-h-screen flex-col">
	<!-- Fixed Navbar (not part of flow) -->
	<div class="fixed top-0 z-20 w-full">
		<Nav />
	</div>

	<!-- Floating Back Button -->
	{#if hasHistory && $page.url.pathname !== '/'}
		<div class="fixed top-24 left-4 z-40 md:top-28 md:left-6">
			<button
				onclick={() => window.history.back()}
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

	<main class="flex-grow pt-20">{@render children()}</main>
</div>

{#if $isAdminPage && $page.url.pathname === '/admin/admin-menu'}
	<!-- Add Dish -->
	<label for="my-drawer-5">
		<div
			class="tooltip indicator fixed right-8 bottom-8 z-40 cursor-pointer rounded-full bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white shadow-2xl shadow-slate-900/50 transition-all duration-300 hover:scale-110 hover:shadow-xl"
			data-tip="Add Dish"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-7 w-7"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="12" x2="12" y1="5" y2="19"></line>
				<line x1="5" x2="19" y1="12" y2="12"></line>
			</svg>
		</div>
	</label>
{/if}

<!-- Drawer Cart -->
<Drawer
	restaurants={data.allRestaurantsIncludingSuper}
	isSuper={data.isSuper}
	restaurantId={data.restaurantId}
/>
