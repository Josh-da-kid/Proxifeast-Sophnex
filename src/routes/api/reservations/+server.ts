import type { RequestHandler } from './$types';
import crypto from 'crypto';

function generateQRToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const formData = await request.formData();

	const storeId = formData.get('storeId') as string;
	const type = formData.get('type') as string;
	const reservationDate = formData.get('reservationDate') as string;
	const checkInTime = formData.get('checkInTime') as string;
	const guestName = formData.get('guestName') as string;
	const guestEmail = formData.get('guestEmail') as string;
	const guestPhone = formData.get('guestPhone') as string;
	const partySize = parseInt(formData.get('partySize') as string) || 2;
	const roomNumber = formData.get('roomNumber') as string;

	if (
		!storeId ||
		!type ||
		!reservationDate ||
		!checkInTime ||
		!guestName ||
		!guestEmail ||
		!guestPhone
	) {
		return new Response(JSON.stringify({ error: 'All fields are required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const user = locals.user;

	try {
		const reservation = await locals.pb.collection('reservations').create({
			storeId,
			userId: user?.id || '',
			type,
			reservationDate,
			checkInTime,
			guestName,
			guestEmail,
			guestPhone,
			partySize,
			roomNumber: type === 'hotel_room' ? roomNumber : null,
			status: 'pending',
			qrToken: generateQRToken()
		});

		return new Response(JSON.stringify({ success: true, reservation }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Failed to create reservation:', error);
		return new Response(JSON.stringify({ error: 'Failed to create reservation' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
