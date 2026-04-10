// src/routes/admin/billing/+page.server.ts

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, request, parent }) => {
	const layoutData = await parent();
	// Get current restaurant from layout - this is already correctly selected
	const restaurantFromLayout = layoutData.restaurant || locals.restaurant;

	// Helper function to check if restaurant is super
	const isSuperRestaurant = (r: any) => r?.isSuper === true || r?.isSuper === 'true';
	const deriveSubscriptionStatus = (subscription: any) => {
		const now = new Date();
		const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;

		if (!subscription || !endDate) return 'not_subscribed';
		if (subscription.status === 'test') return endDate <= now ? 'expired' : 'active';
		if (subscription.status === 'pending') return 'pending';
		if (subscription.status === 'cancelled' || subscription.status === 'inactive')
			return 'cancelled';
		if (endDate <= now) return 'expired';

		const sevenDaysFromNow = new Date();
		sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
		return endDate <= sevenDaysFromNow ? 'expiring_soon' : 'active';
	};

	console.log(
		'Billing - Current restaurant from layout:',
		restaurantFromLayout?.name,
		'isSuper:',
		restaurantFromLayout ? isSuperRestaurant(restaurantFromLayout) : false
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
		// Use the restaurant from layout - it's already correctly selected
		// This prevents defaulting to super restaurant
		let restaurant = restaurantFromLayout;

		// Only do additional lookup if layout doesn't have a restaurant
		if (!restaurant) {
			// Get host from request
			const host = request.headers.get('host') || '';
			const domainOnly = host.split(':')[0].replace('www.', '').toLowerCase();

			// Fetch all restaurants
			const allRestaurants: any[] = await locals.pb.collection('restaurants').getFullList();

			if (!allRestaurants || allRestaurants.length === 0) {
				return defaults;
			}

			// Find restaurant by domain
			restaurant = allRestaurants.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
				return rDomain === domainOnly;
			});

			if (!restaurant) {
				restaurant = allRestaurants.find((r: any) => {
					const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
					return domainOnly.includes(rDomain) || rDomain.includes(domainOnly);
				});
			}

			// For billing, if still no restaurant, find first non-super restaurant from user's accessible list
			if (!restaurant) {
				const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
				const userRestaurantIds = locals.user?.restaurantIds || [];
				const allAccessibleIds = [...new Set([...adminRestaurantIds, ...userRestaurantIds])];

				const allRestaurantsForCheck = await locals.pb.collection('restaurants').getFullList();
				const userAccessible = allRestaurantsForCheck.filter((r: any) =>
					allAccessibleIds.includes(r.id)
				);

				// Prioritize non-super
				const nonSuper = userAccessible.filter((r: any) => !isSuperRestaurant(r));
				restaurant = nonSuper.length > 0 ? nonSuper[0] : userAccessible[0];
			}
		}

		// Fetch all restaurants for dropdown (for super users only)
		const allRestaurants: any[] =
			layoutData.allRestaurantsIncludingSuper ||
			(await locals.pb.collection('restaurants').getFullList());

		// Find super restaurant to get payment config
		let superRestaurant = allRestaurants.find((r: any) => isSuperRestaurant(r));

		// If not found from layout data, fetch super restaurant directly
		if (!superRestaurant) {
			try {
				const superRestaurants = await locals.pb.collection('restaurants').getFullList({
					filter: 'isSuper = true'
				});
				superRestaurant = superRestaurants?.[0] || null;
			} catch (e) {
				console.error('Failed to fetch super restaurant for paystack key:', e);
			}
		}

		if (!restaurant) {
			return {
				...defaults,
				isSuper: false
			};
		}

		// Billing rendering is based on the current restaurant context.
		const isSuperRestaurantValue = isSuperRestaurant(restaurant);

		console.log('=== BILLING PAGE DEBUG ===');
		console.log('Restaurant found:', restaurant?.name, restaurant?.id);
		console.log('restaurant.isSuper:', restaurant?.isSuper);
		console.log('isSuperRestaurant:', isSuperRestaurantValue);
		console.log('superRestaurant found:', !!superRestaurant, superRestaurant?.name);
		console.log('paystackKey present:', !!superRestaurant?.paystackKey);
		console.log('=========================');

		// Get super restaurant for settings (for paystack key)
		const superRest = superRestaurant;

		const paystackKey = superRest?.paystackKey || '';
		const supportEmail = superRest?.supportEmail || 'support@proxifeast.com';

		let subscription: any = null;
		// Only show global subscription dashboard for current super restaurant
		let subscriptionStatus = isSuperRestaurantValue ? 'active' : 'not_subscribed';
		let subscriptions: any[] = [];
		let restaurantsList: any[] = [];
		let previousSubscriptions: any[] = [];

		// Only show all subscriptions if the CURRENT restaurant is super
		if (isSuperRestaurantValue) {
			subscriptions = await locals.pb.collection('subscriptions').getFullList({
				sort: '-created'
			});
			restaurantsList = allRestaurants.filter((r) => r.isSuper !== true);
		} else if (restaurant?.id) {
			console.log('Fetching subscription for restaurant:', restaurant.id, restaurant.name);

			// Fetch all subscriptions for this restaurant in one call
			const allSubs: any = await locals.pb.collection('subscriptions').getList(1, 50, {
				filter: `restaurantId = "${restaurant.id}"`,
				sort: '-updated,-created'
			});
			previousSubscriptions = allSubs.items || [];

			// Prefer the current effective subscription if multiple records exist.
			if (previousSubscriptions.length > 0) {
				subscription =
					previousSubscriptions.find((item: any) => deriveSubscriptionStatus(item) === 'active') ||
					previousSubscriptions.find(
						(item: any) => deriveSubscriptionStatus(item) === 'expiring_soon'
					) ||
					previousSubscriptions.find((item: any) => deriveSubscriptionStatus(item) === 'pending') ||
					previousSubscriptions[0];
				console.log('Found subscription:', subscription);
				subscriptionStatus = deriveSubscriptionStatus(subscription);
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
			isSuper: isSuperRestaurantValue,
			isAdminForRestaurant: true,
			paystackKey,
			supportEmail,
			expired:
				!isSuperRestaurantValue &&
				url.searchParams.get('expired') === '1' &&
				(subscriptionStatus === 'expired' ||
					subscriptionStatus === 'not_subscribed' ||
					subscriptionStatus === 'cancelled' ||
					subscriptionStatus === 'pending'),
			restaurant: isSuperRestaurantValue ? null : restaurant,
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
