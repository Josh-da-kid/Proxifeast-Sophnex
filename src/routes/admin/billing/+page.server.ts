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

				subscriptionStatus = endDate > now ? 'active' : 'expired';
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
	const stats = {
		total: subscriptions.length,
		active: subscriptions.filter((s: any) => new Date(s.endDate) > now).length,
		expiringSoon: 0,
		expired: subscriptions.filter((s: any) => new Date(s.endDate) <= now).length,
		totalRevenue: 0,
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
