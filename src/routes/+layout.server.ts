import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import pb from '$lib/pb';

export const load: LayoutServerLoad = async ({ locals, cookies, url, request }) => {
	try {
		const token = cookies.get('auth_token');

		// Get domain from request
		const fullHost = request.headers.get('host') || '';
		const domainOnly = fullHost.split(':')[0].replace('www.', '').toLowerCase();

		// Find restaurant by domain - use targeted query instead of getFullList
		let restaurant = null;
		try {
			restaurant = await pb.collection('restaurants').getFirstListItem(`domain ~ "${domainOnly}"`);
		} catch {
			// Try partial match if exact match fails
			try {
				const results = await pb.collection('restaurants').getList(1, 5, {
					filter: `domain ~ "${domainOnly}"`
				});
				if (results.items.length > 0) {
					restaurant = results.items[0];
				}
			} catch {}
		}

		// If not found, try super restaurant
		if (!restaurant) {
			try {
				restaurant = await pb.collection('restaurants').getFirstListItem('isSuper = true');
			} catch {}
		}

		if (!restaurant) {
			console.error(`Restaurant not found for domain: ${domainOnly}, host: ${fullHost}`);
			throw redirect(307, '/not-found');
		}

		// Set restaurant in locals
		locals.restaurant = restaurant;

		// Check if super restaurant
		const isSuper = !!restaurant?.isSuper;

		// Only fetch all restaurants if needed for dropdowns (for super users)
		let filteredRestaurants: any[] = [];
		let allRestaurants: any[] = [];

		if (isSuper) {
			allRestaurants = await pb.collection('restaurants').getFullList({
				fields:
					'id,name,isSuper,state,localGovernment,restaurantAddress,openingTime,closingTime,orderServices,galleryImages'
			});
			filteredRestaurants = allRestaurants.filter((r: any) => r.isSuper !== true);
		}

		// Check if user is admin for this specific restaurant
		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const userRestaurantIds = locals.user?.restaurantIds || [];

		let isAdminForRestaurant = false;

		if (adminRestaurantIds.length > 0) {
			isAdminForRestaurant = adminRestaurantIds.includes(restaurant.id);
		} else {
			isAdminForRestaurant =
				locals.user?.isAdmin === true && userRestaurantIds.includes(restaurant.id);
		}

		return {
			user: locals.user ?? null,
			restaurant,
			allRestaurants: filteredRestaurants,
			allRestaurantsIncludingSuper: allRestaurants,
			isSuper,
			isSuperUser: isSuper,
			restaurantId: restaurant?.id,
			isAdminForRestaurant
		};
	} catch (err) {
		// Don't redirect to not-found here - let the page handle it
		console.error('Layout server error:', err);
		// Return minimal data on error to prevent 500
		return {
			user: locals.user ?? null,
			restaurant: null,
			allRestaurants: [],
			allRestaurantsIncludingSuper: [],
			isSuper: false,
			isSuperUser: false,
			restaurantId: null,
			isAdminForRestaurant: false
		};
	}
};
