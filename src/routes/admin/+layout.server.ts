// // src/routes/admin/+layout.server.ts
// import { redirect } from '@sveltejs/kit';
// import type { LayoutServerLoad } from './$types';

// export const load: LayoutServerLoad = async ({ cookies, url, locals }) => {
// 	const token = cookies.get('auth_token');

// 	// Redirect to login if not authenticated
// 	if (!token && !locals.user?.isAdmin && url.pathname !== '/admin/admin-login') {
// 		throw redirect(302, `/admin/admin-login?redirectTo=${url.pathname}`);
// 	}

// 	// Logout if user is not admin
// 	if (!locals.user?.isAdmin) {
// 		// Clear PocketBase auth
// 		locals.pb.authStore.clear();

// 		// Clear the auth token cookie
// 		cookies.delete('auth_token', { path: '/' });

// 		// Redirect to login (or use throw error(403, 'Forbidden') for custom 403)
// 		// throw redirect(303, '/login');
// 	}

// 	return {
// 		user: locals.user
// 	};
// };



// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url, locals }) => {
	// const token = cookies.get('auth_token');
	const token = cookies.get('pb_auth');
	const pathname = url.pathname;

	const isAdminLoginPage = pathname === '/admin/admin-login';

	// If there's no token and not on the login page, redirect to admin login
	if (!token && !isAdminLoginPage) {
		throw redirect(302, `/admin/admin-login?redirectTo=${pathname}`);
	}

	// Allow non-admins to visit ONLY the login page
	// if (token && !locals.user?.isAdmin) {
	if (token && (!locals.user || !locals.user.isAdmin)) {
		// Clear session and cookie
		locals.pb.authStore.clear();
		// cookies.delete('auth_token', { path: '/' });
		cookies.delete('pb_auth', { path: '/' });


		// Redirect back to admin login with error
		throw redirect(303, `/admin/admin-login?redirectTo=${pathname}&not_admin=1`);
	}

	return {
		user: locals.user
	};
};
