import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ request, locals }) => {
	try {
		// Get current domain
		const host = request.headers.get('host') || '';
		const domain = host.split(':')[0];

		// Get restaurant ID by domain
		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain="${domain}"`);

		// Fetch orders specific to that restaurant
		const orders = await locals.pb.collection('orders').getFullList({
			filter: `restaurant = "${restaurant.id}" && (status = "Pending" || status = "Preparing" || status = "Ready")`,
			expand: 'user',
			sort: '-created'
		});

		return json({ orders });
	} catch (error) {
		console.error('Failed to fetch orders:', error);
		return json({ orders: [], error: 'Failed to fetch orders' }, { status: 500 });
	}
};

