// src/routes/api/save-order/+server.ts
import { error, type RequestHandler } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	const host = request.headers.get('host') || '';
		const domain = host.split(':')[0];
	
		// 1. Get restaurant by domain
		const restaurant = await pb.collection('restaurants').getFirstListItem(`domain="${domain}"`);
	
		if (!restaurant) {
			throw error(400, 'Restaurant not found');
		}

	try {
		const record = await pb.collection('orders').create({
			user: data.user,
			name: data.name,
			phone: data.formattedPhone,
			email: data.email,
			deliveryType: data.type,
			status: "Pending",
			// dishes: data.dishes,
			quantity: data.quantity,
			dishes: data.dishes.map((dish: any) => ({
					dish: dish.id, // or dish.dish if you already structured it that way
					amount: dish.amount,
					name: dish.name,
					quantity: dish.quantity
							})),
			totalAmount: data.totalAmount,
			reference: data.reference,
            tableNumber: data.tableNumber || '',
			homeAddress: data.homeAddress || '',
			pickupTime: data.pickupTime || '',
            orderTotal: data.orderTotal || data.totalAmount,
			restaurantId: restaurant.id
		});

		return new Response(JSON.stringify({ success: true, record }), { status: 200 });
	} catch (error) {
		return new Response(JSON.stringify({ success: false, error }), { status: 500 });
	}
};
