// src/routes/admin/billing/+page.server.ts

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	// Get base data from layout - user, restaurant, subscription status already checked
	const layoutData = await parent();

	const { restaurant, isSuper, subscription, subscriptionStatus } = layoutData;

	// For super restaurants, get all subscriptions and non-super restaurants
	// For non-super restaurants, just show their own subscription
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
			restaurants = [restaurant].filter(Boolean);
		}

		return {
			subscriptionStatus,
			subscription,
			isSuper,
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
			isSuper,
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
