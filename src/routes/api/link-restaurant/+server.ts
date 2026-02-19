// src/routes/api/link-restaurant/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();

	try {
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

		console.log('Link request - userId:', userId, 'restaurantId:', restaurantId);

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

		console.log('Linked user', user.id, 'to restaurant', restaurantId);

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
