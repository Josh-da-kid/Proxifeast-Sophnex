import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import webpush from 'web-push';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

// Set VAPID details
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

console.log('[Push API] VAPID configured:', {
	publicKey: VAPID_PUBLIC_KEY ? 'set' : 'missing',
	privateKey: VAPID_PRIVATE_KEY ? 'set' : 'missing'
});

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
	webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

interface PushSubscription {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
}

export async function POST({ request }: { request: Request }) {
	try {
		const { userId, title, body, data, tag } = await request.json();

		console.log('[Push API] Sending notification to user:', userId, 'Title:', title);

		if (!userId || !title || !body) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Get all push subscriptions for this user
		const subscriptions = await pb.collection('push_subscriptions').getFullList({
			filter: `user="${userId}"`
		});

		console.log('[Push API] Found subscriptions:', subscriptions.length);

		if (subscriptions.length === 0) {
			console.log('[Push API] No subscriptions found for user:', userId);
			return json({
				success: true,
				message: 'No subscriptions found (user may not have enabled notifications)'
			});
		}

		const payload = JSON.stringify({
			title,
			body,
			data: data || {},
			tag: tag || 'order-update',
			icon: '/icons/icon-192x192.png',
			badge: '/icons/icon-72x72.png',
			requireInteraction: true
		});

		const results = [];
		const errors = [];

		// Send notification to all subscriptions
		for (const sub of subscriptions) {
			try {
				// Skip subscriptions that are missing required keys
				if (!sub.p256dh || !sub.auth) {
					console.log('[Push API] Skipping subscription missing keys:', sub.id);
					// Delete invalid subscription
					await pb.collection('push_subscriptions').delete(sub.id);
					continue;
				}

				const pushSubscription: PushSubscription = {
					endpoint: sub.endpoint,
					keys: {
						p256dh: sub.p256dh,
						auth: sub.auth
					}
				};

				await webpush.sendNotification(pushSubscription, payload);
				results.push({ endpoint: sub.endpoint, status: 'sent' });
				console.log('[Push API] Notification sent to:', sub.endpoint);
			} catch (error: any) {
				console.error('[Push API] Push error:', error.message);
				errors.push({ endpoint: sub.endpoint, error: error.message });

				// If subscription is expired or invalid, delete it
				if (error.statusCode === 404 || error.statusCode === 410) {
					await pb.collection('push_subscriptions').delete(sub.id);
					console.log('[Push API] Deleted expired subscription:', sub.id);
				}
			}
		}

		return json({
			success: results.length > 0,
			sent: results.length,
			failed: errors.length,
			errors: errors.length > 0 ? errors : undefined
		});
	} catch (error: any) {
		console.error('[Push API] Send notification error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
