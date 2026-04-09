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
import { canAdminAccessRestaurant, resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const POST: RequestHandler = async ({ request, locals, cookies, url }) => {
	try {
		const data = await request.json();

		// 🔐 Authenticate admin
		const { token, record } = await locals.pb
			.collection('users')
			.authWithPassword(data.email, data.password);

		const restaurant = await resolveRestaurantByDomain(
			locals.pb,
			request.headers.get('host') || '',
			{
				allowSuperFallback: true
			}
		);

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

		const isSuperRestaurant = restaurant.isSuper === true;
		const isAuthorizedAdmin = await canAdminAccessRestaurant(locals.pb, record, restaurant.id);

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
		const authCookie = locals.pb.authStore.exportToCookie();

		const cookieHeader = authCookie.includes('SameSite')
			? authCookie
			: `${authCookie}; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`;

		return json(
			{
				success: true,
				message: 'Admin login successful.',
				redirectTo,
				isSuper: isSuperRestaurant
			},
			{
				headers: {
					'set-cookie': cookieHeader
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
