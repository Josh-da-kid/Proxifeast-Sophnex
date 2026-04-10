import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { isSuper } = await parent();

	if (!isSuper) {
		throw error(404, 'Page not found');
	}

	return { isSuper };
};
