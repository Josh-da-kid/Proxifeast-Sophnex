
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import pb from '$lib/pb';

export const load: LayoutServerLoad = async ({ locals, cookies, url, request }) => {
	const token = cookies.get('auth_token');

	// 🧠 Get domain from request
	// const fullHost = request.headers.get('host') || '';
	// const domainOnly = fullHost.split(':')[0]; // Removes :5173 if present

	const fullHost = request.headers.get('host') || '';
let domainOnly = fullHost;

if (domainOnly.startsWith('localhost')) {
	// remove the port only on localhost
	domainOnly = domainOnly.split(':')[0];
}


	// 🔎 Find the restaurant by domain
	const restaurants = await pb.collection('restaurants').getFullList({
		filter: `domain="${domainOnly}"`
	});

	const restaurant = restaurants?.[0];

	if (!restaurant) {
		console.error(`❌ Restaurant not found for domain: ${domainOnly}`);
		throw redirect(307, '/not-found'); // or handle however you want
	}

	// ✅ Set restaurant in locals
	locals.restaurant = restaurant;

	return {
		user: locals.user ?? null,
		restaurant
	};
};

