import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ locals, cookies }) => {
	locals.pb.authStore.clear();
	locals.user = null;

	cookies.delete('pb_auth', { path: '/' });
	cookies.delete('auth_token', { path: '/' });
	cookies.delete('pb_auth', { path: '/', domain: '.itcass.net', secure: true, sameSite: 'lax' });
	cookies.delete('pb_auth', {
		path: '/',
		domain: '.proxifeast.com',
		secure: true,
		sameSite: 'lax'
	});

	throw redirect(303, 'admin-login?logout=success');
};
