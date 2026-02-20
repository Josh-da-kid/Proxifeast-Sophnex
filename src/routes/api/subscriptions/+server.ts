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
			const subscriptionInfo: any = {
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

			// Save authorization code for auto-renew
			if (subscriptionData.authorizationCode) {
				subscriptionInfo.authorizationCode = subscriptionData.authorizationCode;
			}

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

		if (action === 'toggleAutoRenew') {
			const subscription = await locals.pb.collection('subscriptions').getOne(subscriptionData.id);
			const updated = await locals.pb.collection('subscriptions').update(subscriptionData.id, {
				autoRenew: !subscription.autoRenew
			});
			return json({ success: true, subscription: updated });
		}

		if (action === 'renew') {
			const current = await locals.pb.collection('subscriptions').getOne(subscriptionData.id);
			const newEndDate = new Date(current.endDate);

			switch (current.plan) {
				case 'monthly':
					newEndDate.setDate(newEndDate.getDate() + 30);
					break;
				case 'quarterly':
					newEndDate.setDate(newEndDate.getDate() + 90);
					break;
				case 'yearly':
					newEndDate.setDate(newEndDate.getDate() + 365);
					break;
			}

			const updated = await locals.pb.collection('subscriptions').update(subscriptionData.id, {
				endDate: newEndDate.toISOString(),
				status: 'active'
			});
			return json({ success: true, subscription: updated });
		}

		// Recurring charge - charge saved card
		if (action === 'recurring_charge') {
			// Get Paystack secret key from super restaurant
			const superRestaurants = await locals.pb.collection('restaurants').getFullList({
				filter: 'isSuper = true'
			});
			const superRestaurant = superRestaurants?.[0];
			const PAYSTACK_SECRET_KEY = superRestaurant?.paystackKey || process.env.PAYSTACK_SECRET_KEY;

			if (!PAYSTACK_SECRET_KEY) {
				return json({ error: 'Payment configuration not found' }, { status: 500 });
			}

			const subscription = await locals.pb.collection('subscriptions').getOne(subscriptionData.id);

			if (!subscription.authorizationCode) {
				return json({ error: 'No authorization code found' }, { status: 400 });
			}

			// Calculate amount based on plan
			const amounts: Record<string, number> = {
				monthly: 25000,
				quarterly: 65000,
				yearly: 250000
			};
			const amount = amounts[subscription.plan] || subscription.amount;

			// Charge the saved card
			const chargeResponse = await fetch(
				'https://api.paystack.co/transaction/charge_authorization',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						authorization_code: subscription.authorizationCode,
						email: subscriptionData.email || 'admin@restaurant.com',
						amount: amount * 100,
						currency: 'NGN'
					})
				}
			);

			const chargeResult = await chargeResponse.json();

			if (chargeResult.status) {
				// Update subscription with new dates
				const newEndDate = new Date();
				switch (subscription.plan) {
					case 'monthly':
						newEndDate.setDate(newEndDate.getDate() + 30);
						break;
					case 'quarterly':
						newEndDate.setDate(newEndDate.getDate() + 90);
						break;
					case 'yearly':
						newEndDate.setDate(newEndDate.getDate() + 365);
						break;
				}

				const updated = await locals.pb.collection('subscriptions').update(subscriptionData.id, {
					endDate: newEndDate.toISOString(),
					status: 'active',
					paymentReference: chargeResult.data.reference
				});

				return json({
					success: true,
					subscription: updated,
					reference: chargeResult.data.reference
				});
			} else {
				return json({ error: chargeResult.message }, { status: 400 });
			}
		}

		// Enable auto-renew with card
		if (action === 'enable_autorenew') {
			// Get Paystack secret key from super restaurant
			const superRestaurants = await locals.pb.collection('restaurants').getFullList({
				filter: 'isSuper = true'
			});
			const superRestaurant = superRestaurants?.[0];
			const PAYSTACK_SECRET_KEY = superRestaurant?.paystackKey || process.env.PAYSTACK_SECRET_KEY;

			if (!PAYSTACK_SECRET_KEY) {
				return json(
					{ error: 'Payment configuration not found. Please contact support.' },
					{ status: 500 }
				);
			}

			console.log('Enable auto-renew for subscription:', subscriptionData.id);

			// Verify the authorization by verifying the payment
			const verifyResponse = await fetch(
				'https://api.paystack.co/transaction/verify/' + subscriptionData.paymentReference,
				{
					headers: {
						Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
					}
				}
			);

			const verifyResult = await verifyResponse.json();
			console.log('Paystack verify result:', verifyResult);

			if (verifyResult.status && verifyResult.data.authorization_code) {
				const authCode = verifyResult.data.authorization_code;
				console.log('Authorization code:', authCode);

				try {
					await locals.pb.collection('subscriptions').update(subscriptionData.id, {
						autoRenew: true,
						recurring: true,
						authorizationCode: authCode
					});
					return json({ success: true, message: 'Auto-renew enabled' });
				} catch (updateErr: any) {
					console.error('Update error:', updateErr);
					return json(
						{ error: 'Failed to update subscription: ' + updateErr.message },
						{ status: 500 }
					);
				}
			} else {
				return json(
					{ error: verifyResult.message || 'Failed to save card for recurring payments' },
					{ status: 400 }
				);
			}
		}

		// Disable auto-renew
		if (action === 'disable_autorenew') {
			await locals.pb.collection('subscriptions').update(subscriptionData.id, {
				autoRenew: false,
				recurring: false,
				authorizationCode: ''
			});
			return json({ success: true, message: 'Auto-renew disabled' });
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};
