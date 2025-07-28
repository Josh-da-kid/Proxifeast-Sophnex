import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load:LayoutServerLoad = ({ locals, cookies, url }) => {

	const token = cookies.get('auth_token'); // Your auth check

	return {
		user: locals.user ?? null
	};
};
