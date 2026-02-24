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
		const host = request.headers.get('host') || '';
		const domainOnly = host.split(':')[0].replace('www.', '');

		const allRestaurants: any[] = await locals.pb.collection('restaurants').getFullList();

		if (!allRestaurants || allRestaurants.length === 0) {
			return defaults;
		}

		// First, check if there's a super restaurant in the system
		const superRestaurant = allRestaurants.find((r: any) => r.isSuper === true);

		// Find current restaurant by domain (same logic as layout)
		let currentRest = allRestaurants.find((r: any) => {
			const rDomain = (r.domain || '').replace('www.', '').toLowerCase();
			return rDomain === domainOnly.toLowerCase();
		});

		// If not found, try partial match
		if (!currentRest) {
			currentRest = allRestaurants.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '').toLowerCase();
				const checkDomain = domainOnly.toLowerCase();
				return checkDomain.includes(rDomain) || rDomain.includes(checkDomain);
			});
		}

		// If still not found, try to use the super restaurant if domain matches partially
		if (!currentRest && superRestaurant) {
			const superDomain = (superRestaurant.domain || '').replace('www.', '').toLowerCase();
			if (
				domainOnly.toLowerCase().includes(superDomain) ||
				superDomain.includes(domainOnly.toLowerCase())
			) {
				currentRest = superRestaurant;
			}
		}

		// isSuperUser is true only if current restaurant is super
		const isSuperUser = currentRest ? !!currentRest.isSuper : false;

		// Get super restaurant for settings (if current is super, use it; otherwise find one)
		const superRest = isSuperUser ? currentRest : superRestaurant;

		const paystackKey = superRest?.paystackKey || '';
		const supportEmail = superRest?.supportEmail || 'support@proxifeast.com';

		let subscription: any = null;
		let subscriptionStatus = isSuperUser ? 'active' : 'not_subscribed';
		let subscriptions: any[] = [];
		let restaurantsList: any[] = [];
		let previousSubscriptions: any[] = [];

		if (isSuperUser) {
			subscriptions = await locals.pb.collection('subscriptions').getFullList({
				sort: '-created'
			});
			restaurantsList = allRestaurants.filter((r) => r.isSuper !== true);
		} else if (currentRest?.id) {
			const subs: any = await locals.pb.collection('subscriptions').getList(1, 1, {
				filter: `restaurantId = "${currentRest.id}"`,
				sort: '-created'
			});

			if (subs.items && subs.items.length > 0) {
				subscription = subs.items[0];
				const now = new Date();
				const endDate = new Date(subscription.endDate);

				if (subscription.status === 'test') {
					// Test subscriptions are treated as active for display purposes
					if (endDate <= now) {
						subscriptionStatus = 'expired';
					} else {
						subscriptionStatus = 'active'; // Treat as active for UI
					}
				} else if (subscription.status === 'pending') {
					subscriptionStatus = 'pending';
				} else if (subscription.status === 'cancelled' || subscription.status === 'inactive') {
					subscriptionStatus = 'cancelled';
				} else if (endDate <= now) {
					subscriptionStatus = 'expired';
				} else {
					subscriptionStatus = 'active';
				}
			}

			const allSubs: any = await locals.pb.collection('subscriptions').getList(1, 50, {
				filter: `restaurantId = "${currentRest.id}"`,
				sort: '-created'
			});
			previousSubscriptions = allSubs.items || [];
			subscriptions = subscription ? [subscription] : [];
			restaurantsList = [currentRest];
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
			isSuper: isSuperUser,
			paystackKey,
			supportEmail,
			expired: url.searchParams.get('expired') === '1',
			restaurant: isSuperUser ? null : currentRest,
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
