// src/routes/api/register/+server.ts

import { error, json, type RequestHandler } from '@sveltejs/kit';
import PocketBase, { ClientResponseError } from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	// Normalize email to lowercase for consistent lookups
	const normalizedEmail = data.email?.toLowerCase().trim();

	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	// 1. Get restaurant by domain
	const restaurant = await pb.collection('restaurants').getFirstListItem(`domain="${domain}"`);

	if (!restaurant) {
		throw error(400, 'Restaurant not found');
	}

	try {
		// Step 1: Check if user already exists (using normalized email - case-insensitive)
		// Use ~ (case-insensitive operator) to handle emails stored with different casing
		const existingUsers = await pb.collection('users').getList(1, 1, {
			filter: `email ~ "${normalizedEmail}"`,
			fields: 'id,restaurantIds,email,verified'
		});

		if (existingUsers.totalItems > 0) {
			const existingUser = existingUsers.items[0];

			// Normalize the stored email if needed (for backward compatibility)
			const storedEmail = existingUser.email?.toLowerCase().trim();
			if (storedEmail !== existingUser.email) {
				// Update email to lowercase for consistency
				await pb.collection('users').update(existingUser.id, {
					email: storedEmail
				});
			}

			// Get restaurantIds array or create one if it doesn't exist
			const restaurantIds = existingUser.restaurantIds || [];

			// Check if user already has access to this restaurant
			if (restaurantIds.includes(restaurant.id)) {
				return json(
					{
						success: false,
						message: 'This email is already registered for this restaurant. Please login.'
					},
					{ status: 400 }
				);
			}

			// Add this restaurant to user's restaurantIds
			await pb.collection('users').update(existingUser.id, {
				restaurantIds: [...restaurantIds, restaurant.id]
			});

			// Request verification email if not verified
			if (!existingUser.verified) {
				await pb.collection('users').requestVerification(storedEmail || normalizedEmail);
			}

			return new Response(
				JSON.stringify({
					success: true,
					message:
						'Account linked to this restaurant. Please check your email to verify your account.'
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Step 2: Create new user with restaurantIds array
		const newUser = await pb.collection('users').create({
			name: data.name,
			email: normalizedEmail,
			password: data.password,
			passwordConfirm: data.passwordConfirm,
			isAdmin: 'False',
			restaurantIds: [restaurant.id]
		});

		// Step 3: Authenticate user
		const { token, record } = await pb
			.collection('users')
			.authWithPassword(normalizedEmail, data.password);

		// Step 4: Request email verification
		await pb.collection('users').requestVerification(normalizedEmail);

		// Step 5: Clear auth session
		pb.authStore.clear();

		// Step 6: Send success response
		return new Response(
			JSON.stringify({
				success: true,
				message: 'Signup successful. Please check your email to verify your account.',
				user: newUser
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		);
	} catch (err: any) {
		const emailError = err?.response?.data?.email;

		if (emailError && emailError.code === 'validation_not_unique') {
			return json(
				{ success: false, message: 'This email has already been registered, proceed to login.' },
				{ status: 400 }
			);
		}

		return json(
			{ success: false, message: 'Registration failed.', error: err?.response?.data },
			{ status: 400 }
		);
	}
};
