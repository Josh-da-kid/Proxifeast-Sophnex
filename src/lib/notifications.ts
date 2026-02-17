// src/lib/notifications.ts
import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';

export const pushSubscription = writable<PushSubscription | null>(null);
export const notificationsEnabled = writable(false);

const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export async function requestNotificationPermission(): Promise<boolean> {
	if (!browser) return false;

	if (!('Notification' in window)) {
		console.log('This browser does not support notifications');
		return false;
	}

	const permission = await Notification.requestPermission();
	return permission === 'granted';
}

export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
	if (!browser) return false;

	try {
		// Check if service worker is registered
		const registration = await navigator.serviceWorker.ready;

		// Subscribe to push notifications
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
		});

		pushSubscription.set(subscription);

		// Send subscription to server
		const response = await fetch('/api/subscribe-push', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				subscription: subscription.toJSON()
			})
		});

		if (response.ok) {
			notificationsEnabled.set(true);
			return true;
		}

		return false;
	} catch (error) {
		console.error('Failed to subscribe to push notifications:', error);
		return false;
	}
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
	if (!browser) return false;

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (subscription) {
			await subscription.unsubscribe();

			// Notify server to remove subscription
			await fetch('/api/unsubscribe-push', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});
		}

		pushSubscription.set(null);
		notificationsEnabled.set(false);
		return true;
	} catch (error) {
		console.error('Failed to unsubscribe from push notifications:', error);
		return false;
	}
}

export async function checkNotificationStatus(): Promise<boolean> {
	if (!browser) return false;

	if (!('Notification' in window)) return false;

	if (Notification.permission !== 'granted') return false;

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (subscription) {
			pushSubscription.set(subscription);
			notificationsEnabled.set(true);
			return true;
		}

		return false;
	} catch (error) {
		console.error('Failed to check notification status:', error);
		return false;
	}
}

// Show a local notification (for testing or immediate feedback)
export function showLocalNotification(title: string, options?: NotificationOptions): void {
	if (!browser) return;

	if (Notification.permission === 'granted') {
		new Notification(title, {
			icon: '/icons/icon-192x192.png',
			badge: '/icons/icon-72x72.png',
			...options
		});
	}
}
