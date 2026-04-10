import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getScopedRestaurantForRequest } from '$lib/server/restaurantAccess';

export const POST: RequestHandler = async ({ locals, request }) => {
	try {
		const { restaurantId, action } = await request.json();

		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (!restaurantId || !action) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const scoped = await getScopedRestaurantForRequest(
			locals.pb,
			request.headers.get('host') || '',
			restaurantId,
			{ allowSuperFallback: true }
		);

		if (!scoped.currentRestaurant || !scoped.allowed) {
			return json({ error: 'Invalid restaurant context' }, { status: 403 });
		}

		const userId = locals.user.id;
		let favorites: string[] = locals.user.favorites || [];

		if (action === 'add') {
			if (!favorites.includes(restaurantId)) {
				favorites = [...favorites, restaurantId];
			}
		} else if (action === 'remove') {
			favorites = favorites.filter((id) => id !== restaurantId);
		} else {
			return json({ error: 'Invalid action' }, { status: 400 });
		}

		await locals.pb.collection('users').update(userId, {
			favorites
		});

		return json({ success: true, favorites });
	} catch (err) {
		console.error('Favorites error:', err);
		return json({ error: 'Failed to update favorites' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const favorites: string[] = locals.user.favorites || [];
		return json({ favorites });
	} catch (err) {
		console.error('Favorites error:', err);
		return json({ error: 'Failed to get favorites' }, { status: 500 });
	}
};
