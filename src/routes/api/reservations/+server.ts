import type { RequestHandler } from './$types';
import crypto from 'crypto';
import { getScopedRestaurantForRequest } from '$lib/server/restaurantAccess';

function generateQRToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

async function generateQRCodeImage(
	token: string,
	guestName: string,
	date: string,
	time: string
): Promise<string> {
	// Keep data minimal for better scannability
	const qrData = JSON.stringify({
		t: token,
		g: guestName,
		d: date,
		h: time
	});

	const apiUrl = 'https://api.qrcode-monkey.com/qr/custom';

	// Simplified config for better scannability
	const requestBody = {
		data: qrData,
		config: {
			body: 'square',
			eye: 'frame0',
			eyeBall: 'ball0',
			bodyColor: '#000000',
			bgColor: '#ffffff',
			eye1Color: '#000000',
			eye2Color: '#000000',
			eye3Color: '#000000',
			eyeBall1Color: '#000000',
			eyeBall2Color: '#000000',
			eyeBall3Color: '#000000',
			logo: '',
			logoMode: 'default'
		},
		size: 300,
		download: false,
		file: 'png'
	};

	try {
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			console.error('QR API error:', response.status, await response.text());
			return '';
		}

		// Convert binary response to base64
		const arrayBuffer = await response.arrayBuffer();
		const base64 = btoa(
			new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
		);

		return 'data:image/png;base64,' + base64;
	} catch (err) {
		console.error('Error generating QR code:', err);
		return '';
	}
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
		const { allowed } = await getScopedRestaurantForRequest(
			locals.pb,
			request.headers.get('host') || '',
			storeId,
			{ allowSuperFallback: true }
		);

		if (!allowed) {
			return new Response(JSON.stringify({ error: 'Invalid restaurant context' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const qrToken = generateQRToken();

		// Generate QR code image URL
		const qrCodeImageUrl = await generateQRCodeImage(
			qrToken,
			guestName,
			reservationDate,
			checkInTime
		);

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
			qrToken,
			qrCodeUrl: qrCodeImageUrl
		});

		return new Response(
			JSON.stringify({
				success: true,
				reservation: {
					...reservation,
					qrCodeUrl: qrCodeImageUrl
				}
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Failed to create reservation:', error);
		return new Response(JSON.stringify({ error: 'Failed to create reservation' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
