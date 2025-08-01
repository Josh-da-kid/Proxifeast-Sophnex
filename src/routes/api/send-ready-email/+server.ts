// import type { RequestHandler } from '@sveltejs/kit';
// import nodemailer from 'nodemailer';

// export const POST: RequestHandler = async ({ request }) => {
// 	const { email, name, reference } = await request.json();

// 	if (!email) return new Response('Email is required', { status: 400 });

//     console.log('SMTP LOGIN:', import.meta.env.VITE_BREVO_LOGIN);
// console.log('SMTP Key:', import.meta.env.VITE_BREVO_SMTP_KEY);


// 	try {
// 		// ✅ Set up your mail transport
// 		const transporter = nodemailer.createTransport({
// 			host: 'smtp-relay.brevo.com', // or use Brevo (formerly Sendinblue)
// 			port: 587,
// 			auth: {
// 				user: import.meta.env.VITE_BREVO_LOGIN,
// 				pass: import.meta.env.VITE_BREVO_SMTP_KEY
// 			}
// 		});

//         await transporter.verify(); // ← Add this to test
//         console.log('SMTP connection verified');

//         console.log('email:', email);
// console.log('user:', import.meta.env.VITE_BREVO_LOGIN);
// console.log('pass:', import.meta.env.VITE_BREVO_SMTP_KEY ? 'Loaded' : 'Missing');


// 		// ✅ Send email
// 		await transporter.sendMail({
// 			from: 'Proxifeast Restaurant <carmenjosh84@gmail.com>',
// 			to: email,
// 			subject: `Order ${reference} is Ready for Pickup/Delivery`,
// 			html: `<p>Hi ${name},</p><p>Your order <strong>${reference}</strong> is now <strong>Ready</strong>. Please come pick it up or wait for delivery!</p><p>Thanks for ordering from us!</p>`
// 		});

// 		return new Response('Email sent');
// 	} catch (err) {
// 		console.error('Error sending email:', err);
// 		return new Response('Failed to send email', { status: 500 });
// 	}
// };



import type { RequestHandler } from '@sveltejs/kit';
import nodemailer from 'nodemailer';
import PocketBase from 'pocketbase';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { email, name, reference, status, deliveryType, address, tableNumber } = body;

	// console.log('Incoming email payload:', body);
	// console.log(import.meta.env.VITE_BREVO_LOGIN)
	// console.log(import.meta.env.VITE_BREVO_SMTP_KEY)

	if (!email || !status) {
		return new Response('Email and status are required', { status: 400 });
	}

    const host = request.headers.get('host') || '';
		const domain = host.split(':')[0];
		const pb = new PocketBase('https://playgzero.pb.itcass.net');
		pb.autoCancellation(false); // disable auto-cancel
	
		// 1. Get restaurant by domain
		const restaurant = await pb.collection('restaurants').getFirstListItem(`domain="${domain}"`);


	try {
		const transporter = nodemailer.createTransport({
			host: 'smtp-relay.brevo.com',
			port: 587,
			auth: {
				user: import.meta.env.VITE_BREVO_LOGIN,
				pass: import.meta.env.VITE_BREVO_SMTP_KEY
			}
		});

		await transporter.verify();

		let subject = '';
        // const type = deliveryType ?? 'pickup';
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
		// console.log(restaurant.name)

		await transporter.sendMail({
			from: `${restaurant.name} <carmenjosh84@gmail.com>`,
			to: email,
			subject,
			html
		});

		return new Response('Email sent');
	} catch (err:any) {
		console.error('Error sending email:', err);
	return new Response(`Failed to send email: ${err.message ?? err}`, { status: 500 });
		// console.error('Error sending email:', err);
		// return new Response('Failed to send email', { status: 500 });
	}
};
