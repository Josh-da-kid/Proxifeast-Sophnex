// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import {
	isSuperadmin,
	normalizeDomain,
	resolveRestaurantByDomain
} from '$lib/server/restaurantAccess';

// Role-based route access map
const roleRoutes: Record<string, string[]> = {
	owner: ['*'],
	manager: ['*'],
	kitchen: ['/admin/admin-order', '/admin/admin-menu', '/admin/today-menu'],
	waiter: ['/admin/admin-order', '/admin/admin-menu']
};

// Routes that require owner/manager only (not kitchen/waiter)
const restrictedRoutes = [
	'/admin/billing',
	'/admin/statistics',
	'/admin/analytics',
	'/admin/user-analysis'
];

export const load: LayoutServerLoad = async ({ cookies, url, locals, request }) => {
	try {
		const token = cookies.get('pb_auth');
		const pathname = url.pathname;
		const isAdminLoginPage = pathname === '/admin/admin-login';
		const isBillingPage = pathname.startsWith('/admin/billing');

		// Check if user has access to any super restaurant
		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const userRestaurantIds = locals.user?.restaurantIds || [];
		const allUserRestaurantIds = [...new Set([...adminRestaurantIds, ...userRestaurantIds])];
		console.log('User adminRestaurantIds:', adminRestaurantIds);
		console.log('User restaurantIds:', userRestaurantIds);
		console.log('All user restaurant IDs:', allUserRestaurantIds);

		// Get all restaurants to check
		let allRestaurantsForCheck: any[] = [];
		try {
			allRestaurantsForCheck = await locals.pb.collection('restaurants').getFullList();
			console.log(
				'All restaurants:',
				allRestaurantsForCheck.map((r: any) => ({ id: r.id, name: r.name, isSuper: r.isSuper }))
			);
		} catch {}

		const userHasSuperAccess = await isSuperadmin(locals.pb, locals.user);
		const userHasOwnSuperFlag = locals.user?.isSuper === true || locals.user?.isSuper === 'true';
		console.log('User has own isSuper flag:', userHasOwnSuperFlag);

		console.log('User has super access (from restaurant check):', userHasSuperAccess);
		console.log('User has super access (combined):', userHasSuperAccess || userHasOwnSuperFlag);

		if (!token && !isAdminLoginPage) {
			throw redirect(302, `/admin/admin-login?redirectTo=${pathname}`);
		}

		if (token && !locals.user) {
			locals.pb.authStore.clear();
			cookies.delete('pb_auth', { path: '/' });
			throw redirect(303, `/admin/admin-login?redirectTo=${pathname}&not_admin=1`);
		}

		// If no user and token, redirect to login
		if (!locals.user && !isAdminLoginPage) {
			throw redirect(302, `/admin/admin-login?redirectTo=${pathname}`);
		}

		// If user is logged in but we're on login page, redirect to admin menu
		if (locals.user && isAdminLoginPage) {
			throw redirect(303, '/admin/admin-menu');
		}

		const fullHost = request.headers.get('host') || '';
		const domainOnly = normalizeDomain(fullHost);

		// Use already fetched allRestaurantsForCheck to find the restaurant
		let restaurant: any = null;

		// Helper function to check if restaurant is super
		const isSuperRestaurant = (r: any) => r?.isSuper === true || r?.isSuper === 'true';

		// Get user's accessible restaurants
		const userAccessibleRestaurants =
			allUserRestaurantIds.length > 0
				? allRestaurantsForCheck.filter((r: any) => allUserRestaurantIds.includes(r.id))
				: [];

		// 1. First try exact domain match with user's accessible restaurants
		restaurant = userAccessibleRestaurants.find((r: any) => {
			const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
			return rDomain === domainOnly;
		});

		// 2. Try partial domain match with user's accessible restaurants
		if (!restaurant) {
			restaurant = userAccessibleRestaurants.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
				return domainOnly.includes(rDomain) || rDomain.includes(domainOnly);
			});
		}

		// 3. If still no match, find FIRST non-super restaurant from user's list
		// This prevents defaulting to a super restaurant when it shouldn't be selected
		if (!restaurant && userAccessibleRestaurants.length > 0) {
			// Prefer non-super restaurants first
			const nonSuperRestaurants = userAccessibleRestaurants.filter(
				(r: any) => !isSuperRestaurant(r)
			);
			if (nonSuperRestaurants.length > 0) {
				restaurant = nonSuperRestaurants[0];
			} else {
				// If user only has super restaurants, use the first one
				restaurant = userAccessibleRestaurants[0];
			}
			console.log('Using user accessible restaurant (non-super优先):', restaurant?.name);
		}

		// 4. Only verified super admins may resolve against all restaurants.
		if (!restaurant && userHasSuperAccess) {
			restaurant = allRestaurantsForCheck.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
				return rDomain === domainOnly;
			});
		}

		// 5. Try partial match in all restaurants for verified super admins only.
		if (!restaurant && userHasSuperAccess) {
			restaurant = allRestaurantsForCheck.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
				return domainOnly.includes(rDomain) || rDomain.includes(domainOnly);
			});
		}

		// 6. Final fallback to super restaurant only if user has super access
		if (!restaurant && userHasSuperAccess) {
			restaurant = await resolveRestaurantByDomain(locals.pb, fullHost, {
				allowSuperFallback: true
			});
		}

		if (!restaurant) {
			return {
				user: locals.user,
				restaurant: null,
				isSuper: false,
				isSuperUser: false,
				isAdminForRestaurant: false,
				restaurantId: null,
				subscription: null,
				subscriptionStatus: 'active'
			};
		}

		locals.restaurant = restaurant;

		// The admin scope must follow the current restaurant context.
		const restaurantIsSuper = isSuperRestaurant(restaurant);
		const finalIsSuper = restaurantIsSuper;

		locals.isSuper = finalIsSuper;

		console.log('Final isSuper calculation:', {
			userHasSuperAccess,
			userHasOwnSuperFlag,
			restaurantIsSuper,
			restaurantIsSuperFlag: restaurant?.isSuper,
			finalIsSuper
		});

		const allAccessibleIds = allUserRestaurantIds;

		let isAdminForRestaurant = false;

		if (allAccessibleIds.length > 0) {
			isAdminForRestaurant = allAccessibleIds.includes(restaurant.id);
		} else {
			isAdminForRestaurant = locals.user?.isAdmin === true;
		}

		console.log('isAdminForRestaurant:', {
			restaurantId: restaurant.id,
			restaurantName: restaurant.name,
			allAccessibleIds,
			isAdminForRestaurant
		});

		if (!isAdminForRestaurant && !isAdminLoginPage) {
			locals.pb.authStore.clear();
			cookies.delete('pb_auth', { path: '/' });
			throw redirect(303, `/admin/admin-login?redirectTo=${pathname}&not_admin=1`);
		}

		// Role-based route guards
		const userRole = locals.user?.role || 'owner';
		const allowedRoutes = roleRoutes[userRole] || ['*'];
		const isKitchen = userRole === 'kitchen';
		const isWaiter = userRole === 'waiter';

		// Check if current route is allowed for user role
		const isRouteAllowed =
			allowedRoutes.includes('*') || allowedRoutes.some((route) => pathname.startsWith(route));

		// Check if route is restricted (billing, analytics, etc.)
		const isRestrictedRoute = restrictedRoutes.some((route) => pathname.startsWith(route));

		// Redirect if role cannot access this route
		if (!isRouteAllowed || (isRestrictedRoute && (isKitchen || isWaiter))) {
			throw redirect(303, '/admin/admin-order?unauthorized=1');
		}

		if (locals.isSuper) {
			// Reuse already fetched allRestaurantsForCheck instead of making another request
			return {
				user: locals.user,
				restaurant,
				isSuper: locals.isSuper,
				isSuperUser: locals.isSuper,
				isAdminForRestaurant,
				restaurantId: restaurant?.id,
				subscription: null,
				subscriptionStatus: 'active',
				allRestaurantsIncludingSuper: allRestaurantsForCheck,
				userRole: userRole,
				isKitchen,
				isWaiter
			};
		}

		let subscription = null;
		let subscriptionStatus = 'not_subscribed';

		const deriveSubscriptionStatus = (subs: any) => {
			const now = new Date();
			const endDate = subs?.endDate ? new Date(subs.endDate) : null;
			const sevenDaysFromNow = new Date();
			sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

			if (!subs || !endDate) return 'not_subscribed';
			if (subs.status === 'test') {
				return endDate <= now ? 'expired' : 'active';
			}
			if (subs.status === 'pending') return 'pending';
			if (subs.status === 'cancelled' || subs.status === 'inactive') return 'cancelled';
			if (subs.status === 'active') {
				if (endDate <= now) return 'expired';
				if (endDate <= sevenDaysFromNow) return 'expiring_soon';
				return 'active';
			}

			return 'not_subscribed';
		};

		// Check trial status from restaurant collection
		const trialStatus = restaurant?.subscriptionStatus;
		const trialEndDate = restaurant?.trialEndDate;

		// If restaurant has trial status and trial hasn't expired, allow access
		if (trialStatus === 'trial' && trialEndDate) {
			const now = new Date();
			const trialEnd = new Date(trialEndDate);
			if (now < trialEnd) {
				// Trial is still valid
				subscriptionStatus = 'trial';
			} else {
				// Trial has expired - lock access
				subscriptionStatus = 'expired';
			}
		} else {
			// Check existing subscriptions collection
			try {
				const subsResult = await locals.pb.collection('subscriptions').getList(1, 50, {
					filter: `restaurantId = "${restaurant.id}"`,
					sort: '-updated,-created'
				});
				const subscriptions = subsResult.items || [];
				subscription =
					subscriptions.find((item: any) => deriveSubscriptionStatus(item) === 'active') ||
					subscriptions.find((item: any) => deriveSubscriptionStatus(item) === 'expiring_soon') ||
					subscriptions.find((item: any) => deriveSubscriptionStatus(item) === 'pending') ||
					subscriptions[0] ||
					null;

				subscriptionStatus = deriveSubscriptionStatus(subscription);
			} catch {
				subscriptionStatus = 'not_subscribed';
				subscription = null;
			}
		}

		const isSubscriptionActive =
			subscriptionStatus === 'active' ||
			subscriptionStatus === 'expiring_soon' ||
			subscriptionStatus === 'test' ||
			subscriptionStatus === 'pending';

		// Super restaurants never need subscription - always allow access
		if (!locals.isSuper && !isSubscriptionActive && !isBillingPage) {
			throw redirect(307, '/admin/billing?expired=1');
		}

		return {
			user: locals.user,
			restaurant: {
				...restaurant,
				trialUsed: restaurant?.trialUsed ?? false,
				trialStartDate: restaurant?.trialStartDate ?? null,
				trialEndDate: restaurant?.trialEndDate ?? null,
				subscriptionStatus: restaurant?.subscriptionStatus ?? null,
				subscriptionPlan: restaurant?.subscriptionPlan ?? null,
				subscriptionExpiry: restaurant?.subscriptionExpiry ?? null
			},
			isSuper: locals.isSuper,
			isSuperUser: locals.isSuper,
			isAdminForRestaurant,
			restaurantId: restaurant?.id,
			subscription,
			subscriptionStatus,
			userRole: userRole,
			isKitchen,
			isWaiter
		};
	} catch (err: any) {
		if (err.status === 302 || err.status === 303 || err.status === 307) {
			throw err;
		}
		console.error('Admin layout error:', err);
		return {
			user: locals.user || null,
			restaurant: null,
			isSuper: false,
			isSuperUser: false,
			isAdminForRestaurant: false,
			restaurantId: null,
			subscription: null,
			subscriptionStatus: 'active',
			userRole: locals.user?.role || 'owner',
			isKitchen: false,
			isWaiter: false
		};
	}
};
