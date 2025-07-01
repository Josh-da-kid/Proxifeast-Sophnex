// src/routes/admin/login/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const email = form.get('email');
		const password = form.get('password');

		if (email === 'carmenjosh84@gmail.com' && password === 'Password') {
			cookies.set('auth_token', 'valid', {
				path: '/',
				maxAge: 60 * 60 * 24,
				httpOnly: true
			});

			// If user was redirected earlier, go back
			const redirectTo = url.searchParams.get('redirectTo') || '/admin';
			throw redirect(302, redirectTo);
		}

		return { error: 'Invalid credentials' };
	}
};
