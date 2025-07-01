
import { redirect } from "@sveltejs/kit";


export const actions = {
	
	register: async ({ locals, request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries([...formData]);
		console.log(data);

		 // Add this check at the beginning
        if (data.password !== data.passwordConfirm) {
            return {
                error: true,
                message: 'Passwords do not match.',
                email: data.email // Keep the email for convenience
            };
        }

		// 2. Password Requirement Algorithm Check
        const password = data.password;

		   // Define the requirements with clear messages
        const passwordRequirements = [
            { check: password.length >= 8, message: 'Password must be at least 8 characters long.' },
            { check: /[A-Z]/.test(password), message: 'Password must contain at least one uppercase letter.' },
            { check: /[a-z]/.test(password), message: 'Password must contain at least one lowercase letter.' },
            { check: /[0-9]/.test(password), message: 'Password must contain at least one number.' },
            { check: /[!@#$%^&*]/.test(password), message: 'Password must contain at least one special character (!@#$%^&*).' }
            // Add more requirements as needed
        ];

        for (const requirement of passwordRequirements) {
            if (!requirement.check) {
                return {
                    error: true,
                    message: requirement.message,
                    email: data.email
                };
            }
        }

		try {
			// 1. Create the user
			const newUser = await locals.pb.collection('users').create({
				name:data.name,
				email: data.email,
				password: data.password,
				passwordConfirm: data.passwordConfirm
			});

			// 2. Authenticate the user to get profile ID
			// const { user } = await locals.pb
			// 	.collection('users')
			// 	.authWithPassword(data.email, data.password);

				const { token, record } = await locals.pb
	.collection('users')
	.authWithPassword(data.email, data.password);


			// 3. Update the user's profile (assuming you have a `profiles` collection)
			// await locals.pb.collection('profiles').update(user.profile.id, {
			// 	name: data.name
			// });

			// 4. Clear session if you don't want the user logged in immediately
			locals.pb.authStore.clear();
			

			
		} catch (err: any) {
			console.error('Error during registration:', err);

			return {
				error: true,
        		message: err?.message || 'Signup failed. Please check your credentials.',
				email: data.email
			};
		}
		
		// 5. Redirect to login
		// throw redirect(303, '/login');
		throw redirect(303, '/login?signup=success');

	
	}

};
