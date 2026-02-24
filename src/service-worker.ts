/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `cache-${process.env.npm_package_version || Date.now().toString()}`;

console.log('[SW] Service Worker starting...');

// Keep service worker alive
sw.addEventListener('install', (event) => {
	console.log('[SW] Installing...');
	event.waitUntil(sw.skipWaiting());
});

sw.addEventListener('activate', (event) => {
	console.log('[SW] Activating...');
	event.waitUntil(
		caches
			.keys()
			.then((keys) => {
				return Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
			})
			.then(() => {
				console.log('[SW] Claiming clients...');
				return sw.clients.claim();
			})
	);
});

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET') return;
	if (url.pathname.includes('/api/') || url.pathname.includes('/logout')) {
		event.respondWith(fetch(event.request));
		return;
	}
	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) {
				fetch(event.request)
					.then((r) => {
						if (r.ok) caches.open(CACHE).then((c) => c.put(event.request, r.clone()));
					})
					.catch(() => {});
				return cached;
			}
			return fetch(event.request)
				.then((r) => {
					if (r.ok) caches.open(CACHE).then((c) => c.put(event.request, r.clone()));
					return r;
				})
				.catch(() => new Response('Offline', { status: 503 }));
		})
	);
});

// Push notification handler - THIS IS THE KEY PART
sw.addEventListener('push', (event) => {
	console.log('[SW] Push event received!', event.data);

	let data: Record<string, unknown> = {};
	try {
		data = event.data?.json() || {};
	} catch (e) {
		console.log('[SW] Push data parse error:', e);
	}

	const title = (data.title as string) || 'Proxifeast';
	const body = (data.body as string) || 'You have a new notification';
	const notificationData = (data.data as Record<string, unknown>) || {};
	const tag = (data.tag as string) || 'proxifeast-notification';

	const options: NotificationOptions = {
		body,
		icon: '/icons/icon-192x192.png',
		badge: '/icons/icon-72x72.png',
		data: notificationData,
		tag,
		requireInteraction: true
	};

	event.waitUntil(
		sw.registration
			.showNotification(title, options)
			.then(() => console.log('[SW] Notification shown successfully'))
			.catch((err) => console.error('[SW] Notification error:', err))
	);
});

// Notification click handler
sw.addEventListener('notificationclick', (event) => {
	console.log('[SW] Notification clicked!');
	event.notification.close();

	const data = (event.notification.data as Record<string, unknown>) || {};
	const url = (data.url as string) || '/';

	event.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (client.url.includes(sw.location.origin) && 'focus' in client) {
					(client as unknown as { focus: () => void }).focus();
					return;
				}
			}
			return sw.clients.openWindow(url);
		})
	);
});

console.log('[SW] Service Worker ready!');
