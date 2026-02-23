/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${process.env.npm_package_version || Date.now().toString()}`;

// Install event - cache all static assets
sw.addEventListener('install', (event) => {
	event.waitUntil(
		sw.skipWaiting().then(() => {
			return caches.open(CACHE).then((cache) => {
				return cache.addAll(['/', '/manifest.json']).catch(() => {});
			});
		})
	);
});

// Activate event - remove old caches
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => {
				return Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
			})
			.then(() => sw.clients.claim())
	);
});

// Fetch event - serve from cache, fallback to network
sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;

			return fetch(event.request)
				.then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(CACHE).then((cache) => cache.put(event.request, clone));
					}
					return response;
				})
				.catch(() => new Response('Offline', { status: 503 }));
		})
	);
});

// Push notification event
sw.addEventListener('push', (event) => {
	const data = event.data?.json() || {};
	const title = data.title || 'Proxifeast';
	const options = {
		body: data.body || 'You have a new notification',
		icon: '/icons/icon-192x192.png',
		badge: '/icons/icon-72x72.png',
		data: data.data || {},
		tag: data.tag || 'proxifeast-notification',
		requireInteraction: true
	};

	event.waitUntil(sw.registration.showNotification(title, options));
});

// Notification click event
sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const data = event.notification.data || {};
	event.waitUntil(sw.clients.openWindow(data.url || '/'));
});
