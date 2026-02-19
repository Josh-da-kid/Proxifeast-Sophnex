// src/routes/api/oauth-callback/+server.ts

import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, request, locals }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const provider = url.searchParams.get('provider');

	if (!code || !provider) {
		return redirect(303, '/login?error=oauth_failed');
	}

	try {
		const host = request.headers.get('host') || '';
		const domain = host.split(':')[0];
		const origin = `${url.protocol}//${host}`;

		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);

		const redirectUrl = `${origin}/api/oauth-callback`;

		const authData = await locals.pb
			.collection('users')
			.authWithOAuth2Code(provider, code, '', redirectUrl);

		const user = authData.record;

		let restaurantIds = user.restaurantIds || [];
		if (restaurantIds.length === 0 && user.restaurantId) {
			restaurantIds = [user.restaurantId];
		}

		if (!restaurantIds.includes(restaurant.id)) {
			restaurantIds.push(restaurant.id);
			await locals.pb.collection('users').update(user.id, { restaurantIds });
		}

		locals.user = user;

		return redirect(303, '/?oauth=success');
	} catch (err) {
		console.error('OAuth callback error:', err);
		return redirect(303, '/login?error=oauth_failed');
	}
};
