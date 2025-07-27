import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();

	try {
		const { record } = await locals.pb
			.collection('users')
			.authWithPassword(data.email, data.password);

		if (!record.verified) {
			locals.pb.authStore.clear();
			await locals.pb.collection('users').requestVerification(data.email);
			// await locals.pb.collection('users').requestOTP(data.email);

			return json({
				error: true,
				message: "Email not verified. We've sent a new verification link.",
				email: data.email
			}, { status: 403 });
		}

		// Store user in locals (hooks will handle the cookie)
		locals.user = record;

		return json({
			error: false,
			message: 'Login successful!',
			user: record
		});
	} catch (err: any) {
		const loginError = err?.response?.data?.data?.identity;
		const message = err?.response?.data?.message;
		const details = err?.response?.data?.details;

		console.log(loginError, message, details);

		return json(
			{
				success: false,
				message: loginError === 'invalid login credentials'
					? 'Invalid email or password.'
					: 'Login failed.',
				error: err?.response?.data
			},
			{ status: 400 }
		);
	}
};



