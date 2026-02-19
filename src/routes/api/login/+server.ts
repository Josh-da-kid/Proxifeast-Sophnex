// src/routes/api/login/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();

	try {
		// Normalize email for consistent authentication
		const normalizedEmail = data.email?.toLowerCase().trim();

		// 🔐 Authenticate user
		const authResult = await locals.pb
			.collection('users')
			.authWithPassword(normalizedEmail, data.password);

		// Fetch fresh user record to ensure we have latest restaurantIds
		const record = await locals.pb.collection('users').getOne(authResult.record.id);

		// ❌ Email not verified
		if (!record.verified) {
			locals.pb.authStore.clear();
			await locals.pb.collection('users').requestVerification(normalizedEmail);

			return json(
				{
					error: true,
					message: "Email not verified. We've sent a new verification link."
				},
				{ status: 403 }
			);
		}

		// 🌍 Resolve restaurant from domain
		const host = request.headers.get('host') || '';
		const domain = host.split(':')[0];

		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);

		// 🚫 User does not belong to this restaurant
		// Support both old (restaurantId) and new (restaurantIds) schema
		let restaurantIds = record.restaurantIds || [];

		// Backward compatibility: if user has old restaurantId but no restaurantIds
		if (restaurantIds.length === 0 && record.restaurantId) {
			restaurantIds = [record.restaurantId];
		}

		console.log(
			'Login check - User:',
			record.id,
			'Restaurant:',
			restaurant.id,
			'User restaurantIds:',
			restaurantIds
		);

		if (!restaurantIds.includes(restaurant.id)) {
			console.log(
				'User not authorized for this restaurant. User has:',
				restaurantIds,
				'Required:',
				restaurant.id
			);
			locals.pb.authStore.clear();

			return json(
				{
					error: true,
					message: 'You are not registered for this restaurant.'
				},
				{ status: 403 }
			);
		}

		// ✅ Authorized
		locals.user = record;

		return json({
			error: false,
			message: 'Login successful!',
			user: record
		});
	} catch (err: any) {
		console.error('Login error:', err);
		return json(
			{
				error: true,
				message: 'Invalid email or password.'
			},
			{ status: 400 }
		);
	}
};
