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

	function getNumericPrice(price: unknown): number {
		if (typeof price === 'number') return Number.isFinite(price) ? price : 0;
		if (typeof price === 'string') {
			const cleaned = price.replace(/[₦,]/g, '').trim();
			const parsed = Number.parseInt(cleaned, 10);
			return Number.isFinite(parsed) ? parsed : 0;
		}
		return 0;
	}

	let total = $derived(
		$cart.reduce(
			(sum, item) =>
				sum +
				getNumericPrice(
					item.amount ?? item.price ?? item.expand?.dish?.promoAmount ?? item.expand?.dish?.defaultAmount
				) * (item.quantity ?? 1),
			0
		)
	);

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
			// Show prompt if never prompted OR if notifications were denied (to allow retry)
			if (!alreadyPrompted || Notification.permission === 'denied') {
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
		console.log('[Push] Device info:', navigator.userAgent);

		try {
			if (!('Notification' in window)) {
				console.error('[Push] Notifications not supported in this browser');
				alert('This browser does not support notifications');
				return;
			}

			// Check if service workers are supported
			if (!('serviceWorker' in navigator)) {
				console.error('[Push] Service workers not supported');
				alert('This browser does not support service workers. Try using Chrome or Safari.');
				return;
			}

			console.log('[Push] Requesting permission...');
			const permission = await Notification.requestPermission();
			console.log('[Push] Permission result:', permission);

			if (permission === 'granted') {
				console.log('[Push] Permission granted, getting SW registration...');

				// Register service worker if not already registered
				let registration = await navigator.serviceWorker.getRegistration();

				if (!registration) {
					console.log('[Push] No existing registration, registering new SW...');
					registration = await navigator.serviceWorker.register('/service-worker.js', {
						scope: '/'
					});
					console.log('[Push] New SW registered:', registration);
				} else {
					console.log('[Push] Existing SW found:', registration);
				}

				// Wait for SW to be ready
				await navigator.serviceWorker.ready;
				console.log('[Push] SW ready');

				const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
				console.log('[Push] VAPID key exists:', !!vapidKey);

				// Check existing subscription
				const existingSub = await registration.pushManager.getSubscription();
				if (existingSub) {
					console.log('[Push] Existing subscription found, unsubscribing first...');
					await existingSub.unsubscribe();
				}

				const subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(vapidKey || '')
				});

				console.log('[Push] Subscription created:', subscription.endpoint);
				console.log('[Push] Subscription keys:', subscription.keys);

				// Save subscription to backend
				const response = await fetch('/api/subscribe-push', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: data.user.id,
						endpoint: subscription.endpoint,
						p256dh: subscription.keys?.p256dh,
						auth: subscription.keys?.auth,
						device: navigator.userAgent
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
	<title>Proxifeast - Hospitality - Just A Scan Away</title>
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
	{#if $page.url.pathname !== '/'}
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

	<!-- Floating WhatsApp Button (only show on non-home pages) -->
	{#if $page.url.pathname !== '/'}
		<div class="fixed right-4 bottom-22 z-40 md:right-6 md:bottom-24">
			<a
				href="https://wa.me/2347068346403?text=Hello%20Proxifeast,%20I%20need%20assistance%20with%20my%20order."
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Contact us on WhatsApp"
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
			</a>
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
