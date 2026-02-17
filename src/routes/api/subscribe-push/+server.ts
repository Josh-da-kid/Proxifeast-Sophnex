import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export async function POST({ request }: { request: Request }) {
	try {
		const { userId, subscription } = await request.json();

		if (!userId || !subscription) {
			return json({ success: false, error: 'Missing userId or subscription' }, { status: 400 });
		}

		// Check if subscription already exists
		const existing = await pb.collection('push_subscriptions').getFullList({
			filter: `user="${userId}" && endpoint="${subscription.endpoint}"`
		});

		if (existing.length > 0) {
			// Update existing subscription
			await pb.collection('push_subscriptions').update(existing[0].id, {
				endpoint: subscription.endpoint,
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
				updated: new Date().toISOString()
			});
		} else {
			// Create new subscription
			await pb.collection('push_subscriptions').create({
				user: userId,
				endpoint: subscription.endpoint,
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth,
				created: new Date().toISOString()
			});
		}

		return json({ success: true, message: 'Subscribed to push notifications' });
	} catch (error: any) {
		console.error('Push subscription error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
