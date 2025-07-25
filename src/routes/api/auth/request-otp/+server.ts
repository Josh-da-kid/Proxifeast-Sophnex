// routes/api/auth/request-otp/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { email } = await request.json();

	try {
		await locals.pb.collection('users').requestOTP(email);
		return json({ success: true, message: 'OTP sent to email.' });
	} catch (err: any) {
		return json({ success: false, message: 'Failed to send OTP.', error: err }, { status: 500 });
	}
};
