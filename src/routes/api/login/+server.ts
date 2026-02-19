// import { json, type RequestHandler } from '@sveltejs/kit';

// export const POST: RequestHandler = async ({ request, locals }) => {
// 	const data = await request.json();

// 	try {
// 		const { record } = await locals.pb
// 			.collection('users')
// 			.authWithPassword(data.email, data.password);

// 		if (!record.verified) {
// 			locals.pb.authStore.clear();
// 			await locals.pb.collection('users').requestVerification(data.email);
// 			// await locals.pb.collection('users').requestOTP(data.email);

// 			return json({
// 				error: true,
// 				message: "Email not verified. We've sent a new verification link.",
// 				email: data.email
// 			}, { status: 403 });
// 		}

// 		// Store user in locals (hooks will handle the cookie)
// 		locals.user = record;

// 		return json({
// 			error: false,
// 			message: 'Login successful!',
// 			user: record
// 		});
// 	} catch (err: any) {
// 		const loginError = err?.response?.data?.data?.identity;
// 		const message = err?.response?.data?.message;
// 		const details = err?.response?.data?.details;

// 		return json(
// 			{
// 				success: false,
// 				message: loginError === 'invalid login credentials'
// 					? 'Invalid email or password.'
// 					: 'Login failed. No user found for this email/password.',
// 				error: err?.response?.data
// 			},
// 			{ status: 400 }
// 		);
// 	}
// };

import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();

	try {
		// 🔐 Authenticate user
		const { record } = await locals.pb
			.collection('users')
			.authWithPassword(data.email, data.password);

		// ❌ Email not verified
		if (!record.verified) {
			locals.pb.authStore.clear();
			await locals.pb.collection('users').requestVerification(data.email);

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

		if (!restaurantIds.includes(restaurant.id)) {
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
		return json(
			{
				error: true,
				message: 'Invalid email or password.'
			},
			{ status: 400 }
		);
	}
};
