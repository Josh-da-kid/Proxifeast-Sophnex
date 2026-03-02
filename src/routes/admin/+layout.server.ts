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
		locals.isSuper = !!restaurant?.isSuper;

		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const userRestaurantIds = locals.user?.restaurantIds || [];

		let isAdminForRestaurant = false;

		if (adminRestaurantIds.length > 0) {
			isAdminForRestaurant = adminRestaurantIds.includes(restaurant.id);
		} else {
			isAdminForRestaurant =
				locals.user?.isAdmin === true && userRestaurantIds.includes(restaurant.id);
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
			restaurant,
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
