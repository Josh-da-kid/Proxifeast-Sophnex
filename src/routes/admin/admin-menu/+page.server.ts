import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const dishes = await locals.pb.collection('dishes').getFullList({
			sort: '-created',
			expand: 'user' // if you want related user data
		});

		return {
			dishes
		};
	} catch (error) {
		console.error('Failed to fetch dishes:', error);
		return {
			dishes: []
		};
	}
};
