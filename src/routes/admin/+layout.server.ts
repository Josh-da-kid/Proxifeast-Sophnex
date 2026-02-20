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

		if (token && (!locals.user || !locals.user.isAdmin)) {
			locals.pb.authStore.clear();
			cookies.delete('pb_auth', { path: '/' });
			throw redirect(303, `/admin/admin-login?redirectTo=${pathname}&not_admin=1`);
		}

		const fullHost = request.headers.get('host') || '';
		const domainOnly = fullHost.split(':')[0];

		// Find the restaurant by domain
		let restaurant: any = null;
		let restaurants: any[] = [];
		try {
			restaurants = await locals.pb.collection('restaurants').getFullList();
			restaurant = restaurants?.find((r: any) => r.domain === domainOnly);
		} catch (err) {
			console.error('Error fetching restaurant:', err);
		}

		if (!restaurant && restaurants.length > 0) {
			// Try to find by isSuper if domain lookup failed
			restaurant = restaurants.find((r: any) => r.isSuper === true);
		}

		if (!restaurant) {
			console.error(`Restaurant not found for domain: ${domainOnly}`);
			return {
				user: locals.user,
				restaurant: null,
				isSuper: false,
				restaurantId: null,
				subscription: null,
				subscriptionStatus: 'active'
			};
		}

		locals.restaurant = restaurant;
		locals.isSuper = restaurant?.isSuper === true;

		// For super restaurants, skip all subscription checks
		if (locals.isSuper) {
			return {
				user: locals.user,
				restaurant,
				isSuper: locals.isSuper,
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
			if (subs.status === 'pending') {
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
		const isSubscriptionActive =
			subscriptionStatus === 'active' || subscriptionStatus === 'expiring_soon';

		if (!isSubscriptionActive && !isBillingPage) {
			// Not on billing page and subscription is not active - redirect to billing
			throw redirect(307, '/admin/billing?expired=1');
		}

		return {
			user: locals.user,
			restaurant,
			isSuper: locals.isSuper,
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
			restaurantId: null,
			subscription: null,
			subscriptionStatus: 'active'
		};
	}
};
