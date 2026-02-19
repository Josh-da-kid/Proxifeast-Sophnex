// src/routes/api/debug-users/+server.ts

import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const users = await locals.pb.collection('users').getList(1, 10, {
			sort: '-created'
		});

		return json({
			total: users.totalItems,
			users: users.items.map((u) => ({
				id: u.id,
				email: u.email,
				restaurantIds: u.restaurantIds,
				restaurantId: u.restaurantId
			}))
		});
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};
