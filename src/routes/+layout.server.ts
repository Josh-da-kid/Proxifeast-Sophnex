import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperRestaurant, resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const load: LayoutServerLoad = async ({ locals, request, url }) => {
	try {
		const fullHost = request.headers.get('host') || '';

		const restaurant = await resolveRestaurantByDomain(locals.pb, fullHost, {
			allowSuperFallback: false
		}).catch(() => null);

		if (!restaurant) {
			throw redirect(307, '/not-found');
		}

		locals.restaurant = restaurant;

		const isSuper = isSuperRestaurant(restaurant);

		// For non-super restaurants on root path, redirect to their store page
		// This prevents any flash of content by doing redirect in layout (earliest possible)
		if (!isSuper && url.pathname === '/') {
			throw redirect(307, `/stores/${restaurant.id}`);
		}

		let filteredRestaurants: any[] = [];
		let allRestaurants: any[] = [];

		if (isSuper) {
			allRestaurants = await locals.pb
				.collection('restaurants')
				.getFullList({
					fields:
						'id,name,isSuper,state,localGovernment,restaurantAddress,openingTime,closingTime,orderServices,galleryImages,paystackKey,type,features,domain'
				})
				.catch(() => []);
			filteredRestaurants = allRestaurants.filter((r: any) => !isSuperRestaurant(r));
		}

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
			restaurantId: restaurant.id,
			isAdminForRestaurant
		};
	} catch (err: any) {
		// Re-throw redirects so SvelteKit can handle them properly
		if (err.status === 307 || err.status === 308 || err.location) {
			throw err;
		}

		// Ignore abort errors - they're caused by navigation redirects
		if (err.isAbort || err.message?.includes('aborted')) {
			throw err;
		}

		console.error('Layout server error:', err.message || err);
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
