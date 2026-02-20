// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url, locals, request }) => {
	try {
		const token = cookies.get('pb_auth');
		const pathname = url.pathname;
		const isAdminLoginPage = pathname === '/admin/admin-login';

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
		let restaurant = null;
		try {
			const restaurants = await locals.pb.collection('restaurants').getFullList({
				filter: `domain="${domainOnly}"`
			});
			restaurant = restaurants?.[0];
		} catch (err) {
			console.error('Error fetching restaurant:', err);
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

		// Check subscription for non-super restaurants
		let subscription = null;
		let subscriptionStatus = 'active';

		// Skip subscription check for billing page or super restaurants
		if (!locals.isSuper && !pathname.startsWith('/admin/billing')) {
			try {
				const subs = await locals.pb
					.collection('subscriptions')
					.getFirstListItem(`restaurantId = "${restaurant.id}"`);
				subscription = subs;

				const now = new Date();
				const endDate = new Date(subs.endDate);

				if (subs.status === 'inactive' || subs.status === 'cancelled') {
					if (endDate <= now) {
						subscriptionStatus = 'cancelled';
					} else {
						const sevenDaysFromNow = new Date();
						sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
						subscriptionStatus = endDate <= sevenDaysFromNow ? 'expiring_soon' : 'active';
					}
				} else if (subs.status === 'pending') {
					subscriptionStatus = 'pending';
				} else if (endDate <= now) {
					subscriptionStatus = 'expired';
				} else {
					const sevenDaysFromNow = new Date();
					sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
					subscriptionStatus = endDate <= sevenDaysFromNow ? 'expiring_soon' : 'active';
				}

				// Block access if subscription is expired, cancelled, or not_subscribed
				if (
					subscriptionStatus === 'expired' ||
					subscriptionStatus === 'cancelled' ||
					subscriptionStatus === 'not_subscribed'
				) {
					if (!pathname.startsWith('/admin/billing')) {
						throw redirect(307, '/admin/billing?expired=1');
					}
				}
			} catch (err: any) {
				// If it's a redirect, rethrow it
				if (err.status === 307) throw err;
				subscriptionStatus = 'not_subscribed';
			}
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
