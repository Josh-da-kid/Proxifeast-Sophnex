import { json, type RequestHandler } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json(); // using JSON from fetch body

	try {
		const { token, record } = await pb
			.collection('users')
			.authWithPassword(data.email, data.password);

		if (!record.verified) {
			pb.authStore.clear();

			await pb.collection('users').requestVerification(data.email);

			return json({
				error: true,
				message: "Email not verified. We've sent a new verification link.",
				email: data.email
			}, { status: 403 });
		}

		// Success
		return json({
			error: false,
			message: 'Login successful!'
		});
	} catch (err: any) {
	const loginError = err?.response?.data?.data?.identity;
    const message = err?.response?.data?.message;
	const details = err?.response?.data?.details;
    console.log(loginError)
    console.log(message)
    console.log(details)

	if (loginError === 'invalid login credentials') {
		return json(
			{ success: false, message: 'Invalid email or password.' },
			{ status: 400 }
		);
	}

	return json(
		{
			success: false,
			message: 'Login failed.',
			error: err?.response?.data
		},
		{ status: 400 }
	);
}

};


