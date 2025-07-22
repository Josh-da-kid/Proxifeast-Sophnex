import { redirect } from "@sveltejs/kit"

export const actions= {
    login:async({request, locals})=>{
        const formData = await request.formData()
        const data = Object.fromEntries([...formData])

        try{
            // const {token, user}=await locals.pb.users.authVialEmail(data.email, data.password)
            const { token, record } = await locals.pb.collection('users').authWithPassword(data.email, data.password);
            // await locals.pb.collection('users').confirmVerification('VERIFICATION_TOKEN');

            if (!record.verified) {
                locals.pb.authStore.clear();
    await locals.pb.collection('users').requestVerification(data.email);
    return {
        error: true,
        message: "Email not verified. We've sent you a new verification link.",
        email: data.email
    };
}
        } catch (err) {
            console.log('Error:', err)
            return{
                error: true,
                message: err?.message || 'Login failed. Please check your credentials.',
                email: data.email
            };
        }
        throw redirect(303, '/')
    }
};