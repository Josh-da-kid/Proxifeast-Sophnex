export const load = ({ locals }) => {
	// console.log('User in layout:', locals.user);
	return {
		user: locals.user ?? null
	};
};
