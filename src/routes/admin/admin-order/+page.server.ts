// src/routes/admin/orders/+page.server.ts
// export const load = async ({ locals }) => {
// 	const orders = await locals.pb.collection('orders').getFullList();

import type { PageServerLoad } from "../$types";

// 	const ordersWithItems = await Promise.all(
// 		orders.map(async (order) => {
// 			const items = await locals.pb.collection('order_items').getFullList({
// 				filter: `order="${order.id}"`,
// 				expand: 'dish'
// 			});
// 			return {
// 				...order,
// 				items
// 			};
// 		})
// 	);

// 	return { orders: ordersWithItems };
// };

// import type { PageServerLoad } from './$types';

// export const load: PageServerLoad = async ({ locals }) => {
// 	try {
// 		const orders = await locals.pb.collection('orders').getFullList({
// 			filter: `status = "Pending" || status = "Preparing" || status = "Ready"`,
// 			expand: 'user'
// 		});

// 		return { orders };
// 	} catch (err) {
// 		console.error('Failed to fetch pending orders:', err);
// 		return { orders: [] }; // fallback
// 	}
// };

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];
	console.log("domain:", domain)

	try {
		// ✅ Look up the restaurant by domain
		const restaurant = await locals.pb.collection('restaurants').getFirstListItem(`domain = "${domain}"`);

		const restaurantId = restaurant.id;

		return {
			restaurant,
			restaurantId
		};
	} catch (error) {
		console.error('Error loading restaurant or dishes:', error);
		return {
			dishes: [],
		
			error: 'Restaurant not found or failed to load dishes'
		};
	}
};