// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

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

		// Force refresh user data from PocketBase to get latest adminRestaurantIds
		if (locals.user && locals.pb.authStore.isValid) {
			try {
				const freshUser = await locals.pb.collection('users').getOne(locals.user.id);
				locals.user = freshUser;
			} catch (e) {
				console.log('Could not refresh user:', e);
			}
		}

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
		const domainOnly = fullHost.split(':')[0].replace('www.', '').toLowerCase();

		let restaurant: any = null;
		try {
			restaurant = await locals.pb
				.collection('restaurants')
				.getFirstListItem(`domain = "${domainOnly}"`);
		} catch {
			try {
				const results = await locals.pb.collection('restaurants').getList(1, 5, {
					filter: `domain ~ "${domainOnly}"`
				});
				if (results.items.length > 0) {
					restaurant = results.items[0];
				}
			} catch {}

			if (!restaurant) {
				try {
					restaurant = await locals.pb.collection('restaurants').getFirstListItem('isSuper = true');
				} catch {}
			}
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

		// Check if user has access to any super restaurant
		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const userRestaurantIds = locals.user?.restaurantIds || [];
		const allUserRestaurantIds = [...new Set([...adminRestaurantIds, ...userRestaurantIds])];

		// Check if any of the user's restaurants is a super restaurant
		let userHasSuperAccess = false;
		try {
			const allRestaurantsForCheck = await locals.pb.collection('restaurants').getFullList();
			userHasSuperAccess = allUserRestaurantIds.some((id: string) => {
				const rest = allRestaurantsForCheck.find((r: any) => r.id === id);
				return rest?.isSuper === true;
			});
		} catch {}

		// User is super if they have access to a super restaurant OR if the current restaurant is super
		locals.isSuper = userHasSuperAccess || !!restaurant?.isSuper;

		const allAccessibleIds = allUserRestaurantIds;

		let isAdminForRestaurant = false;

		if (allAccessibleIds.length > 0) {
			isAdminForRestaurant = allAccessibleIds.includes(restaurant.id);
		} else {
			isAdminForRestaurant = locals.user?.isAdmin === true;
		}

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
			let allRestaurantsIncludingSuper: any[] = [];
			try {
				allRestaurantsIncludingSuper = await locals.pb.collection('restaurants').getFullList();
			} catch {}

			return {
				user: locals.user,
				restaurant,
				isSuper: locals.isSuper,
				isSuperUser: locals.isSuper,
				isAdminForRestaurant,
				restaurantId: restaurant?.id,
				subscription: null,
				subscriptionStatus: 'active',
				allRestaurantsIncludingSuper,
				userRole: userRole,
				isKitchen,
				isWaiter
			};
		}

		let subscription = null;
		let subscriptionStatus = 'not_subscribed';

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
				const subs = await locals.pb
					.collection('subscriptions')
					.getFirstListItem(`restaurantId = "${restaurant.id}"`);
				subscription = subs;

				const now = new Date();
				const endDate = new Date(subs.endDate);
				const sevenDaysFromNow = new Date();
				sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

				if (subs.status === 'test') {
					if (endDate <= now) {
						subscriptionStatus = 'expired';
					} else {
						subscriptionStatus = 'active';
					}
				} else if (subs.status === 'pending') {
					subscriptionStatus = 'pending';
				} else if (subs.status === 'cancelled' || subs.status === 'inactive') {
					subscriptionStatus = 'cancelled';
				} else if (subs.status === 'active') {
					if (endDate <= now) {
						subscriptionStatus = 'expired';
					} else if (endDate <= sevenDaysFromNow) {
						subscriptionStatus = 'expiring_soon';
					} else {
						subscriptionStatus = 'active';
					}
				}
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

		if (!isSubscriptionActive && !isBillingPage) {
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
