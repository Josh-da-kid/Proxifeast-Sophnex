import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import pb from '$lib/pb';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const favorites: string[] = locals.user.favorites || [];

	if (favorites.length === 0) {
		return {
			restaurants: []
		};
	}

	const filter = favorites.map((id) => `id="${id}"`).join(' || ');
	const restaurants = await pb.collection('restaurants').getFullList({
		filter,
		sort: 'name'
	});

	return {
		restaurants
	};
};
