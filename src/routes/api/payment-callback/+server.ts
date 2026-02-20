// src/routes/api/payment-callback/+server.ts

import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	const reference = url.searchParams.get('reference');
	const success = url.searchParams.get('success');

	if (!reference) {
		throw redirect(303, '/admin/billing?error=no_reference');
	}

	if (success !== 'true') {
		throw redirect(303, '/admin/billing?error=payment_cancelled');
	}

	try {
		// Get Paystack secret key from super restaurant
		const superRestaurants = await locals.pb.collection('restaurants').getFullList({
			filter: 'isSuper = true'
		});

		const superRestaurant = superRestaurants?.[0];
		const PAYSTACK_SECRET_KEY = superRestaurant?.paystackKey || process.env.PAYSTACK_SECRET_KEY;

		if (!PAYSTACK_SECRET_KEY) {
			throw redirect(303, '/admin/billing?error=payment_config_missing');
		}

		const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
			headers: {
				Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
			}
		});

		const verifyResult = await verifyResponse.json();

		if (verifyResult.status && verifyResult.data.status === 'success') {
			try {
				const subscription = await locals.pb
					.collection('subscriptions')
					.getFirstListItem(`paymentReference = "${reference}"`);

				await locals.pb.collection('subscriptions').update(subscription.id, {
					status: 'active'
				});

				throw redirect(303, '/admin/billing?success=1');
			} catch (e: any) {
				if (e.status === 303) throw e;
				console.error('Error updating subscription:', e);
				throw redirect(303, '/admin/billing?error=subscription_update_failed');
			}
		} else {
			throw redirect(303, '/admin/billing?error=payment_failed');
		}
	} catch (e: any) {
		if (e.status === 303) throw e;
		console.error('Payment callback error:', e);
		throw redirect(303, '/admin/billing?error=callback_error');
	}
};
