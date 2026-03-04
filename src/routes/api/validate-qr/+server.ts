import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const formData = await request.formData();
	const qrToken = formData.get('qrToken') as string;
	const action = formData.get('action') as string;

	if (!qrToken) {
		return new Response(JSON.stringify({ error: 'QR token is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
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
						storeName
					}
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Just return reservation details without modifying
		let storeName = 'Unknown Store';
		try {
			const store = await locals.pb.collection('restaurants').getOne(reservation.storeId);
			storeName = store.name;
		} catch (e) {}

		return new Response(
			JSON.stringify({
				success: true,
				reservation: {
					...reservation,
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
