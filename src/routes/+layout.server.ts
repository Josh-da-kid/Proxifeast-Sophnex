import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isSuperRestaurant, resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const load: LayoutServerLoad = async ({ locals, request }) => {
	try {
		const fullHost = request.headers.get('host') || '';
		const restaurant = await resolveRestaurantByDomain(locals.pb, fullHost, {
			allowSuperFallback: false
		});

		if (!restaurant) {
			console.error(`Restaurant not found for host: ${fullHost}`);
			throw redirect(307, '/not-found');
		}

		locals.restaurant = restaurant;

		const isSuper = isSuperRestaurant(restaurant);
		let filteredRestaurants: any[] = [];
		let allRestaurants: any[] = [];

		if (isSuper) {
			allRestaurants = await locals.pb.collection('restaurants').getFullList({
				fields:
					'id,name,isSuper,state,localGovernment,restaurantAddress,openingTime,closingTime,orderServices,galleryImages,paystackKey,type,features,domain'
			});
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
	} catch (err) {
		console.error('Layout server error:', err);
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
