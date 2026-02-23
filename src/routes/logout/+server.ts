import { redirect } from '@sveltejs/kit';

export const POST = ({ locals, cookies }) => {
	// Clear PocketBase auth store
	locals.pb.authStore.clear();
	locals.user = undefined;

	// Clear all auth cookies
	cookies.delete('pb_auth', { path: '/' });
	cookies.delete('auth_token', { path: '/' });

	throw redirect(303, '/login?logout=success');
};
