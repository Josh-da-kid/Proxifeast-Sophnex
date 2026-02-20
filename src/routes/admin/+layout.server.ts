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

			console.log(
				'Subscription check - status:',
				subs.status,
				'endDate:',
				subs.endDate,
				'now:',
				now,
				'endDate<=now:',
				endDate <= now
			);

			if (subs.status === 'inactive' || subs.status === 'cancelled') {
				subscriptionStatus = 'cancelled';
			} else if (subs.status === 'pending') {
				subscriptionStatus = 'pending';
			} else if (endDate <= now) {
				subscriptionStatus = 'expired';
			} else {
				const sevenDaysFromNow = new Date();
				sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
				if (endDate <= sevenDaysFromNow) {
					subscriptionStatus = 'expiring_soon';
				} else {
					subscriptionStatus = 'active';
				}
			}
		} catch (err) {
			subscriptionStatus = 'not_subscribed';
		}

		// Block access if subscription is expired, cancelled, not_subscribed, or inactive
		// Allow access to billing page only
		if (
			subscriptionStatus === 'expired' ||
			subscriptionStatus === 'cancelled' ||
			subscriptionStatus === 'not_subscribed'
		) {
			// Don't redirect if already on billing page
			if (pathname !== '/admin/billing' && !pathname.startsWith('/admin/billing?')) {
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
