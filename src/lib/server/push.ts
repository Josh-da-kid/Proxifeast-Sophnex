import webpush from 'web-push';
import type PocketBase from 'pocketbase';

const getEnvVar = (name: string): string => {
	if (typeof process !== 'undefined' && process.env[name]) {
		return process.env[name] as string;
	}
	if (typeof import.meta !== 'undefined' && import.meta.env?.[name]) {
		return import.meta.env[name] as string;
	}
	return '';
};

const VAPID_PUBLIC_KEY = getEnvVar('VAPID_PUBLIC_KEY') || getEnvVar('VITE_VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY =
	getEnvVar('VAPID_PRIVATE_KEY') || getEnvVar('VITE_VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT =
	getEnvVar('VAPID_SUBJECT') || getEnvVar('VITE_VAPID_SUBJECT') || 'mailto:admin@proxifeast.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
	webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushSubscriptionPayload {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
}

export async function sendPushNotificationToUser(
	pb: PocketBase,
	userId: string,
	message: {
		title: string;
		body: string;
		data?: Record<string, unknown>;
		tag?: string;
	}
) {
	const subscriptions = await pb.collection('push_subscriptions').getFullList({
		filter: `user="${userId}"`
	});

	if (subscriptions.length === 0) {
		return { sent: 0, failed: 0, errors: [] as Array<{ endpoint: string; error: string }> };
	}

	const payload = JSON.stringify({
		title: message.title,
		body: message.body,
		data: message.data || {},
		tag: message.tag || 'order-update',
		icon: '/icons/icon-192x192.png',
		badge: '/icons/icon-72x72.png',
		requireInteraction: true,
		ttl: 86400
	});

	const errors: Array<{ endpoint: string; error: string }> = [];
	let sent = 0;

	for (const sub of subscriptions) {
		try {
			if (!sub.p256dh || !sub.auth) {
				await pb.collection('push_subscriptions').delete(sub.id);
				continue;
			}

			const pushSubscription: PushSubscriptionPayload = {
				endpoint: sub.endpoint,
				keys: {
					p256dh: sub.p256dh,
					auth: sub.auth
				}
			};

			await webpush.sendNotification(pushSubscription, payload);
			sent += 1;
		} catch (error: any) {
			errors.push({ endpoint: sub.endpoint, error: error.message });
			if (error.statusCode === 404 || error.statusCode === 410) {
				await pb.collection('push_subscriptions').delete(sub.id);
			}
		}
	}

	return {
		sent,
		failed: errors.length,
		errors
	};
}

export function isPushConfigured() {
	return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}
