<script lang="ts">
	import Drawer from '$lib/Drawer.svelte';
	import Footer from '$lib/Footer.svelte';
	import { isAdminPage } from '$lib/menuItems.svelte';
	import Nav from '$lib/Nav.svelte';
	import { cart } from '$lib/stores/cart';
	import { onMount } from 'svelte';
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';

	let { children, data } = $props();

	let showNotificationPrompt = $state(false);
	let isEnablingNotifications = $state(false);

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

	let loading = $state(true);
	onMount(() => {
		try {
			loading = false;

			// Register service worker for PWA
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker
					.register('/service-worker.js')
					.then((registration) => {
						console.log('SW registered:', registration);
					})
					.catch((error) => {
						console.log('SW registration failed:', error);
					});
			}

			// Check if user is logged in and should be prompted for notifications
			const user = data.user;
			if (user?.id) {
				const alreadyPrompted = localStorage.getItem('notificationPrompted');
				if (!alreadyPrompted) {
					// Check if notifications are not yet granted
					if (Notification.permission === 'default' || Notification.permission === 'denied') {
						showNotificationPrompt = true;
					}
				}
			}
		} catch (err) {
			console.error('Layout mount error:', err);
			loading = false;
		}
	});

	async function enableNotifications() {
		isEnablingNotifications = true;
		try {
			if (!('Notification' in window)) {
				alert('This browser does not support notifications');
				return;
			}

			const permission = await Notification.requestPermission();
			if (permission === 'granted') {
				// Subscribe to push notifications
				const registration = await navigator.serviceWorker.ready;
				const subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || '')
				});

				// Save subscription to backend
				await fetch('/api/subscribe-push', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: data.user.id,
						endpoint: subscription.endpoint,
						p256dh: subscription.keys?.p256dh,
						auth: subscription.keys?.auth
					})
				});

				showNotificationPrompt = false;
				localStorage.setItem('notificationPrompted', 'true');
			} else if (permission === 'denied') {
				alert('Notifications are blocked. Please enable them in your browser settings.');
			}
		} catch (error) {
			console.error('Error enabling notifications:', error);
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

	afterNavigate(() => {
		loading = false;
	});

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

{#if loading}
	<div class="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center bg-white">
		<div class="border-secondary h-12 w-12 animate-spin rounded-full border-t-4 border-b-4"></div>
	</div>
{:else}
	<div class="flex min-h-screen flex-col">
		<!-- Fixed Navbar (not part of flow) -->
		<div class="fixed top-0 z-20 w-full">
			<Nav />
		</div>

		<main class="flex-grow pt-20">{@render children()}</main>
	</div>
{/if}

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
