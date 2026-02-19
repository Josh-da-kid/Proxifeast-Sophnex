// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url, locals, request }) => {
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
	const domainOnly = fullHost.split(':')[0]; // Removes :5173 if present

	// 🔎 Find the restaurant by domain
	const restaurants = await locals.pb.collection('restaurants').getFullList({
		filter: `domain="${domainOnly}"`
	});

	const restaurant = restaurants?.[0];

	if (!restaurant) {
		console.error(`❌ Restaurant not found for domain: ${domainOnly}`);
		throw redirect(307, '/not-found'); // or handle however you want
	}

	// ✅ Set restaurant in locals
	locals.restaurant = restaurant;
	locals.isSuper = restaurant?.isSuper === true;

	// Check subscription for non-super restaurants
	let subscription = null;
	let subscriptionStatus = 'active';

	if (!locals.isSuper) {
		try {
			const subs = await locals.pb
				.collection('subscriptions')
				.getFirstListItem(`restaurantId = "${restaurant.id}"`);
			subscription = subs;

			const now = new Date();
			const endDate = new Date(subs.endDate);

			if (endDate <= now) {
				subscriptionStatus = 'expired';
			} else if (subs.status === 'cancelled') {
				subscriptionStatus = 'cancelled';
			} else {
				const thirtyDaysFromNow = new Date();
				thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
				if (endDate <= thirtyDaysFromNow) {
					subscriptionStatus = 'expiring_soon';
				}
			}
		} catch (err) {
			subscriptionStatus = 'not_subscribed';
		}

		// Block access if subscription is expired, cancelled, or not subscribed
		// Only for non-super restaurants, and only if NOT already on billing page
		if (
			!locals.isSuper &&
			(subscriptionStatus === 'expired' ||
				subscriptionStatus === 'cancelled' ||
				subscriptionStatus === 'not_subscribed')
		) {
			// Allow access to billing page - don't redirect if already there
			if (pathname !== '/admin/billing' && !pathname.startsWith('/admin/billing?')) {
				console.log(`Redirecting to billing - subscription status: ${subscriptionStatus}`);
				throw redirect(307, '/admin/billing?expired=1');
			}
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
};
