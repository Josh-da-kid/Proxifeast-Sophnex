// src/routes/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url, locals }) => {
	const token = cookies.get('auth_token'); // Your auth check

	if (!token && url.pathname !== '/admin/admin-login') {
		throw redirect(302, '/admin/admin-login?redirectTo=' + url.pathname);
	}

	// // ✅ Get all orders
	// const orders = await locals.pb.collection('orders').getFullList();

	// // ✅ For each order, get items and expand dishes
	// const ordersWithItems = await Promise.all(
	// 	orders.map(async (order) => {
	// 		const items = await locals.pb.collection('order_items').getFullList({
	// 			filter: `order="${order.id}"`,
	// 			expand: 'dish'
	// 		});
	// 		return {
	// 			...order,
	// 			items
	// 		};
	// 	})
	// );

	// return {
	// 	orders: ordersWithItems
	// };

	return {}
};


