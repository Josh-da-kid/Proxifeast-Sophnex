import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();

		// Support both nested and flat formats
		const userId = locals.user.id;
		const subscription = data.subscription || {
			endpoint: data.endpoint,
			keys: {
				p256dh: data.p256dh,
				auth: data.auth
			}
		};

		if (!userId || !subscription) {
			return json({ success: false, error: 'Missing userId or subscription' }, { status: 400 });
		}

		// Check if subscription already exists
		const existing = await locals.pb.collection('push_subscriptions').getFullList({
			filter: `user="${userId}" && endpoint="${subscription.endpoint}"`
		});

		if (existing.length > 0) {
			// Update existing subscription
			await locals.pb.collection('push_subscriptions').update(existing[0].id, {
				endpoint: subscription.endpoint,
				p256dh: subscription.keys?.p256dh || data.p256dh,
				auth: subscription.keys?.auth || data.auth,
				updated: new Date().toISOString()
			});
		} else {
			// Create new subscription
			await locals.pb.collection('push_subscriptions').create({
				user: userId,
				endpoint: subscription.endpoint,
				p256dh: subscription.keys?.p256dh || data.p256dh,
				auth: subscription.keys?.auth || data.auth,
				created: new Date().toISOString()
			});
		}

		return json({ success: true, message: 'Subscribed to push notifications' });
	} catch (error: any) {
		console.error('Push subscription error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
