// src/routes/api/debug-create-user/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();
		const { email, password } = data;

		const user = await locals.pb.collection('users').create({
			email,
			password,
			passwordConfirm: password,
			restaurantIds: ['test-restaurant'],
			verified: true
		});

		return json({ success: true, userId: user.id });
	} catch (err: any) {
		console.error('Create user error:', err);
		return json({ error: err.message, details: err.data }, { status: 500 });
	}
};
