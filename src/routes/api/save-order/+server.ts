// src/routes/api/save-order/+server.ts
import { error, type RequestHandler } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import nodemailer from 'nodemailer';

const pb = new PocketBase('https://playgzero.pb.itcass.net/');

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	try {
		// Get restaurant by ID (passed from checkout)
		const restaurant = await pb.collection('restaurants').getOne(data.restaurantId);

		if (!restaurant) {
			throw error(400, 'Restaurant not found');
		}

		// Create the order
		const orderData: any = {
			user: data.user,
			name: data.name,
			phone: data.formattedPhone,
			email: data.email,
			deliveryType: data.type,
			status: 'Pending',
			quantity: data.quantity,
			dishes: data.dishes.map((dish: any) => ({
				dish: dish.dish,
				amount: dish.amount,
				name: dish.name,
				quantity: dish.quantity
			})),
			totalAmount: data.totalAmount,
			foodTotal: data.foodTotal || data.totalAmount,
			deliveryFee: data.deliveryFee || 0,
			serviceFee: data.serviceFee || 0,
			smallOrderFee: data.smallOrderFee || 0,
			deliveryDistance: data.deliveryDistance || 0,
			deliveryTier: data.deliveryTier || '',
			customerState: data.customerState || '',
			restaurantState: data.restaurantState || '',
			reference: data.reference,
			mainReference: data.mainReference || data.reference,
			tableNumber: data.tableNumber || '',
			homeAddress: data.homeAddress || '',
			pickupTime: data.pickupTime || '',
			restaurantId: restaurant.id,
			restaurantName: data.restaurantName || restaurant.name,
			isMultiRestaurantOrder: data.isMultiRestaurantOrder || false,
			totalRestaurants: data.totalRestaurants || 1
		};

		const record = await pb.collection('orders').create(orderData);

		// Send email notification to restaurant if restaurant has an email
		if (restaurant.email || restaurant.restaurantEmail) {
			await sendRestaurantNotification(restaurant, orderData);
		}

		return new Response(JSON.stringify({ success: true, record }), { status: 200 });
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
			const feesBreakdown = [];
			if (orderData.deliveryFee > 0)
				feesBreakdown.push(`Delivery: ₦${orderData.deliveryFee.toLocaleString()}`);
			if (orderData.serviceFee > 0)
				feesBreakdown.push(`Service: ₦${orderData.serviceFee.toLocaleString()}`);
			if (orderData.smallOrderFee > 0)
				feesBreakdown.push(`Small Order: ₦${orderData.smallOrderFee.toLocaleString()}`);

			deliveryInfo = `
				<div style="margin-top: 16px; padding: 12px; background-color: #f3f4f6; border-radius: 8px;">
					<p style="margin: 0; font-weight: 600; color: #1f2937;">Delivery Details:</p>
					<p style="margin: 4px 0 0 0; color: #4b5563;">Address: ${orderData.homeAddress}</p>
					<p style="margin: 4px 0 0 0; color: #4b5563;">Distance: ${orderData.deliveryDistance}km${orderData.deliveryTier ? ` (${orderData.deliveryTier} tier)` : ''}</p>
					<p style="margin: 4px 0 0 0; color: #4b5563;">Location: ${orderData.customerState || 'Unknown'}</p>
					${feesBreakdown.length > 0 ? `<p style="margin: 4px 0 0 0; color: #4b5563;">Fees: ${feesBreakdown.join(' | ')}</p>` : ''}
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
				<p style="margin: 0; color: #92400e;"><strong>Note:</strong> This is part of a multi-restaurant order (${orderData.totalRestaurants} restaurants total). The customer placed one payment but orders are split per restaurant.</p>
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
								<td style="padding: 12px; border-top: 2px solid #e5e7eb;" colspan="2">Food Subtotal:</td>
								<td style="padding: 12px; border-top: 2px solid #e5e7eb; text-align: right;">₦${orderData.foodTotal.toLocaleString()}</td>
							</tr>
							${
								orderData.deliveryFee > 0
									? `
							<tr style="background-color: #f9fafb;">
								<td style="padding: 12px;" colspan="2">Delivery Fee:</td>
								<td style="padding: 12px; text-align: right;">₦${orderData.deliveryFee.toLocaleString()}</td>
							</tr>
							`
									: ''
							}
							${
								orderData.serviceFee > 0
									? `
							<tr style="background-color: #f9fafb;">
								<td style="padding: 12px;" colspan="2">Service Fee:</td>
								<td style="padding: 12px; text-align: right;">₦${orderData.serviceFee.toLocaleString()}</td>
							</tr>
							`
									: ''
							}
							${
								orderData.smallOrderFee > 0
									? `
							<tr style="background-color: #f9fafb;">
								<td style="padding: 12px;" colspan="2">Small Order Fee:</td>
								<td style="padding: 12px; text-align: right;">₦${orderData.smallOrderFee.toLocaleString()}</td>
							</tr>
							`
									: ''
							}
							<tr style="background-color: #f59e0b; color: white; font-weight: 700; font-size: 18px;">
								<td style="padding: 16px; border-radius: 0 0 0 8px;" colspan="2">Total Amount:</td>
								<td style="padding: 16px; text-align: right; border-radius: 0 0 8px 0;">₦${orderData.totalAmount.toLocaleString()}</td>
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
		// Don't throw - order is already saved, email is secondary
	}
}
