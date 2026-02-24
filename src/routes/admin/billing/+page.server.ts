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
		// Fetch all restaurants
		const allRestaurants: any[] = await locals.pb.collection('restaurants').getFullList();

		if (!allRestaurants || allRestaurants.length === 0) {
			return defaults;
		}

		// Find super restaurant
		const superRestaurant = allRestaurants.find((r: any) => r.isSuper === true);

		// Get user's restaurant IDs from auth
		const userRestaurantIds = locals.user?.restaurantIds || [];
		const userAdminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const isUserAdmin = locals.user?.isAdmin === true;

		// Backward compatibility: check old restaurantId field too
		if (locals.user?.restaurantId && !userRestaurantIds.includes(locals.user.restaurantId)) {
			userRestaurantIds.push(locals.user.restaurantId);
		}

		console.log('=== BILLING PAGE DEBUG ===');
		console.log('locals.user:', locals.user?.email);
		console.log('isAdmin:', isUserAdmin);
		console.log('userRestaurantIds:', userRestaurantIds);
		console.log('userAdminRestaurantIds:', userAdminRestaurantIds);
		console.log('superRestaurant:', superRestaurant?.name, superRestaurant?.id);
		console.log('=========================');

		// Check if user should see super overview - must be admin AND have access to super restaurant
		const hasAccessToSuper =
			isUserAdmin &&
			superRestaurant &&
			(userRestaurantIds.includes(superRestaurant.id) ||
				userAdminRestaurantIds.includes(superRestaurant.id));

		// If user has access to super, always show super overview
		if (hasAccessToSuper) {
			console.log('User has access to super - showing super overview');

			const subscriptions = await locals.pb.collection('subscriptions').getFullList({
				sort: '-created'
			});
			const restaurantsList = allRestaurants.filter((r) => r.isSuper !== true);

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

			return {
				subscriptionStatus: 'active',
				subscription: null,
				previousSubscriptions: [],
				isSuper: true,
				paystackKey: superRestaurant?.paystackKey || '',
				supportEmail: superRestaurant?.supportEmail || 'support@proxifeast.com',
				expired: false,
				restaurant: null,
				subscriptions,
				restaurants: restaurantsList,
				hasUsedFreeTrial: false,
				stats
			};
		}

		// If user doesn't have super access, continue with regular restaurant logic
		const host = request.headers.get('host') || '';
		const domainOnly = host.split(':')[0].replace('www.', '').toLowerCase();

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

		// If still not found, return defaults
		if (!restaurant) {
			return defaults;
		}

		console.log('Fetching subscription for restaurant:', restaurant.id, restaurant.name);

		// Get subscription for this restaurant
		const subs: any = await locals.pb.collection('subscriptions').getList(1, 1, {
			filter: `restaurantId = "${restaurant.id}"`,
			sort: '-created'
		});

		console.log('Subscription query result:', subs.items);

		let subscription: any = null;
		let subscriptionStatus = 'not_subscribed';

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
		const previousSubscriptions = allSubs.items || [];
		const subscriptions = subscription ? [subscription] : [];
		const restaurantsList = [restaurant];

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

		// Get super restaurant for settings
		const paystackKey = superRestaurant?.paystackKey || '';
		const supportEmail = superRestaurant?.supportEmail || 'support@proxifeast.com';

		return {
			subscriptionStatus,
			subscription,
			previousSubscriptions,
			isSuper: false,
			paystackKey,
			supportEmail,
			expired: url.searchParams.get('expired') === '1',
			restaurant,
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
