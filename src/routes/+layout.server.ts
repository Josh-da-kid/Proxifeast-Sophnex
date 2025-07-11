import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load:LayoutServerLoad = ({ locals, cookies, url }) => {
	// console.log('User in layout:', locals.user);

	const token = cookies.get('auth_token'); // Your auth check
	
		// if (!token && url.pathname !== '/login' && url.pathname !== '/signup') {
		// 	throw redirect(302, '/login?redirectTo=' + url.pathname);
		// }

	return {
		user: locals.user ?? null
	};
};
