import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userRole = locals.user?.role || 'manager';
	const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

	if (!isManagerOrOwner) {
		throw redirect(303, '/admin/admin-menu?unauthorized=1');
	}

	return {};
};
