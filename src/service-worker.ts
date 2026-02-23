/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

// Install event - cache all static assets
sw.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

// Activate event - remove old caches
sw.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

// Fetch event - serve from cache or network
sw.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	// Skip non-http(s) requests (chrome-extension, data URIs, etc)
	const url = new URL(event.request.url);
	if (!url.protocol.startsWith('http')) return;

	async function respond() {
		const cache = await caches.open(CACHE);

		// Skip API routes - don't cache them
		if (url.pathname.startsWith('/api/')) {
			return fetch(event.request);
		}

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);
			if (response) return response;
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);
			// Only cache successful responses that are not opaque
			if (response.status === 200 && response.type === 'basic') {
				cache.put(event.request, response.clone());
			}
			return response;
		} catch {
			const response = await cache.match(event.request);
			if (response) return response;
			throw new Error('Network error and no cache match');
		}
	}

	event.respondWith(respond());
});

// Handle push notifications (optional)
sw.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {};
	const title = data.title || 'Proxifeast';

	// Get the redirect URL from data
	const redirectUrl = data.data?.url || '/';

	const options = {
		body: data.body || 'You have a new notification',
		icon: '/icons/icon-192x192.png',
		badge: '/icons/icon-72x72.png',
		data: {
			url: redirectUrl,
			orderId: data.data?.orderId,
			reference: data.data?.reference,
			status: data.data?.status
		},
		tag: data.tag || 'notification',
		requireInteraction: false
	};

	event.waitUntil(sw.registration.showNotification(title, options));
});

// Handle notification clicks
sw.addEventListener('notificationclick', (event) => {
	event.notification.close();

	// Get the URL from notification data
	const notificationData = event.notification.data || {};
	let url = notificationData.url || '/';

	// Make URL absolute if it's relative
	if (!url.startsWith('http')) {
		// Use the service worker's location to construct the full URL
		const origin = self.location.origin;
		url = `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
	}

	console.log('Notification click - navigating to:', url);

	event.waitUntil(
		sw.clients
			.matchAll({ type: 'window', includeUncontrolled: true })
			.then((clientList) => {
				// If there's already a window/tab open, try to focus and navigate
				for (const client of clientList) {
					// Skip clients that aren't from our origin
					if (!client.url.includes(self.location.origin)) continue;

					// Focus the client
					if ('focus' in client) {
						// Try to navigate if the URL is different
						if ('navigate' in client && client.url !== url) {
							return client.navigate(url);
						}
						return client.focus();
					}
				}

				// No existing client found - open a new window
				if (sw.clients.openWindow) {
					return sw.clients.openWindow(url);
				}
			})
			.catch((err) => {
				console.error('Error handling notification click:', err);
				// Fallback: try to open directly
				if (sw.clients.openWindow) {
					sw.clients.openWindow(url);
				}
			})
	);
});

// Background sync for offline form submissions (optional)
sw.addEventListener('sync', (event) => {
	if (event.tag === 'background-sync') {
		event.waitUntil(doBackgroundSync());
	}
});

async function doBackgroundSync() {
	// Implement background sync logic here
	console.log('Background sync executed');
}
