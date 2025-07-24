import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, cookies, url }) => {
	try {
		const data = await request.json();

		console.log('Email:', data.email, 'Password:', data.password);

		// Authenticate with PocketBase
		const { token, record } = await locals.pb
			.collection('users')
			.authWithPassword(data.email, data.password);

		// Log isAdmin status
		console.log('isAdmin:', record?.isAdmin);

		// Check if user is admin
		if (!record?.isAdmin) {
			return json({
				error: true,
				message: 'Access denied. Admins only.',
				email: data.email
			}, { status: 403 });
		}

		// Set auth cookie
		cookies.set('auth_token', token, {
			path: '/',
			maxAge: 60 * 60 * 24, // 1 day
			httpOnly: true,
			sameSite: 'lax',
			secure: false // true in production
		});

            const redirectTo = url.searchParams.get('redirectTo') || '/admin/admin-menu';

		// ✅ Return JSON success (not redirect)
		return json({
			success: true,
			message: 'Admin login successful.',
            redirectTo
		});
	} catch (err: any) {
		console.error('Error:', err);
		return json({
			error: true,
			message: err?.message || 'Admin Login failed. Please check your credentials.'
		}, { status: 401 });
	}
};

