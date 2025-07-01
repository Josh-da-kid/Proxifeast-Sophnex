// src/routes/admin/orders/+page.server.ts
// export const load = async ({ locals }) => {
// 	const orders = await locals.pb.collection('orders').getFullList();

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

