// import { json } from '@sveltejs/kit';
// import type { RequestHandler } from './$types';

// export const POST: RequestHandler = async ({ request, locals, cookies, url }) => {
// 	try {
// 		const data = await request.json();

// 		// Authenticate with PocketBase
// 		const { token, record } = await locals.pb
// 			.collection('users')
// 			.authWithPassword(data.email, data.password);

// 		// Check if user is admin
// 		if (!record?.isAdmin) {
// 			return json({
// 				error: true,
// 				message: 'Access denied. Admins only.',
// 				email: data.email
// 			}, { status: 403 });
// 		}

// 		// Set auth cookie
// 		cookies.set('auth_token', token, {
// 			path: '/',
// 			maxAge: 60 * 60 * 24, // 1 day
// 			httpOnly: true,
// 			sameSite: 'lax',
// 			secure: false // true in production
// 		});

//             const redirectTo = url.searchParams.get('redirectTo') || '/admin/admin-menu';

// 		// ✅ Return JSON success (not redirect)
// 		return json({
// 			success: true,
// 			message: 'Admin login successful.',
//             redirectTo
// 		});
// 	} catch (err: any) {
// 		console.error('Error:', err);
// 		return json({
// 			error: true,
// 			message: err?.message || 'Admin Login failed. Please check your credentials.'
// 		}, { status: 401 });
// 	}
// };

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, cookies, url }) => {
	try {
		const data = await request.json();

		// 🔐 Authenticate admin
		const { token, record } = await locals.pb
			.collection('users')
			.authWithPassword(data.email, data.password);

		// 🌍 Resolve restaurant from domain
		const host = request.headers.get('host') || '';
		const domain = host.split(':')[0].replace('www.', '').toLowerCase();

		// Try to find restaurant by domain
		let restaurant = null;
		try {
			restaurant = await locals.pb
				.collection('restaurants')
				.getFirstListItem(`domain = "${domain}"`);
		} catch (e) {
			// Try partial match
			try {
				const restaurants = await locals.pb.collection('restaurants').getFullList();
				restaurant = restaurants.find((r: any) => {
					const rDomain = (r.domain || '').replace('www.', '').toLowerCase();
					return domain.includes(rDomain) || rDomain.includes(domain);
				});
			} catch (e2) {
				// No restaurant found
			}
		}

		// If still no restaurant, try to find a super restaurant
		if (!restaurant) {
			try {
				const restaurants = await locals.pb.collection('restaurants').getFullList();
				restaurant = restaurants.find((r: any) => r.isSuper === true);
			} catch (e) {
				// No super restaurant either
			}
		}

		// If still no restaurant, return error
		if (!restaurant) {
			locals.pb.authStore.clear();
			return json(
				{
					error: true,
					message: 'Restaurant not found. Please contact support.'
				},
				{ status: 400 }
			);
		}

		// Check if this is a super restaurant
		const isSuperRestaurant = restaurant.isSuper === true;

		// ❌ Must be admin for this specific restaurant (or super admin)
		// Check adminRestaurantIds first (granular admin), fall back to global isAdmin for backward compatibility
		const adminRestaurantIds = record.adminRestaurantIds || [];
		const restaurantIds = record.restaurantIds || [];

		// Backward compatibility: if user has old restaurantId but no restaurantIds
		if (restaurantIds.length === 0 && record.restaurantId) {
			restaurantIds.push(record.restaurantId);
		}

		let isAuthorizedAdmin = false;

		// For super restaurants, check if user has access to it
		if (isSuperRestaurant) {
			// User is authorized if they have this restaurant in their admin or regular restaurantIds
			isAuthorizedAdmin =
				adminRestaurantIds.includes(restaurant.id) || restaurantIds.includes(restaurant.id);
		} else {
			// For regular restaurants
			if (adminRestaurantIds.length > 0) {
				// User has specific admin assignments - check if they're admin for this restaurant
				isAuthorizedAdmin = adminRestaurantIds.includes(restaurant.id);
			} else {
				// Fallback: use global isAdmin flag (backward compatibility)
				isAuthorizedAdmin = record.isAdmin === true && restaurantIds.includes(restaurant.id);
			}
		}

		if (!isAuthorizedAdmin) {
			locals.pb.authStore.clear();
			return json(
				{
					error: true,
					message: 'You are not authorized to manage this restaurant.'
				},
				{ status: 403 }
			);
		}

		// Store user in locals for hooks to pick up
		locals.user = record;

		// Determine redirect based on restaurant type
		let redirectTo = '/admin/admin-menu';
		if (isSuperRestaurant) {
			redirectTo = url.searchParams.get('redirectTo') || '/admin/admin-menu';
		} else {
			redirectTo = url.searchParams.get('redirectTo') || '/admin/admin-menu';
		}

		// Export auth store to cookie
		const cookieOptions = {
			path: '/',
			httpOnly: true,
			sameSite: 'lax' as const,
			secure: false, // Set to true in production with HTTPS
			maxAge: 60 * 60 * 24 * 7 // 7 days
		};

		return json(
			{
				success: true,
				message: 'Admin login successful.',
				redirectTo,
				isSuper: isSuperRestaurant
			},
			{
				headers: {
					'set-cookie': `pb_auth=${locals.pb.authStore.exportToCookie()}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
				}
			}
		);
	} catch (err: any) {
		console.error('Admin login error:', err);

		return json(
			{
				error: true,
				message: 'Invalid email or password.'
			},
			{ status: 401 }
		);
	}
};
