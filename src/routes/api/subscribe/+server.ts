// src/routes/api/subscribe/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';
import { canAdminAccessRestaurant } from '$lib/server/restaurantAccess';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();
		const { restaurantId, restaurantName, plan, amount, email, recurring, callbackUrl } = data;

		if (!(await canAdminAccessRestaurant(locals.pb, locals.user, restaurantId))) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get Paystack secret key from super restaurant
		const superRestaurants = await locals.pb.collection('restaurants').getFullList({
			filter: 'isSuper = true'
		});

		const superRestaurant = superRestaurants?.[0];
		const PAYSTACK_SECRET_KEY = superRestaurant?.paystackKey || process.env.PAYSTACK_SECRET_KEY;

		if (!PAYSTACK_SECRET_KEY) {
			return json({ error: 'Payment configuration not found' }, { status: 500 });
		}

		let pricing = {
			monthly: 15000,
			quarterly: 40000,
			yearly: 150000
		};

		if (plan === 'custom') {
			pricing = {
				monthly: amount,
				quarterly: amount * 3 * 0.9,
				yearly: amount * 12 * 0.8
			};
		}

		const planAmount = pricing[plan as keyof typeof pricing] || pricing.monthly;

		const response = await fetch('https://api.paystack.co/transaction/initialize', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: email,
				amount: planAmount * 100,
				currency: 'NGN',
				callback_url: `${callbackUrl}?success=true&reference={reference}`,
				metadata: {
					restaurantId,
					restaurantName,
					plan,
					recurring,
					type: 'subscription'
				},
				custom_fields: [
					{
						display_name: 'Restaurant Name',
						variable_name: 'restaurant_name',
						value: restaurantName
					},
					{
						display_name: 'Subscription Plan',
						variable_name: 'plan',
						value: plan
					},
					{
						display_name: 'Recurring',
						variable_name: 'recurring',
						value: recurring ? 'Yes' : 'No'
					}
				]
			})
		});

		const result = await response.json();

		if (result.status) {
			// Calculate end date using fixed average days
			let endDate = new Date();
			switch (plan) {
				case 'monthly':
					endDate.setDate(endDate.getDate() + 30);
					break;
				case 'quarterly':
					endDate.setDate(endDate.getDate() + 90);
					break;
				case 'yearly':
					endDate.setDate(endDate.getDate() + 365);
					break;
			}

			// Check if subscription exists and update, or create new
			try {
				const existing = await locals.pb
					.collection('subscriptions')
					.getFirstListItem(`restaurantId = "${restaurantId}"`);

				await locals.pb.collection('subscriptions').update(existing.id, {
					plan,
					amount: planAmount,
					startDate: new Date().toISOString(),
					endDate: endDate.toISOString(),
					status: 'pending',
					paymentReference: result.data.reference,
					recurring,
					autoRenew: false
				});
			} catch (e) {
				await locals.pb.collection('subscriptions').create({
					restaurantId,
					plan,
					amount: planAmount,
					startDate: new Date().toISOString(),
					endDate: endDate.toISOString(),
					status: 'pending',
					paymentReference: result.data.reference,
					recurring,
					autoRenew: false
				});
			}

			return json({
				success: true,
				authorizationUrl: result.data.authorization_url,
				reference: result.data.reference
			});
		} else {
			return json({ error: result.message }, { status: 400 });
		}
	} catch (err: any) {
		console.error('Subscription error:', err);
		return json({ error: err.message }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();
		const { reference, restaurantId, plan } = data;

		if (!(await canAdminAccessRestaurant(locals.pb, locals.user, restaurantId))) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get Paystack secret key from super restaurant
		const superRestaurants = await locals.pb.collection('restaurants').getFullList({
			filter: 'isSuper = true'
		});

		const superRestaurant = superRestaurants?.[0];
		const PAYSTACK_SECRET_KEY = superRestaurant?.paystackKey || process.env.PAYSTACK_SECRET_KEY;

		if (!PAYSTACK_SECRET_KEY) {
			return json({ error: 'Payment configuration not found' }, { status: 500 });
		}

		const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
			}
		});

		const verifyResult = await verifyResponse.json();

		if (verifyResult.status && verifyResult.data.status === 'success') {
			const paidAmount = verifyResult.data.amount / 100;

			let endDate = new Date();
			switch (plan) {
				case 'monthly':
					endDate.setDate(endDate.getDate() + 30);
					break;
				case 'quarterly':
					endDate.setDate(endDate.getDate() + 90);
					break;
				case 'yearly':
					endDate.setDate(endDate.getDate() + 365);
					break;
			}

			return json({
				success: true,
				paidAmount,
				endDate: endDate.toISOString()
			});
		}

		return json({ error: 'Payment verification failed' }, { status: 400 });
	} catch (err: any) {
		console.error('Subscription error:', err);
		return json({ error: err.message }, { status: 500 });
	}
};
