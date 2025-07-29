// src/routes/api/register/+server.ts

import { error, json, type RequestHandler } from '@sveltejs/kit';
import PocketBase, { ClientResponseError } from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();


	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	// 1. Get restaurant by domain
	const restaurant = await pb.collection('restaurants').getFirstListItem(`domain="${domain}"`);

	if (!restaurant) {
		throw error(400, 'Restaurant not found');
	}

	try {
		// Step 1: Create new user
		const newUser = await pb.collection('users').create({
			name: data.name,
			email: data.email,
			password: data.password,
			passwordConfirm: data.passwordConfirm,
			isAdmin: 'False',
			restaurantId: restaurant.id
		});

		// Step 2: Authenticate user
		const { token, record } = await pb.collection('users').authWithPassword(data.email, data.password);

		// Step 3: Request email verification
		await pb.collection('users').requestVerification(data.email);

		// Step 4: Clear auth session
		pb.authStore.clear();

		// Step 5: Send success response
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
    return json({ success: false, message: 'This email has already been registered, proceed to login.' }, { status: 400 });
  }

  return json({ success: false, message: 'Registration failed.', error: err?.response?.data }, { status: 400 });
}

};
