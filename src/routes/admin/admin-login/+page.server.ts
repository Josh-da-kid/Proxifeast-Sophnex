import { redirect } from "@sveltejs/kit";

export const actions = {
	loginAdmin: async ({ request, locals, cookies, url }) => {
		const formData = await request.formData();
		const data = Object.fromEntries([...formData]);

		try {
			console.log('Email:', data.email, 'Password:', data.password);
			// Authenticate with PocketBase
			const { token, record } = await locals.pb
				.collection('users')
				.authWithPassword(data.email, data.password);

				// ✅ Log isAdmin status
			console.log('isAdmin:', record?.isAdmin);

			// ✅ Check if user is admin
			if (!record?.isAdmin) {
				return {
					error: true,
					message: 'Access denied. Admins only.',
					email: data.email
				};
			}

			// ✅ Set auth cookie (optional)
			cookies.set('auth_token', token, {
				path: '/',
				maxAge: 60 * 60 * 24, // 1 day
				httpOnly: true,
				sameSite: 'lax',
				secure: false // set to true in production
			});

			

		} catch (err: any) {
			console.log('Error:', err);
			return {
				error: true,
				message: err?.message || 'Admin Login failed. Please check your credentials.',
				email: data.email
			};
		}

		// ✅ Redirect to admin page
			const redirectTo = url.searchParams.get('redirectTo') || '/admin';
			throw redirect(303, redirectTo);
	}
};

