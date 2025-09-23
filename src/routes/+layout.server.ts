import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import pb from '$lib/pb';

export const load: LayoutServerLoad = async ({ locals, cookies, url, request }) => {
	const token = cookies.get('auth_token');

	// 🧠 Get domain from request
	const fullHost = request.headers.get('host') || '';
	const domainOnly = fullHost.split(':')[0]; // Removes :5173 if present

	// 🔎 Find the restaurant by domain
	const restaurants = await pb.collection('restaurants').getFullList({
		filter: `domain="${domainOnly}"`
	});

	const restaurant = restaurants?.[0];

	if (!restaurant) {
		console.error(`❌ Restaurant not found for domain: ${domainOnly}`);
		throw redirect(307, '/not-found');
	}

	// ✅ Build full file URL for the logo
	const logoUrl = restaurant.logo
		? pb.files.getUrl(restaurant, restaurant.logo, { thumb: '100x100' }) // optional thumb size
		: null;

	// ✅ Set restaurant in locals
	locals.restaurant = {
		...restaurant,
		logoUrl // add the resolved URL
	};

	return {
		user: locals.user ?? null,
		restaurant: {
			...restaurant,
			logoUrl
		}
	};
};


