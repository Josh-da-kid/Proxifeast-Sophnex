// src/routes/api/oauth-url/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
	const provider = url.searchParams.get('provider');

	if (!provider) {
		return json({ error: 'Provider required' }, { status: 400 });
	}

	try {
		const redirectUrl = url.origin + '/api/oauth-callback';

		const authData = await locals.pb.collection('users').authWithOAuth2({
			provider: provider,
			url: redirectUrl
		});

		const response = authData as any;

		return json({
			url: response.authUrl || response
		});
	} catch (err: any) {
		console.error('OAuth error:', err);
		return json({ error: err.message, details: err.data }, { status: 500 });
	}
};
