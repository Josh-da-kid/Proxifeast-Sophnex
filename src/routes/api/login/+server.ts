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
		const domain = host.split(':')[0].replace('www.', '').toLowerCase();

		// Try to find restaurant by domain
		let restaurant = null;
		try {
			restaurant = await locals.pb
				.collection('restaurants')
				.getFirstListItem(`domain = "${domain}"`);
		} catch (e) {
			// Try partial match
			try {
				const restaurants = await locals.pb.collection('restaurants').getFullList();
				restaurant = restaurants.find((r: any) => {
					const rDomain = (r.domain || '').replace('www.', '').toLowerCase();
					return domain.includes(rDomain) || rDomain.includes(domain);
				});
			} catch (e2) {
				// No restaurant found
			}
		}

		// If still no restaurant, try to find a super restaurant
		if (!restaurant) {
			try {
				const restaurants = await locals.pb.collection('restaurants').getFullList();
				restaurant = restaurants.find((r: any) => r.isSuper === true);
			} catch (e) {
				// No super restaurant either
			}
		}

		// If still no restaurant, return error
		if (!restaurant) {
			locals.pb.authStore.clear();
			return json(
				{
					error: true,
					message: 'Restaurant not found. Please contact support.'
				},
				{ status: 400 }
			);
		}

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

			// Return special response to prompt user to register for this restaurant
			// NOTE: Don't clear auth store - user needs to stay authenticated for link request
			return json(
				{
					error: true,
					code: 'NOT_REGISTERED_FOR_RESTAURANT',
					message: 'You are not registered for this restaurant.',
					restaurantName: restaurant.name,
					restaurantId: restaurant.id,
					email: normalizedEmail,
					userId: record.id
				},
				{ status: 403 }
			);
		}

		// ✅ Authorized
		locals.user = record;

		// Export auth store to cookie
		const authCookie = locals.pb.authStore.exportToCookie();

		// Make sure we include all necessary cookie attributes
		const cookieHeader = authCookie.includes('SameSite')
			? authCookie
			: `${authCookie}; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`;

		return json(
			{
				error: false,
				message: 'Login successful!',
				user: record
			},
			{
				headers: {
					'set-cookie': cookieHeader
				}
			}
		);
	} catch (err: any) {
		console.error('Login error:', err);

		// Check if it's an authentication error
		if (err.status === 400 || err.status === 403) {
			return json(
				{
					error: true,
					message: 'Invalid email or password.'
				},
				{ status: 400 }
			);
		}

		return json(
			{
				error: true,
				message: 'An error occurred. Please try again.'
			},
			{ status: 500 }
		);
	}
};
