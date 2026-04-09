import type { RequestHandler } from './$types';
import { canAdminAccessRestaurant } from '$lib/server/restaurantAccess';

export const POST: RequestHandler = async ({ request, locals }) => {
	const formData = await request.formData();
	let qrToken = formData.get('qrToken') as string;
	const action = formData.get('action') as string;
	const isAdminLookup = action === 'lookup' || action === 'checkin';

	if (!qrToken) {
		return new Response(JSON.stringify({ error: 'QR token is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Try to parse as our JSON format
	try {
		const parsed = JSON.parse(qrToken);
		if (parsed.t) {
			// Our format: {"t":"token","g":"guest","d":"date","h":"time"}
			qrToken = parsed.t;
		}
	} catch {
		// Not JSON, use as-is (might be raw token)
	}

	try {
		// Find the reservation by QR token
		const reservations = await locals.pb.collection('reservations').getFullList({
			filter: `qrToken = "${qrToken}"`
		});

		if (reservations.length === 0) {
			return new Response(JSON.stringify({ error: 'Invalid QR code. Reservation not found.' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const reservation = reservations[0];

		if (isAdminLookup) {
			if (!locals.user) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			if (!(await canAdminAccessRestaurant(locals.pb, locals.user, reservation.storeId))) {
				return new Response(JSON.stringify({ error: 'Forbidden' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// If action is to check-in, validate and update
		if (action === 'checkin') {
			// Check if already checked in
			if (reservation.status === 'checked_in') {
				return new Response(
					JSON.stringify({ error: 'This reservation has already been checked in.' }),
					{
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					}
				);
			}

			// Check if cancelled
			if (reservation.status === 'cancelled') {
				return new Response(JSON.stringify({ error: 'This reservation has been cancelled.' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Check if expired (reservation date is in the past)
			const reservationDate = new Date(reservation.reservationDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (reservationDate < today) {
				return new Response(JSON.stringify({ error: 'This reservation has expired.' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Update to checked in
			const updated = await locals.pb.collection('reservations').update(reservation.id, {
				status: 'checked_in',
				checkedInAt: new Date().toISOString()
			});

			// Get store info
			let storeName = 'Unknown Store';
			try {
				const store = await locals.pb.collection('restaurants').getOne(reservation.storeId);
				storeName = store.name;
			} catch (e) {}

			return new Response(
				JSON.stringify({
					success: true,
					message: 'Guest checked in successfully',
					reservation: {
						...updated,
						qrToken,
						storeName
					}
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		if (action === 'lookup') {
			let storeName = 'Unknown Store';
			try {
				const store = await locals.pb.collection('restaurants').getOne(reservation.storeId);
				storeName = store.name;
			} catch (e) {}

			return new Response(
				JSON.stringify({
					success: true,
					reservation: {
						id: reservation.id,
						qrToken,
						type: reservation.type,
						guestName: reservation.guestName,
						guestEmail: reservation.guestEmail,
						guestPhone: reservation.guestPhone,
						reservationDate: reservation.reservationDate,
						checkInTime: reservation.checkInTime,
						partySize: reservation.partySize,
						roomNumber: reservation.roomNumber,
						status: reservation.status,
						checkedInAt: reservation.checkedInAt,
						storeId: reservation.storeId,
						storeName
					}
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Public token validation returns limited details only.
		let storeName = 'Unknown Store';
		try {
			const store = await locals.pb.collection('restaurants').getOne(reservation.storeId);
			storeName = store.name;
		} catch (e) {}

		return new Response(
			JSON.stringify({
				success: true,
				reservation: {
					id: reservation.id,
					guestName: reservation.guestName,
					reservationDate: reservation.reservationDate,
					checkInTime: reservation.checkInTime,
					partySize: reservation.partySize,
					status: reservation.status,
					storeName
				}
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error validating QR:', error);
		return new Response(JSON.stringify({ error: 'Failed to validate QR code' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
