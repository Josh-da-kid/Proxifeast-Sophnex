import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('=== SET-INQUIRIES PAGE DEBUG ===');
	console.log('locals.restaurant:', locals.restaurant);
	console.log('locals.restaurant.isSuper:', locals.restaurant?.isSuper);
	console.log('=================================');

	const userRole = locals.user?.role || 'manager';
	const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

	if (!isManagerOrOwner) {
		throw redirect(303, '/admin/admin-menu?unauthorized=1');
	}

	// Check if the current restaurant is a super restaurant by fetching it fresh from the database
	const currentRestaurantId = locals.restaurant?.id;

	if (!currentRestaurantId) {
		console.log('No restaurant ID found, redirecting');
		throw redirect(303, '/admin/admin-menu?unauthorized=1');
	}

	// Fetch the restaurant directly from the database to get the correct isSuper value
	let isCurrentRestaurantSuper = false;
	try {
		const restaurant = await locals.pb.collection('restaurants').getOne(currentRestaurantId);
		console.log('Fetched restaurant:', restaurant.name, 'isSuper:', restaurant.isSuper);

		// Check isSuper field - handle both boolean true and string "true"
		isCurrentRestaurantSuper = restaurant.isSuper === true || restaurant.isSuper === 'true';
		console.log('isCurrentRestaurantSuper:', isCurrentRestaurantSuper);
	} catch (e) {
		console.error('Error fetching restaurant:', e);
		throw redirect(303, '/admin/admin-menu?unauthorized=1');
	}

	if (!isCurrentRestaurantSuper) {
		console.log('Not a super restaurant, redirecting');
		throw redirect(303, '/admin/admin-menu?unauthorized=1');
	}

	try {
		const setupInquiries = await locals.pb.collection('setupInquiries').getFullList({
			sort: '-created'
		});

		console.log(
			'Setup inquiries fields:',
			setupInquiries.length > 0 ? Object.keys(setupInquiries[0]) : 'none'
		);
		console.log('Sample inquiry:', setupInquiries[0]);

		const allRestaurants = await locals.pb.collection('restaurants').getFullList({
			sort: 'name'
		});

		return {
			setupInquiries: setupInquiries.map((inquiry: any) => {
				const restaurant = allRestaurants.find((r: any) => r.id === inquiry.restaurantId);
				return {
					...inquiry,
					contactName: inquiry.contactName || inquiry.name || '-',
					restaurantName: inquiry.restaurantName || restaurant?.name || 'Unknown Restaurant',
					selectedPackage: inquiry.selectedPackage || inquiry.package || '-',
					notes: inquiry.notes || inquiry.message || '-',
					location: inquiry.location || inquiry.address || inquiry.restaurantAddress || '-'
				};
			}),
			isSuper: true
		};
	} catch (error) {
		console.error('Error fetching setup inquiries:', error);
		return {
			setupInquiries: [],
			isSuper: true
		};
	}
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		const formData = await request.formData();
		const inquiryId = formData.get('inquiryId') as string;
		const status = formData.get('status') as string;

		if (!inquiryId || !status) {
			return fail(400, { error: 'Inquiry ID and status are required' });
		}

		try {
			await locals.pb.collection('setupInquiries').update(inquiryId, {
				status
			});

			return { success: true, message: 'Status updated successfully' };
		} catch (error) {
			return fail(500, { error: 'Failed to update status' });
		}
	}
};
