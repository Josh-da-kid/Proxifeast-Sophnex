// // src/routes/admin/+layout.server.ts
// import { redirect } from '@sveltejs/kit';
// import type { LayoutServerLoad } from './$types';

// export const load: LayoutServerLoad = async ({ cookies, url, locals }) => {
// 	// const token = cookies.get('auth_token');
// 	const token = cookies.get('pb_auth');
// 	const pathname = url.pathname;

// 	const isAdminLoginPage = pathname === '/admin/admin-login';

// 	// If there's no token and not on the login page, redirect to admin login
// 	if (!token && !isAdminLoginPage) {
// 		throw redirect(302, `/admin/admin-login?redirectTo=${pathname}`);
// 	}

// 	// Allow non-admins to visit ONLY the login page
// 	// if (token && !locals.user?.isAdmin) {
// 	if (token && (!locals.user || !locals.user.isAdmin)) {
// 		// Clear session and cookie
// 		locals.pb.authStore.clear();
// 		// cookies.delete('auth_token', { path: '/' });
// 		cookies.delete('pb_auth', { path: '/' });


// 		// Redirect back to admin login with error
// 		throw redirect(303, `/admin/admin-login?redirectTo=${pathname}&not_admin=1`);
// 	}

// 	return {
// 		user: locals.user
// 	};
// };



// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import pb from '$lib/pb';

export const load: LayoutServerLoad = async ({ cookies, url, locals, request }) => {
	const token = cookies.get('pb_auth');
	const pathname = url.pathname;
	const isAdminLoginPage = pathname === '/admin/admin-login';

	if (!token && !isAdminLoginPage) {
		throw redirect(302, `/admin/admin-login?redirectTo=${pathname}`);
	}

	if (token && (!locals.user || !locals.user.isAdmin)) {
		locals.pb.authStore.clear();
		cookies.delete('pb_auth', { path: '/' });
		throw redirect(303, `/admin/admin-login?redirectTo=${pathname}&not_admin=1`);
	}

		const fullHost = request.headers.get('host') || '';
	const domainOnly = fullHost.split(':')[0]; // Removes :5173 if present

	// 🔎 Find the restaurant by domain
	const restaurants = await pb.collection('restaurants').getFullList({
		filter: `domain="${domainOnly}"`
	});

	const restaurant = restaurants?.[0];

	if (!restaurant) {
		console.error(`❌ Restaurant not found for domain: ${domainOnly}`);
		throw redirect(307, '/not-found'); // or handle however you want
	}

	// ✅ Set restaurant in locals
	locals.restaurant = restaurant;

	return {
		user: locals.user,
		restaurant
	};
};
