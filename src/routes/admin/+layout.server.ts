// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url, locals, request }) => {
	try {
		const token = cookies.get('pb_auth');
		const pathname = url.pathname;
		const isAdminLoginPage = pathname === '/admin/admin-login';
		const isBillingPage = pathname.startsWith('/admin/billing');

		if (!token && !isAdminLoginPage) {
			throw redirect(302, `/admin/admin-login?redirectTo=${pathname}`);
		}

		if (token && !locals.user) {
			locals.pb.authStore.clear();
			cookies.delete('pb_auth', { path: '/' });
			throw redirect(303, `/admin/admin-login?redirectTo=${pathname}&not_admin=1`);
		}

		const fullHost = request.headers.get('host') || '';
		const domainOnly = fullHost.split(':')[0].replace('www.', '');

		// Find the restaurant by domain
		let restaurant: any = null;
		let restaurants: any[] = [];
		try {
			restaurants = await locals.pb.collection('restaurants').getFullList();

			// First, try to find by exact domain match
			restaurant = restaurants?.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '').toLowerCase();
				const checkDomain = domainOnly.toLowerCase();
				return rDomain === checkDomain;
			});

			// If not found, try partial match (subdomain support)
			if (!restaurant) {
				restaurant = restaurants?.find((r: any) => {
					const rDomain = (r.domain || '').replace('www.', '').toLowerCase();
					const checkDomain = domainOnly.toLowerCase();
					return checkDomain.includes(rDomain) || rDomain.includes(checkDomain);
				});
			}
		} catch (err) {
			console.error('Error fetching restaurant:', err);
		}

		// If still not found, try to find any super restaurant as fallback
		if (!restaurant && restaurants.length > 0) {
			restaurant = restaurants.find((r: any) => r.isSuper === true);
		}

		if (!restaurant) {
			console.error(`Restaurant not found for domain: ${domainOnly}, host: ${fullHost}`);
			return {
				user: locals.user,
				restaurant: null,
				isSuper: false,
				isSuperUser: false,
				isAdminForRestaurant: false,
				restaurantId: null,
				subscription: null,
				subscriptionStatus: 'active'
			};
		}

		locals.restaurant = restaurant;
		locals.isSuper = restaurant?.isSuper === true;

		// Check if user is admin for this specific restaurant
		// Use adminRestaurantIds if available (granular admin), fall back to global isAdmin + restaurantIds for backward compatibility
		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const userRestaurantIds = locals.user?.restaurantIds || [];

		let isAdminForRestaurant = false;

		// If user has specific adminRestaurantIds, check those
		if (adminRestaurantIds.length > 0) {
			isAdminForRestaurant = adminRestaurantIds.includes(restaurant.id);
		} else {
			// Fallback: use global isAdmin flag with restaurantIds (backward compatibility)
			isAdminForRestaurant =
				locals.user?.isAdmin === true && userRestaurantIds.includes(restaurant.id);
		}

		// Redirect if not admin for this restaurant (but allow login page)
		if (!isAdminForRestaurant && !isAdminLoginPage) {
			locals.pb.authStore.clear();
			cookies.delete('pb_auth', { path: '/' });
			throw redirect(303, `/admin/admin-login?redirectTo=${pathname}&not_admin=1`);
		}

		// For super restaurants, skip all subscription checks
		if (locals.isSuper) {
			return {
				user: locals.user,
				restaurant,
				isSuper: locals.isSuper,
				isSuperUser: locals.isSuper,
				isAdminForRestaurant,
				restaurantId: restaurant?.id,
				subscription: null,
				subscriptionStatus: 'active'
			};
		}

		// Check subscription for non-super restaurants
		let subscription = null;
		let subscriptionStatus = 'not_subscribed';

		try {
			const subs = await locals.pb
				.collection('subscriptions')
				.getFirstListItem(`restaurantId = "${restaurant.id}"`);
			subscription = subs;

			const now = new Date();
			const endDate = new Date(subs.endDate);
			const sevenDaysFromNow = new Date();
			sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

			// Determine subscription status
			// IMPORTANT: Database status takes precedence - if not 'active' in DB, treat as not active
			if (subs.status === 'test') {
				// Test subscriptions (free trial) - treat as active for access
				if (endDate <= now) {
					subscriptionStatus = 'expired';
				} else {
					subscriptionStatus = 'active'; // Treat as active for access
				}
			} else if (subs.status === 'pending') {
				subscriptionStatus = 'pending';
			} else if (subs.status === 'cancelled' || subs.status === 'inactive') {
				subscriptionStatus = 'cancelled';
			} else if (subs.status !== 'active') {
				// Any other status that's not 'active'
				subscriptionStatus = 'not_subscribed';
			} else if (endDate <= now) {
				// Only check endDate if status is 'active'
				subscriptionStatus = 'expired';
			} else if (endDate <= sevenDaysFromNow) {
				subscriptionStatus = 'expiring_soon';
			} else {
				subscriptionStatus = 'active';
			}
		} catch (err) {
			subscriptionStatus = 'not_subscribed';
			subscription = null;
		}

		// Block access if subscription is not active
		// Only allow access to billing page
		// Test subscriptions are treated as active
		const isSubscriptionActive =
			subscriptionStatus === 'active' ||
			subscriptionStatus === 'expiring_soon' ||
			subscriptionStatus === 'test';

		// Always allow access to billing page - never redirect from there
		if (!isSubscriptionActive && !isBillingPage) {
			// Not on billing page and subscription is not active - redirect to billing
			throw redirect(307, '/admin/billing?expired=1');
		}

		return {
			user: locals.user,
			restaurant,
			isSuper: locals.isSuper,
			isSuperUser: locals.isSuper,
			isAdminForRestaurant,
			restaurantId: restaurant?.id,
			subscription,
			subscriptionStatus
		};
	} catch (err: any) {
		// Rethrow redirects
		if (err.status === 302 || err.status === 303 || err.status === 307) {
			throw err;
		}
		console.error('Admin layout error:', err);
		return {
			user: locals.user || null,
			restaurant: null,
			isSuper: false,
			isSuperUser: false,
			isAdminForRestaurant: false,
			restaurantId: null,
			subscription: null,
			subscriptionStatus: 'active'
		};
	}
};
