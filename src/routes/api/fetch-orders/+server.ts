import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const orders = await locals.pb.collection('orders').getFullList({
			filter: 'status = "Pending" || status = "Preparing" || status = "Ready"',
			expand: 'user',
            sort: '-created'
		});

		// return new Response(JSON.stringify({ orders }), {
		// 	status: 200,
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	}
		// });
        return json({ orders });
	} catch (error) {
		console.error('Failed to fetch orders:', error);
		// return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), { status: 500 });
        return json({ orders: [], error: 'Failed to fetch orders' }, { status: 500 });
	}
};
