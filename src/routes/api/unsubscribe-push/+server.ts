import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Delete all subscriptions for this user
		const subscriptions = await locals.pb.collection('push_subscriptions').getFullList({
			filter: `user="${userId}"`
		});

		for (const sub of subscriptions) {
			await locals.pb.collection('push_subscriptions').delete(sub.id);
		}

		return json({ success: true, message: 'Unsubscribed from push notifications' });
	} catch (error: any) {
		console.error('Push unsubscription error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
