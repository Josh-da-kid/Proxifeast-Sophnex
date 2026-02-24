// src/routes/admin/billing/+page.server.ts

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, request }) => {
	const defaults = {
		subscriptionStatus: 'active',
		subscription: null,
		previousSubscriptions: [] as any[],
		isSuper: false,
		paystackKey: '',
		supportEmail: 'support@proxifeast.com',
		expired: false,
		restaurant: null,
		subscriptions: [] as any[],
		restaurants: [] as any[],
		hasUsedFreeTrial: false,
		stats: {
			total: 0,
			active: 0,
			expiringSoon: 0,
			expired: 0,
			testCount: 0,
			totalRevenue: 0,
			monthlyRevenue: 0
		}
	};

	try {
		// Get host from request
		const host = request.headers.get('host') || '';
		const domainOnly = host.split(':')[0].replace('www.', '').toLowerCase();

		// Fetch all restaurants
		const allRestaurants: any[] = await locals.pb.collection('restaurants').getFullList();

		if (!allRestaurants || allRestaurants.length === 0) {
			return defaults;
		}

		// Find super restaurant
		const superRestaurant = allRestaurants.find((r: any) => r.isSuper === true);

		// Check if user is a super admin (set by layout during auth)
		// If locals.isSuper is true, always treat as super restaurant
		const isLocalsSuper = locals.isSuper === true;

		// Find restaurant by domain
		let restaurant = allRestaurants.find((r: any) => {
			const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
			return rDomain === domainOnly;
		});

		// If not found, try partial match
		if (!restaurant) {
			restaurant = allRestaurants.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
				return domainOnly.includes(rDomain) || rDomain.includes(domainOnly);
			});
		}

		// If still not found, use super restaurant
		if (!restaurant && superRestaurant) {
			restaurant = superRestaurant;
		}

		// Check if this is a super restaurant
		// Use locals.isSuper first (set by auth), then fall back to restaurant.isSuper
		const isSuperRestaurant = isLocalsSuper || restaurant?.isSuper === true;

		// If user is super admin but domain didn't match, use super restaurant
		if (isLocalsSuper && !isSuperRestaurant && superRestaurant) {
			restaurant = superRestaurant;
		}

		console.log('=== BILLING PAGE DEBUG ===');
		console.log('Host:', host);
		console.log('Domain:', domainOnly);
		console.log('locals.isSuper:', locals.isSuper);
		console.log('Restaurant found:', restaurant?.name, restaurant?.id);
		console.log('isSuperRestaurant:', isSuperRestaurant);
		console.log('=========================');

		// Get super restaurant for settings (for paystack key)
		const superRest = superRestaurant;

		const paystackKey = superRest?.paystackKey || '';
		const supportEmail = superRest?.supportEmail || 'support@proxifeast.com';

		let subscription: any = null;
		let subscriptionStatus = isSuperRestaurant ? 'active' : 'not_subscribed';
		let subscriptions: any[] = [];
		let restaurantsList: any[] = [];
		let previousSubscriptions: any[] = [];

		// If super restaurant, show all subscriptions overview
		if (isSuperRestaurant) {
			subscriptions = await locals.pb.collection('subscriptions').getFullList({
				sort: '-created'
			});
			restaurantsList = allRestaurants.filter((r) => r.isSuper !== true);
		} else if (restaurant?.id) {
			console.log('Fetching subscription for restaurant:', restaurant.id, restaurant.name);

			const subs: any = await locals.pb.collection('subscriptions').getList(1, 1, {
				filter: `restaurantId = "${restaurant.id}"`,
				sort: '-created'
			});

			console.log('Subscription query result:', subs.items);

			if (subs.items && subs.items.length > 0) {
				subscription = subs.items[0];
				console.log('Found subscription:', subscription);

				const now = new Date();
				const endDate = new Date(subscription.endDate);
				console.log('Subscription endDate:', endDate, 'Now:', now, 'Is expired:', endDate <= now);

				if (subscription.status === 'test') {
					if (endDate <= now) {
						subscriptionStatus = 'expired';
					} else {
						subscriptionStatus = 'active';
					}
				} else if (subscription.status === 'pending') {
					subscriptionStatus = 'pending';
				} else if (subscription.status === 'cancelled' || subscription.status === 'inactive') {
					subscriptionStatus = 'cancelled';
				} else if (endDate <= now) {
					subscriptionStatus = 'expired';
					console.log('Setting status to expired');
				} else {
					subscriptionStatus = 'active';
				}
			} else {
				subscriptionStatus = 'not_subscribed';
			}

			console.log('Final subscriptionStatus:', subscriptionStatus);

			const allSubs: any = await locals.pb.collection('subscriptions').getList(1, 50, {
				filter: `restaurantId = "${restaurant.id}"`,
				sort: '-created'
			});
			previousSubscriptions = allSubs.items || [];
			subscriptions = subscription ? [subscription] : [];
			restaurantsList = [restaurant];
		}

		const now = new Date();
		const sevenDaysFromNow = new Date();
		sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

		const activeSubs = subscriptions.filter(
			(s) => s?.endDate && new Date(s.endDate) > now && s.status !== 'test'
		);
		const expiringSoonSubs = subscriptions.filter((s) => {
			if (!s?.endDate) return false;
			const endDate = new Date(s.endDate);
			return endDate > now && endDate <= sevenDaysFromNow;
		});
		const expiredSubs = subscriptions.filter((s) => s?.endDate && new Date(s.endDate) <= now);
		const testSubs = subscriptions.filter(
			(s) => s.status === 'test' && s?.endDate && new Date(s.endDate) > now
		);
		const totalRevenue = activeSubs.reduce((sum, s) => sum + (s.amount || 0), 0);

		const stats = {
			total: subscriptions.length,
			active: activeSubs.length,
			expiringSoon: expiringSoonSubs.length,
			expired: expiredSubs.length,
			testCount: testSubs.length,
			totalRevenue,
			monthlyRevenue: 0
		};

		const hasUsedFreeTrial = subscriptions.some((s) => s.plan === 'weekly');

		return {
			subscriptionStatus,
			subscription,
			previousSubscriptions,
			isSuper: isSuperRestaurant,
			paystackKey,
			supportEmail,
			expired: url.searchParams.get('expired') === '1',
			restaurant: isSuperRestaurant ? null : restaurant,
			subscriptions,
			restaurants: restaurantsList,
			hasUsedFreeTrial,
			stats
		};
	} catch (err: any) {
		console.error('Billing page error:', err);
		return defaults;
	}
};
