// src/routes/admin/billing/+page.server.ts

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, request }) => {
	// Get restaurant from domain
	const host = request.headers.get('host') || '';
	const domainOnly = host.split(':')[0];

	let restaurant = null;
	let isSuperUser = false;

	try {
		const restaurants = await locals.pb.collection('restaurants').getFullList({
			filter: `domain="${domainOnly}"`
		});

		if (restaurants.length > 0) {
			restaurant = restaurants[0];
			isSuperUser = restaurant.isSuper === true;
		}
	} catch (err) {
		console.error('Error fetching restaurant:', err);
	}

	// Get super restaurant settings
	let paystackKey = '';
	let supportEmail = 'support@proxifeast.com';

	try {
		const superRestaurants = await locals.pb.collection('restaurants').getFullList({
			filter: 'isSuper = true'
		});

		if (superRestaurants.length > 0) {
			paystackKey = superRestaurants[0].paystackKey || '';
			supportEmail = superRestaurants[0].supportEmail || 'support@proxifeast.com';
		}
	} catch (err) {
		console.error('Error getting super restaurant:', err);
	}

	// Get subscription data
	let subscription: any = null;
	let subscriptionStatus = isSuperUser ? 'active' : 'not_subscribed';
	let previousSubscriptions: any[] = [];
	let subscriptions: any[] = [];
	let restaurants: any[] = [];

	try {
		if (!isSuperUser && restaurant?.id) {
			const subs = await locals.pb.collection('subscriptions').getList(1, 1, {
				filter: `restaurantId = "${restaurant.id}"`,
				sort: '-created'
			});

			if (subs.items.length > 0) {
				subscription = subs.items[0];

				const now = new Date();
				const endDate = new Date(subscription.endDate);
				const sevenDays = new Date();
				sevenDays.setDate(sevenDays.getDate() + 7);

				// Check subscription status based on endDate and status field
				if (subscription.status === 'pending') {
					subscriptionStatus = 'pending';
				} else if (subscription.status === 'cancelled' || subscription.status === 'inactive') {
					subscriptionStatus = endDate > now ? 'active' : 'cancelled';
				} else if (endDate <= now) {
					subscriptionStatus = 'expired';
				} else if (endDate <= sevenDays) {
					subscriptionStatus = 'expiring_soon';
				} else {
					subscriptionStatus = 'active';
				}
			}

			// Get all previous subscriptions
			const allSubs = await locals.pb.collection('subscriptions').getList(1, 50, {
				filter: `restaurantId = "${restaurant.id}"`,
				sort: '-created'
			});
			previousSubscriptions = allSubs.items;
		}

		// Get all subscriptions for super admin
		if (isSuperUser) {
			subscriptions = await locals.pb.collection('subscriptions').getFullList({
				sort: '-created'
			});
			restaurants = await locals.pb.collection('restaurants').getFullList({
				filter: 'isSuper = false'
			});
		}
	} catch (err) {
		console.error('Subscription error:', err);
	}

	const now = new Date();
	const sevenDaysFromNow = new Date();
	sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

	const activeSubs = subscriptions.filter((s: any) => new Date(s.endDate) > now);
	const expiringSoonSubs = subscriptions.filter((s: any) => {
		const endDate = new Date(s.endDate);
		return endDate > now && endDate <= sevenDaysFromNow;
	});
	const expiredSubs = subscriptions.filter((s: any) => new Date(s.endDate) <= now);

	const totalRevenue = activeSubs.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

	const stats = {
		total: subscriptions.length,
		active: activeSubs.length,
		expiringSoon: expiringSoonSubs.length,
		expired: expiredSubs.length,
		totalRevenue,
		monthlyRevenue: 0
	};

	return {
		subscriptionStatus,
		subscription,
		previousSubscriptions,
		isSuper: isSuperUser,
		paystackKey,
		supportEmail,
		expired: url.searchParams.get('expired') === '1',
		restaurant: isSuperUser ? null : restaurant,
		subscriptions,
		restaurants,
		stats
	};
};
