// src/routes/admin/billing/+page.server.ts

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	// Get base data from layout
	const layoutData = await parent();

	const {
		restaurant,
		isSuper,
		subscription: layoutSubscription,
		subscriptionStatus: layoutStatus
	} = layoutData;

	// Get super restaurant's paystackKey and support email for payment
	let paystackKey = '';
	let supportEmail = 'support@proxifeast.com';
	try {
		const superRestaurants = await locals.pb.collection('restaurants').getFullList({
			filter: 'isSuper = true'
		});
		paystackKey = superRestaurants?.[0]?.paystackKey || '';
		supportEmail = superRestaurants?.[0]?.supportEmail || 'support@proxifeast.com';
	} catch (err) {
		console.error('Error getting super restaurant paystackKey:', err);
	}

	// Fetch fresh subscription data for non-super restaurants
	let subscription = layoutSubscription;
	let subscriptionStatus = layoutStatus;
	let previousSubscriptions: any[] = [];

	if (!isSuper && restaurant) {
		try {
			const subs = await locals.pb
				.collection('subscriptions')
				.getFirstListItem(`restaurantId = "${restaurant.id}"`);
			subscription = subs;

			const now = new Date();
			const endDate = new Date(subs.endDate);

			if (subs.status === 'inactive' || subs.status === 'cancelled') {
				subscriptionStatus = 'cancelled';
			} else if (endDate <= now) {
				subscriptionStatus = 'expired';
			} else {
				const thirtyDaysFromNow = new Date();
				thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
				if (endDate <= thirtyDaysFromNow) {
					subscriptionStatus = 'expiring_soon';
				} else {
					subscriptionStatus = 'active';
				}
			}

			// Get all previous subscriptions for this restaurant
			const allSubs = await locals.pb.collection('subscriptions').getList(1, 50, {
				filter: `restaurantId = "${restaurant.id}"`,
				sort: '-created'
			});
			previousSubscriptions = allSubs.items.filter((s: any) => s.id !== subscription?.id);
		} catch (err) {
			subscriptionStatus = 'not_subscribed';
			subscription = null;
		}
	}

	// For super restaurants, get all subscriptions and non-super restaurants
	try {
		let subscriptions: any[] = [];
		let restaurants: any[] = [];
		let stats = {
			total: 0,
			active: 0,
			expiringSoon: 0,
			expired: 0,
			totalRevenue: 0,
			monthlyRevenue: 0
		};

		if (isSuper) {
			// Super users can see all subscriptions
			subscriptions = await locals.pb.collection('subscriptions').getFullList({
				sort: '-created'
			});

			restaurants = await locals.pb.collection('restaurants').getFullList({
				filter: 'isSuper = false'
			});

			const now = new Date();
			const thirtyDaysFromNow = new Date();
			thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

			const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active');
			const expiringSoon = subscriptions.filter((s: any) => {
				const endDate = new Date(s.endDate);
				return s.status === 'active' && endDate <= thirtyDaysFromNow && endDate > now;
			});
			const expired = subscriptions.filter((s: any) => {
				const endDate = new Date(s.endDate);
				return s.status === 'active' && endDate <= now;
			});

			const totalRevenue = activeSubscriptions.reduce(
				(sum: number, s: any) => sum + (s.amount || 0),
				0
			);

			stats = {
				total: subscriptions.length,
				active: activeSubscriptions.length,
				expiringSoon: expiringSoon.length,
				expired: expired.length,
				totalRevenue,
				monthlyRevenue: 0
			};
		} else if (subscription) {
			// Non-super users only see their own subscription
			subscriptions = [subscription];
			restaurants = restaurant ? [restaurant] : [];
		}

		return {
			subscriptionStatus,
			subscription,
			previousSubscriptions,
			isSuper,
			paystackKey,
			supportEmail,
			expired: url.searchParams.get('expired') === '1',
			restaurant: isSuper ? null : restaurant,
			subscriptions,
			restaurants,
			stats
		};
	} catch (err) {
		console.error('Billing load error:', err);
		return {
			subscriptionStatus,
			subscription,
			previousSubscriptions,
			isSuper,
			paystackKey,
			supportEmail,
			expired: false,
			subscriptions: [],
			restaurants: [],
			stats: {
				total: 0,
				active: 0,
				expiringSoon: 0,
				expired: 0,
				totalRevenue: 0,
				monthlyRevenue: 0
			}
		};
	}
};
