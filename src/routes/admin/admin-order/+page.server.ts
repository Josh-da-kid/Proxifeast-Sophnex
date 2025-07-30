import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];
	// console.log("domain:", domain)

	try {
		// ✅ Look up the restaurant by domain
		const restaurant = await locals.pb.collection('restaurants').getFirstListItem(`domain = "${domain}"`);

		const restaurantId = restaurant.id;

		return {
			restaurant,
			restaurantId
		};
	} catch (error) {
		console.error('Error loading restaurant or dishes:', error);
		return {
			dishes: [],
		
			error: 'Restaurant not found or failed to load dishes'
		};
	}
};