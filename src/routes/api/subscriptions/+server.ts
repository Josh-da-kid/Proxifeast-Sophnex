// src/routes/api/subscriptions/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const restaurantId = url.searchParams.get('restaurantId');

		if (restaurantId) {
			const subscription = await locals.pb
				.collection('subscriptions')
				.getFirstListItem(`restaurantId = "${restaurantId}"`);
			return json({ subscription });
		}

		const subscriptions = await locals.pb.collection('subscriptions').getFullList({
			sort: '-created'
		});
		return json({ subscriptions });
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();
		const { action, ...subscriptionData } = data;

		if (action === 'create' || action === 'update') {
			const subscriptionInfo = {
				restaurantId: subscriptionData.restaurantId,
				plan: subscriptionData.plan,
				amount: subscriptionData.amount,
				startDate: subscriptionData.startDate,
				endDate: subscriptionData.endDate,
				status: subscriptionData.status || 'active',
				paymentReference: subscriptionData.paymentReference || '',
				recurring: subscriptionData.recurring || false,
				autoRenew: subscriptionData.autoRenew || false
			};

			if (subscriptionData.id) {
				const updated = await locals.pb
					.collection('subscriptions')
					.update(subscriptionData.id, subscriptionInfo);
				return json({ success: true, subscription: updated });
			} else {
				const created = await locals.pb.collection('subscriptions').create(subscriptionInfo);
				return json({ success: true, subscription: created });
			}
		}

		if (action === 'cancel') {
			const updated = await locals.pb.collection('subscriptions').update(subscriptionData.id, {
				status: 'cancelled'
			});
			return json({ success: true, subscription: updated });
		}

		if (action === 'renew') {
			const current = await locals.pb.collection('subscriptions').getOne(subscriptionData.id);
			const newEndDate = new Date(current.endDate);

			switch (current.plan) {
				case 'monthly':
					newEndDate.setMonth(newEndDate.getMonth() + 1);
					break;
				case 'quarterly':
					newEndDate.setMonth(newEndDate.getMonth() + 3);
					break;
				case 'yearly':
					newEndDate.setFullYear(newEndDate.getFullYear() + 1);
					break;
			}

			const updated = await locals.pb.collection('subscriptions').update(subscriptionData.id, {
				endDate: newEndDate.toISOString(),
				status: 'active'
			});
			return json({ success: true, subscription: updated });
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};
