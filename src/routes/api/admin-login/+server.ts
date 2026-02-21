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
		const domain = host.split(':')[0];

		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);

		// ❌ Must be admin for this specific restaurant
		// Check adminRestaurantIds first (granular admin), fall back to global isAdmin for backward compatibility
		const adminRestaurantIds = record.adminRestaurantIds || [];
		const restaurantIds = record.restaurantIds || [];

		// Backward compatibility: if user has old restaurantId but no restaurantIds
		if (restaurantIds.length === 0 && record.restaurantId) {
			restaurantIds.push(record.restaurantId);
		}

		let isAuthorizedAdmin = false;

		if (adminRestaurantIds.length > 0) {
			// User has specific admin assignments - check if they're admin for this restaurant
			isAuthorizedAdmin = adminRestaurantIds.includes(restaurant.id);
		} else {
			// Fallback: use global isAdmin flag (backward compatibility)
			isAuthorizedAdmin = record.isAdmin === true && restaurantIds.includes(restaurant.id);
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

		// Let PocketBase handle the cookie via hooks.server.ts
		// The hooks will export the auth store cookie automatically

		const redirectTo = url.searchParams.get('redirectTo') || '/admin/admin-menu';

		return json({
			success: true,
			message: 'Admin login successful.',
			redirectTo
		});
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
