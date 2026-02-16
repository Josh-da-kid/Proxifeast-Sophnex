import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import pb from '$lib/pb';

export const load: PageServerLoad = async ({ locals, cookies, url, request }) => {
	// Get domain from request
	const fullHost = request.headers.get('host') || '';
	const domainOnly = fullHost.split(':')[0];

	// Find restaurant by domain
	const restaurants = await pb.collection('restaurants').getFullList({
		filter: `domain="${domainOnly}"`
	});

	const restaurant = restaurants?.[0];

	if (!restaurant) {
		throw redirect(307, '/not-found');
	}

	// Fetch all restaurants for restaurant lookup
	const allRestaurants = await pb.collection('restaurants').getFullList({
		sort: 'name',
		filter: 'name != "ProxifeastLocal"'
	});

	return {
		user: locals.user ?? null,
		restaurant,
		allRestaurants
	};
};
