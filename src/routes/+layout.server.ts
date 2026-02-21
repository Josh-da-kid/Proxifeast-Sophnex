import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import pb from '$lib/pb';

export const load: LayoutServerLoad = async ({ locals, cookies, url, request }) => {
	try {
		const token = cookies.get('auth_token');

		// Get domain from request
		const fullHost = request.headers.get('host') || '';
		const domainOnly = fullHost.split(':')[0].replace('www.', '');

		// Find restaurant by domain - use getFullList for reliability
		const allRestaurants = await pb.collection('restaurants').getFullList();
		let restaurant = allRestaurants.find((r: any) => {
			const rDomain = (r.domain || '').replace('www.', '');
			return rDomain === domainOnly || domainOnly.includes(rDomain) || rDomain.includes(domainOnly);
		});

		// If not found by domain, check if this is a super restaurant domain
		if (!restaurant) {
			const superRest = allRestaurants.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '');
				return (
					r.isSuper === true &&
					(rDomain === domainOnly || domainOnly.includes(rDomain) || rDomain.includes(domainOnly))
				);
			});
			if (superRest) {
				restaurant = superRest;
			}
		}

		if (!restaurant) {
			console.error(`Restaurant not found for domain: ${domainOnly}, host: ${fullHost}`);
			throw redirect(307, '/not-found');
		}

		// Set restaurant in locals
		locals.restaurant = restaurant;

		// Check if super restaurant
		const isSuper = restaurant?.isSuper === true;

		// Filter allRestaurants for non-super restaurants (for dropdowns)
		const filteredRestaurants = allRestaurants.filter((r: any) => r.isSuper !== true);

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
		console.error('Layout server error:', err);
		// Return minimal data on error to prevent 500
		return {
			user: locals.user ?? null,
			restaurant: null,
			allRestaurants: [],
			isSuper: false,
			isSuperUser: false,
			restaurantId: null,
			isAdminForRestaurant: false
		};
	}
};
