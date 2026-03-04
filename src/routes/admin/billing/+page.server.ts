// src/routes/admin/billing/+page.server.ts

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, request }) => {
	// Get current restaurant and determine if it's super
	const restaurantId = locals.restaurant?.id;
	const isCurrentRestaurantSuper = restaurantId
		? locals.restaurant?.isSuper === true || locals.restaurant?.isSuper === 'true'
		: false;

	console.log(
		'Billing - Current restaurant:',
		locals.restaurant?.name,
		'isSuper:',
		isCurrentRestaurantSuper
	);

	const defaults = {
		subscriptionStatus: 'active',
		subscription: null,
		previousSubscriptions: [] as any[],
		isSuper: false,
		isAdminForRestaurant: true,
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
		const superRestaurant = allRestaurants.find(
			(r: any) => r.isSuper === true || r.isSuper === 'true'
		);

		// Find restaurant by domain - try exact match first
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

		// If still not found, try super restaurant
		if (!restaurant && superRestaurant) {
			// Check if domain matches super restaurant
			const superDomain = (superRestaurant.domain || '').replace('www.', '').toLowerCase().trim();
			if (domainOnly.includes(superDomain) || superDomain.includes(domainOnly)) {
				restaurant = superRestaurant;
			}
		}

		// Final check - if we still don't have a restaurant, use super restaurant
		if (!restaurant && superRestaurant) {
			restaurant = superRestaurant;
		}

		// Determine if this is a super restaurant - check directly from restaurant data
		// Handle both boolean true and string "true" values
		const isSuperRestaurant = restaurant?.isSuper === true || restaurant?.isSuper === 'true';

		console.log('=== BILLING PAGE DEBUG ===');
		console.log('Host:', host);
		console.log('Domain:', domainOnly);
		console.log('Restaurant found:', restaurant?.name, restaurant?.id);
		console.log('restaurant.isSuper:', restaurant?.isSuper);
		console.log('isSuperRestaurant:', isSuperRestaurant);
		console.log('=========================');

		// Get super restaurant for settings (for paystack key)
		const superRest = superRestaurant;

		const paystackKey = superRest?.paystackKey || '';
		const supportEmail = superRest?.supportEmail || 'support@proxifeast.com';

		let subscription: any = null;
		// Only show as active if the CURRENT restaurant is super
		let subscriptionStatus = isSuperRestaurant ? 'active' : 'not_subscribed';
		let subscriptions: any[] = [];
		let restaurantsList: any[] = [];
		let previousSubscriptions: any[] = [];

		// Only show all subscriptions if the CURRENT restaurant is super
		if (isSuperRestaurant) {
			subscriptions = await locals.pb.collection('subscriptions').getFullList({
				sort: '-created'
			});
			restaurantsList = allRestaurants.filter((r) => r.isSuper !== true);
		} else if (restaurant?.id) {
			console.log('Fetching subscription for restaurant:', restaurant.id, restaurant.name);

			// Fetch all subscriptions for this restaurant in one call
			const allSubs: any = await locals.pb.collection('subscriptions').getList(1, 50, {
				filter: `restaurantId = "${restaurant.id}"`,
				sort: '-created'
			});
			previousSubscriptions = allSubs.items || [];

			// Use the first subscription (most recent)
			if (previousSubscriptions.length > 0) {
				subscription = previousSubscriptions[0];
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
			isAdminForRestaurant: true,
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
