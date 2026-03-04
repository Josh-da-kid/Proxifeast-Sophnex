import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const storeId = url.searchParams.get('store');
	let store = null;

	if (storeId) {
		try {
			store = await locals.pb.collection('restaurants').getOne(storeId);
		} catch (e) {
			console.error('Failed to fetch store:', e);
		}
	}

	return {
		store
	};
};
