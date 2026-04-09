// src/routes/api/link-restaurant/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';
import { getScopedRestaurantForRequest } from '$lib/server/restaurantAccess';

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();

	try {
		if (!locals.user) {
			return json({ error: true, message: 'Unauthorized.' }, { status: 401 });
		}

		const { userId, restaurantId } = data;

		if (!userId || !restaurantId) {
			return json(
				{
					error: true,
					message: 'User ID and restaurant ID are required.'
				},
				{ status: 400 }
			);
		}

		if (locals.user.id !== userId) {
			return json({ error: true, message: 'Forbidden.' }, { status: 403 });
		}

		const { allowed } = await getScopedRestaurantForRequest(
			locals.pb,
			request.headers.get('host') || '',
			restaurantId,
			{ allowSuperFallback: true }
		);

		if (!allowed) {
			return json({ error: true, message: 'Invalid restaurant context.' }, { status: 403 });
		}

		// Get user directly by ID (requires auth, but we can use the authenticated pb instance)
		const user = await locals.pb.collection('users').getOne(userId);

		// Get current restaurantIds
		let restaurantIds = user.restaurantIds || [];

		// Backward compatibility: if user has old restaurantId but no restaurantIds
		if (restaurantIds.length === 0 && user.restaurantId) {
			restaurantIds = [user.restaurantId];
		}

		// Check if already linked
		if (restaurantIds.includes(restaurantId)) {
			return json(
				{
					error: true,
					message: 'User is already registered for this restaurant.'
				},
				{ status: 400 }
			);
		}

		// Add new restaurant to restaurantIds
		restaurantIds.push(restaurantId);

		// Update user
		await locals.pb.collection('users').update(user.id, {
			restaurantIds
		});

		return json({
			error: false,
			message: 'Successfully linked account to restaurant.'
		});
	} catch (err: any) {
		console.error('Link restaurant error:', err);
		return json(
			{
				error: true,
				message: 'Failed to link account to restaurant.'
			},
			{ status: 500 }
		);
	}
};
