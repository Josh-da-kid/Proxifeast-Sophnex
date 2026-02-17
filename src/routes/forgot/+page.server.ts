import { redirect } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net');

// export const actions = {
// 	reset: async ({ locals, request }) => {
// 		const formData = await request.formData();
// 		const data = Object.fromEntries([...formData]);

//         await pb.collection('users').requestPasswordReset(data.email);
//     }
// }

export const actions = {
	reset: async ({ locals, request }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		if (!email) {
			return { success: false, error: 'Email is required' };
		}

		try {
			await pb.collection('users').requestPasswordReset(email.toString());
		} catch (err) {
			console.error('Password reset error:', err);
			const error = err as Error;

			return {
				error: true,
				success: false,
				message: error?.message || 'Failed to send reset email.',
				email: email
			};
		}

		throw redirect(303, '/forgot/?reset=success');
	}
};

// ---
// (optional) in your custom confirmation page:
// ---

// // note: after this call all previously issued auth tokens are invalidated
// await pb.collection('users').confirmPasswordReset(
//     'RESET_TOKEN',
//     'NEW_PASSWORD',
//     'NEW_PASSWORD_CONFIRM',
// );
