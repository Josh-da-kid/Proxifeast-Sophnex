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
	let restaurant;
	try {
		restaurant = await pb.collection('restaurants').getFirstListItem(`domain="${domain}"`);
	} catch (e) {
		throw error(400, 'Restaurant not found');
	}

	if (!restaurant) {
		throw error(400, 'Restaurant not found');
	}

	try {
		// Step 1: Try to find existing user with various methods
		let existingUser = null;

		// Method 1: Try exact match with normalized email
		try {
			const result = await pb.collection('users').getFirstListItem(`email="${normalizedEmail}"`);
			existingUser = result;
			console.log('Found user by exact email match:', existingUser.id);
		} catch (e) {
			console.log('Exact email match failed for:', normalizedEmail);
		}

		// Method 2: If not found, try case-insensitive by listing all and filtering
		if (!existingUser) {
			try {
				const allUsers = await pb.collection('users').getFullList({
					fields: 'id,email,restaurantIds,verified'
				});

				existingUser = allUsers.find((u) => u.email?.toLowerCase().trim() === normalizedEmail);

				if (existingUser) {
					console.log('Found user by case-insensitive search:', existingUser.id);
				}
			} catch (e2) {
				console.log('Case-insensitive search failed');
			}
		}

		if (existingUser) {
			console.log(
				'Found existing user:',
				existingUser.id,
				'with restaurantIds:',
				existingUser.restaurantIds,
				'email:',
				existingUser.email
			);

			// Normalize the stored email to lowercase for consistency
			if (existingUser.email !== normalizedEmail) {
				console.log('Normalizing email from', existingUser.email, 'to', normalizedEmail);
				await pb.collection('users').update(existingUser.id, {
					email: normalizedEmail
				});
			}

			// Get restaurantIds array or create one if it doesn't exist
			let restaurantIds = existingUser.restaurantIds || [];

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
			const updatedRestaurantIds = [...restaurantIds, restaurant.id];
			console.log(
				'Adding restaurant',
				restaurant.id,
				'to user. New restaurantIds:',
				updatedRestaurantIds
			);

			await pb.collection('users').update(existingUser.id, {
				restaurantIds: updatedRestaurantIds
			});

			// Request verification email if not verified
			if (!existingUser.verified) {
				await pb.collection('users').requestVerification(normalizedEmail);
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

		console.log('No existing user found, creating new user with email:', normalizedEmail);

		// Step 2: Create new user with restaurantIds array
		const newUser = await pb.collection('users').create({
			name: data.name,
			email: normalizedEmail,
			password: data.password,
			passwordConfirm: data.passwordConfirm,
			isAdmin: 'False',
			restaurantIds: [restaurant.id]
		});

		console.log('Created new user:', newUser.id);

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
		console.error('Registration error:', err);
		console.error('Error response data:', err?.response?.data);
		console.error('Error message:', err?.message);

		const emailError = err?.response?.data?.email;

		if (emailError && emailError.code === 'validation_not_unique') {
			return json(
				{ success: false, message: 'This email has already been registered, proceed to login.' },
				{ status: 400 }
			);
		}

		return json(
			{
				success: false,
				message: 'Registration failed.',
				error: err?.response?.data || err?.message
			},
			{ status: 400 }
		);
	}
};
