import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('=== SET-INQUIRIES PAGE DEBUG ===');
	console.log('locals.restaurant:', locals.restaurant);
	console.log('locals.user adminRestaurantIds:', locals.user?.adminRestaurantIds);
	console.log('=================================');

	const userRole = locals.user?.role || 'manager';
	const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

	if (!isManagerOrOwner) {
		throw redirect(303, '/admin/admin-menu?unauthorized=1');
	}

	// Get user's accessible restaurant IDs
	const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
	const userRestaurantIds = locals.user?.restaurantIds || [];
	const allUserRestaurantIds = [...new Set([...adminRestaurantIds, ...userRestaurantIds])];

	if (allUserRestaurantIds.length === 0) {
		throw redirect(303, '/admin/admin-menu?unauthorized=1');
	}

	// Fetch all restaurants to check which ones are super
	const allRestaurants = await locals.pb.collection('restaurants').getFullList();

	// Find user's accessible restaurants
	const userRestaurants = allRestaurants.filter((r: any) => allUserRestaurantIds.includes(r.id));

	// Find if user has access to any super restaurant
	const superRestaurant = userRestaurants.find(
		(r: any) => r.isSuper === true || r.isSuper === 'true'
	);

	console.log(
		'User restaurants:',
		userRestaurants.map((r: any) => r.name)
	);
	console.log('Super restaurant found:', superRestaurant?.name);

	if (!superRestaurant) {
		console.log('No super restaurant access, redirecting');
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
