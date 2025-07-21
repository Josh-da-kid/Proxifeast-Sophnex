// src/routes/api/save-order/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	try {
		const record = await pb.collection('orders').create({
			user: data.user,
			phone: data.phone,
			deliveryType: data.type,
			totalAmount: data.totalAmount,
			reference: data.reference,
            tableNumber: data.tableNumber || '',
			homeAddress: data.homeAddress || '',
			pickupTime: data.pickupTime || '',
            orderTotal: data.orderTotal || data.totalAmount
		});

		return new Response(JSON.stringify({ success: true, record }), { status: 200 });
	} catch (error) {
		return new Response(JSON.stringify({ success: false, error }), { status: 500 });
	}
};
