// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url, locals }) => {
	const token = cookies.get('auth_token'); // Your auth check

	if (!token && url.pathname !== '/admin/admin-login') {
		throw redirect(302, '/admin/admin-login?redirectTo=' + url.pathname);
	}



	if (!locals.user) {
		return {
			user: null
		};
	}

	return {
		user: locals.user
	};
};


