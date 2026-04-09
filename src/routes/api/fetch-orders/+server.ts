import { json, type RequestHandler } from '@sveltejs/kit';
import { canAdminAccessRestaurant, resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const GET: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ orders: [], error: 'Unauthorized' }, { status: 401 });
		}

		const restaurant = await resolveRestaurantByDomain(
			locals.pb,
			request.headers.get('host') || ''
		);
		if (!restaurant) {
			return json({ orders: [], error: 'Restaurant not found' }, { status: 404 });
		}

		if (!(await canAdminAccessRestaurant(locals.pb, locals.user, restaurant.id))) {
			return json({ orders: [], error: 'Forbidden' }, { status: 403 });
		}

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
