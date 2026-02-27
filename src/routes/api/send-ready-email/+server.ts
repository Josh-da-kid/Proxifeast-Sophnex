import type { RequestHandler } from '@sveltejs/kit';
import nodemailer from 'nodemailer';
import PocketBase from 'pocketbase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { email, name, reference, status, deliveryType, address, tableNumber } = body;

		console.log('[Email API] Received request for:', email, 'status:', status);

		if (!email || !status) {
			return new Response('Email and status are required', { status: 400 });
		}

		const host = request.headers.get('host') || '';
		const domain = host.split(':')[0];
		const pb = new PocketBase('https://playgzero.pb.itcass.net');
		pb.autoCancellation(false);

		// Get restaurant by domain
		const restaurant = await pb.collection('restaurants').getFirstListItem(`domain="${domain}"`);

		// Check BREVO credentials
		const brevoLogin = import.meta.env.VITE_BREVO_LOGIN;
		const brevoKey = import.meta.env.VITE_BREVO_SMTP_KEY;

		console.log('[Email API] BREVO_LOGIN set:', !!brevoLogin, 'BREVO_SMTP_KEY set:', !!brevoKey);

		if (
			!brevoLogin ||
			!brevoKey ||
			brevoLogin === 'your-brevo-email@example.com' ||
			brevoKey === 'your-brevo-smtp-key'
		) {
			console.error('[Email API] BREVO credentials not configured!');
			return new Response('Email service not configured. Please contact support.', { status: 500 });
		}

		const transporter = nodemailer.createTransport({
			host: 'smtp-relay.brevo.com',
			port: 587,
			auth: {
				user: brevoLogin,
				pass: brevoKey
			}
		});

		console.log('[Email API] Verifying SMTP connection...');
		await transporter.verify();
		console.log('[Email API] SMTP verified successfully');

		let subject = '';
		let html = '';

		switch (status) {
			case 'Ready':
				subject = `Order ${reference} is Ready for Pickup/Delivery`;

				if (deliveryType === 'restaurantPickup') {
					html = `<p>Hi ${name},</p>
						<p>Your order <strong>${reference}</strong> is now <strong>Ready</strong>.</p>
						<p>Please come pick it up at the restaurant.</p>
						<p>Thanks for ordering from us!</p>`;
				} else if (deliveryType === 'home') {
					html = `<p>Hi ${name},</p>
						<p>Your order <strong>${reference}</strong> is now <strong>Ready</strong> and will be delivered to:</p>
						<p><strong>${address ?? 'your address'}</strong></p>
						<p>Thanks for ordering from us!</p>`;
				} else if (deliveryType === 'tableService') {
					html = `<p>Hi ${name},</p>
						<p>Your order <strong>${reference}</strong> is now <strong>Ready</strong>.</p>
						<p>It will be served to your table <strong>#${tableNumber ?? 'N/A'}</strong>.</p>
						<p>Thanks for dining with us!</p>`;
				} else {
					html = `<p>Hi ${name},</p>
						<p>Your order <strong>${reference}</strong> is now <strong>Ready</strong>.</p>`;
				}
				break;

			case 'Cancelled':
				subject = `Order ${reference} has been Cancelled`;
				html = `<p>Hi ${name},</p>
					<p>We're sorry to inform you that your order <strong>${reference}</strong> has been <strong>Cancelled</strong>.</p>
					<p>If you have questions, feel free to contact us.</p>`;
				break;

			case 'Delivered':
				subject = `Order ${reference} has been Delivered`;
				html = `<p>Hi ${name},</p>
					<p>Your order <strong>${reference}</strong> has been <strong>Delivered</strong>. We hope you enjoyed it!</p>
					<p>Thanks for choosing Proxifeast!</p>`;
				break;

			default:
				return new Response('Unsupported status', { status: 400 });
		}

		console.log('[Email API] Sending email to:', email, 'subject:', subject);
		await transporter.sendMail({
			from: `${restaurant.name} <${brevoLogin}>`,
			to: email,
			subject,
			html
		});
		console.log('[Email API] Email sent successfully');

		return new Response('Email sent');
	} catch (err: any) {
		console.error('[Email API] Error sending email:', err);
		console.error('[Email API] Error details:', err.message, err.stack);
		return new Response(`Failed to send email: ${err.message ?? err}`, { status: 500 });
	}
};
