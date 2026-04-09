// src/routes/api/oauth-callback/+server.ts

import { redirect, type RequestHandler } from '@sveltejs/kit';
import { getUserRestaurantIds, resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const GET: RequestHandler = async ({ url, request, locals }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const provider = url.searchParams.get('provider');

	if (!code || !provider) {
		return redirect(303, '/login?error=oauth_failed');
	}

	try {
		const host = request.headers.get('host') || '';
		const origin = `${url.protocol}//${host}`;

		const restaurant = await resolveRestaurantByDomain(locals.pb, host, {
			allowSuperFallback: true
		});
		if (!restaurant) {
			return redirect(303, '/login?error=restaurant_not_found');
		}

		const redirectUrl = `${origin}/api/oauth-callback`;

		const authData = await locals.pb
			.collection('users')
			.authWithOAuth2Code(provider, code, '', redirectUrl);

		const user = authData.record;

		const restaurantIds = getUserRestaurantIds(user);

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
