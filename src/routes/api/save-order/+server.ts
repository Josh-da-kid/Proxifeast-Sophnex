// src/routes/api/save-order/+server.ts
import { error, type RequestHandler } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import nodemailer from 'nodemailer';
import { getScopedRestaurantForRequest } from '$lib/server/restaurantAccess';
import { sendPushNotificationToUser } from '$lib/server/push';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

function isRestaurantOpen(restaurant: any): boolean {
	if (!restaurant.openingTime || !restaurant.closingTime) return true;

	const now = new Date();
	const currentTime = now.getHours() * 60 + now.getMinutes();

	const [openHour, openMin] = restaurant.openingTime.split(':').map(Number);
	const [closeHour, closeMin] = restaurant.closingTime.split(':').map(Number);

	const openTime = openHour * 60 + openMin;
	const closeTime = closeHour * 60 + closeMin;

	return currentTime >= openTime && currentTime <= closeTime;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();

	// Validate address for home delivery
	if (data.type === 'home') {
		if (!data.homeAddress || data.homeAddress.trim() === '') {
			throw error(400, 'Home address is required for delivery');
		}
	}

	// Validate room number for room service
	if (data.type === 'roomService') {
		if (!data.roomNumber || data.roomNumber.trim() === '') {
			throw error(400, 'Room number is required for room service');
		}
	}

	try {
		if (!Array.isArray(data.dishes) || data.dishes.length === 0) {
			throw error(400, 'At least one dish is required');
		}

		// Get restaurant info for each dish and group by restaurant
		const dishRestaurantMap = new Map<string, any[]>();

		for (const dishItem of data.dishes) {
			try {
				const dish = await pb.collection('dishes').getOne(dishItem.dish);
				const restaurantId = dish.restaurantId;
				const quantity = Math.max(1, Number.parseInt(String(dishItem.quantity ?? 1), 10) || 1);
				const unitAmount = Number(dish.promoAmount || dish.defaultAmount || dish.amount || 0);

				const { allowed } = await getScopedRestaurantForRequest(
					pb,
					request.headers.get('host') || '',
					restaurantId,
					{ allowSuperFallback: true }
				);

				if (!allowed) {
					throw error(403, 'Dish does not belong to the current restaurant context');
				}

				if (!dishRestaurantMap.has(restaurantId)) {
					dishRestaurantMap.set(restaurantId, []);
				}
				dishRestaurantMap.get(restaurantId)!.push({
					dish: dish.id,
					dishName: dish.name,
					quantity,
					amount: unitAmount,
					lineTotal: unitAmount * quantity
				});
			} catch (e) {
				if ((e as { status?: number })?.status) {
					throw e;
				}
				console.log('Could not get dish info for:', dishItem.dish);
			}
		}

		const restaurantIds = Array.from(dishRestaurantMap.keys());
		if (restaurantIds.length === 0) {
			throw error(400, 'No valid dishes were found for this order');
		}

		const isMultiRestaurant = restaurantIds.length > 1;
		const mainReference = data.reference;

		const createdOrders = [];

		// Create order(s) - separate for each restaurant if multi-restaurant
		for (const restaurantId of restaurantIds) {
			let restaurant = null;
			try {
				restaurant = await pb.collection('restaurants').getOne(restaurantId);
			} catch (e) {
				console.log('Restaurant not found:', restaurantId);
				continue;
			}

			// Check if restaurant is open
			if (!isRestaurantOpen(restaurant)) {
				throw error(400, `${restaurant.name} is currently closed and not accepting orders`);
			}

			const dishesForRestaurant = dishRestaurantMap.get(restaurantId)!;
			const restaurantTotal = dishesForRestaurant.reduce((sum, d) => sum + (d.lineTotal || 0), 0);
			const restaurantQuantity = dishesForRestaurant.reduce((sum, d) => sum + (d.quantity || 0), 0);

			const orderData: any = {
				name: data.name,
				phone: data.formattedPhone,
				email: data.email,
				deliveryType: data.type,
				status: 'Pending',
				quantity: restaurantQuantity,
				dishes: dishesForRestaurant.map((dish: any) => ({
					dish: dish.dish,
					amount: dish.amount,
					name: dish.dishName,
					quantity: dish.quantity
				})),
				totalAmount: restaurantTotal,
				foodTotal: restaurantTotal,
				deliveryFee: 0,
				payOnDelivery: data.payOnDelivery || false,
				serviceFee: 0,
				smallOrderFee: 0,
				deliveryDistance: 0,
				deliveryTier: '',
				customerState: data.customerState || '',
				restaurantState: restaurant.state || '',
				reference: isMultiRestaurant
					? `${mainReference}-${restaurant.name.replace(/\s+/g, '').toUpperCase()}`
					: mainReference,
				mainReference: mainReference,
				tableNumber: data.tableNumber || '',
				roomNumber: data.roomNumber || '',
				homeAddress: data.homeAddress || '',
				pickupTime: data.pickupTime || '',
				restaurantId: restaurant.id,
				restaurantName: restaurant.name,
				isMultiRestaurantOrder: isMultiRestaurant,
				totalRestaurants: restaurantIds.length
			};

			if (locals.user?.id) {
				orderData.user = locals.user.id;
			}

			const record = await pb.collection('orders').create(orderData);
			createdOrders.push(record);

			// Send email notification to restaurant
			if (restaurant.email || restaurant.restaurantEmail) {
				await sendRestaurantNotification(restaurant, orderData);
			}

			// Send push notification to restaurant admins
			try {
				const adminUsers = await pb.collection('users').getFullList({
					filter: `adminRestaurantIds ?~ "${restaurantId}"`
				});

				for (const admin of adminUsers) {
					await sendPushNotificationToUser(pb, admin.id, {
						title: 'New Order Received!',
						body: `New order #${orderData.reference} from ${orderData.name} - ₦${orderData.totalAmount.toLocaleString()}`,
						data: {
							url: '/admin/admin-order',
							orderId: record.id
						},
						tag: `new-order-${record.id}`
					});
				}
			} catch (pushErr) {
				console.error('Failed to send admin push notification:', pushErr);
			}
		}

		return new Response(JSON.stringify({ success: true, orders: createdOrders }), { status: 200 });
	} catch (err) {
		console.error('Save order error:', err);
		return new Response(
			JSON.stringify({
				success: false,
				error: err instanceof Error ? err.message : String(err)
			}),
			{ status: 500 }
		);
	}
};

async function sendRestaurantNotification(restaurant: any, orderData: any) {
	try {
		const transporter = nodemailer.createTransport({
			host: 'smtp-relay.brevo.com',
			port: 587,
			auth: {
				user: import.meta.env.VITE_BREVO_LOGIN,
				pass: import.meta.env.VITE_BREVO_SMTP_KEY
			}
		});

		const dishesList = orderData.dishes
			.map(
				(d: any) =>
					`<tr>
				<td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${d.name}</td>
				<td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${d.quantity}</td>
				<td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₦${d.amount.toLocaleString()}</td>
			</tr>`
			)
			.join('');

		let deliveryInfo = '';
		if (orderData.deliveryType === 'home') {
			deliveryInfo = `
				<div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 8px;">
					<p style="margin: 0; font-weight: 600; color: #1f2937;">Delivery Details:</p>
					<p style="margin: 4px 0 0 0; color: #4b5563;">Address: ${orderData.homeAddress}</p>
					<p style="margin: 4px 0 0 0; color: #4b5563;">Delivery fee to be collected on delivery</p>
				</div>
			`;
		} else if (orderData.deliveryType === 'tableService') {
			deliveryInfo = `
				<div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 8px;">
					<p style="margin: 0; font-weight: 600; color: #1f2937;">Table Service - Table #${orderData.tableNumber}</p>
				</div>
			`;
		} else if (orderData.deliveryType === 'restaurantPickup') {
			deliveryInfo = `
				<div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 8px;">
					<p style="margin: 0; font-weight: 600; color: #1f2937;">Pickup Time: ${orderData.pickupTime}</p>
				</div>
			`;
		}

		const multiRestaurantNotice = orderData.isMultiRestaurantOrder
			? `<div style="margin-top: 16px; padding: 12px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
				<p style="margin: 0; color: #92400e;"><strong>Note:</strong> This is part of a multi-restaurant order (${orderData.totalRestaurants} restaurants total). Order Reference: ${orderData.mainReference}</p>
			</div>`
			: '';

		const html = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background-color: #f59e0b; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
					<h1 style="color: white; margin: 0; font-size: 24px;">🍽️ New Order Received!</h1>
				</div>
				<div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
					<p style="color: #4b5563; font-size: 16px;">Hello ${restaurant.name},</p>
					<p style="color: #1f2937; font-size: 16px;">You have received a new order. Here are the details:</p>
					
					<div style="margin-top: 24px; background-color: #f9fafb; padding: 16px; border-radius: 8px;">
						<p style="margin: 0 0 8px 0;"><strong>Order Reference:</strong> ${orderData.reference}</p>
						<p style="margin: 0 0 8px 0;"><strong>Customer:</strong> ${orderData.name}</p>
						<p style="margin: 0 0 8px 0;"><strong>Phone:</strong> ${orderData.phone}</p>
						<p style="margin: 0;"><strong>Email:</strong> ${orderData.email}</p>
					</div>

					<h3 style="margin-top: 24px; color: #1f2937;">Order Items:</h3>
					<table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
						<thead>
							<tr style="background-color: #f3f4f6;">
								<th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
								<th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
								<th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
							</tr>
						</thead>
						<tbody>
							${dishesList}
						</tbody>
						<tfoot>
							<tr style="background-color: #f9fafb; font-weight: 600;">
								<td style="padding: 12px; border-top: 2px solid #e5e7eb;" colspan="2">Total:</td>
								<td style="padding: 12px; border-top: 2px solid #e5e7eb; text-align: right;">₦${orderData.totalAmount.toLocaleString()}</td>
							</tr>
						</tfoot>
					</table>

					${deliveryInfo}
					${multiRestaurantNotice}

					<div style="margin-top: 24px; padding: 16px; background-color: #d1fae5; border-radius: 8px; text-align: center;">
						<p style="margin: 0; color: #065f46; font-weight: 600;">Please prepare this order and update its status in your admin dashboard.</p>
					</div>

					<p style="margin-top: 24px; color: #6b7280; font-size: 14px; text-align: center;">
						This is an automated notification from Proxifeast.<br>
						Order time: ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
					</p>
				</div>
			</div>
		`;

		await transporter.sendMail({
			from: `"Proxifeast Orders" <${import.meta.env.VITE_BREVO_LOGIN}>`,
			to: restaurant.email || restaurant.restaurantEmail,
			subject: `🍽️ New Order #${orderData.reference} - ₦${orderData.totalAmount.toLocaleString()}`,
			html
		});

		console.log(`Restaurant notification sent to ${restaurant.name}`);
	} catch (err) {
		console.error('Failed to send restaurant notification:', err);
	}
}
