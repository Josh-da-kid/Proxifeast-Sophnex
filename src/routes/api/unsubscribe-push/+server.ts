import { json } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export async function POST({ request }: { request: Request }) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return json({ success: false, error: 'Missing userId' }, { status: 400 });
		}

		// Delete all subscriptions for this user
		const subscriptions = await pb.collection('push_subscriptions').getFullList({
			filter: `user="${userId}"`
		});

		for (const sub of subscriptions) {
			await pb.collection('push_subscriptions').delete(sub.id);
		}

		return json({ success: true, message: 'Unsubscribed from push notifications' });
	} catch (error: any) {
		console.error('Push unsubscription error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
