import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Force refresh user data from PocketBase to get latest adminRestaurantIds
	if (locals.user && locals.pb.authStore.isValid) {
		try {
			const freshUser = await locals.pb.collection('users').getOne(locals.user.id);
			locals.user = freshUser;
		} catch (e) {
			console.log('Could not refresh user:', e);
		}
	}

	if (!locals.user) {
		return { restaurant: null, orderServices: null, teamMembers: [], restaurants: [] };
	}

	const userRole = locals.user?.role || 'manager';
	const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

	if (!isManagerOrOwner) {
		return { restaurant: null, orderServices: null, teamMembers: [], restaurants: [] };
	}

	const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
	const userRestaurantIds = locals.user?.restaurantIds || [];

	// Get all accessible restaurant IDs
	const allAccessibleIds = [...new Set([...adminRestaurantIds, ...userRestaurantIds])];

	// Try URL param first, then fallback to first accessible restaurant
	let restaurantId = url.searchParams.get('restaurantId') || allAccessibleIds[0];

	console.log('Restaurant ID to load:', restaurantId);
	console.log('All accessible IDs:', allAccessibleIds);

	if (!restaurantId) {
		console.log('No restaurant ID found. User data:', { adminRestaurantIds, userRestaurantIds });
		return { restaurant: null, orderServices: null, teamMembers: [], restaurants: [] };
	}

	// Verify user has access to the requested restaurant
	if (restaurantId && !allAccessibleIds.includes(restaurantId)) {
		console.log('User does not have access to restaurant:', restaurantId);
		// Instead of returning error, try to use the first accessible restaurant
		restaurantId = allAccessibleIds[0];
		if (!restaurantId) {
			return { restaurant: null, orderServices: null, teamMembers: [], restaurants: [] };
		}
	}

	try {
		console.log('Loading restaurant:', restaurantId);
		const restaurant = await locals.pb.collection('restaurants').getOne(restaurantId);
		console.log('Restaurant loaded successfully:', restaurant?.name);

		console.log('Restaurant fields:', Object.keys(restaurant));

		const orderServices = restaurant.orderServices || {
			tableService: true,
			pickup: true,
			homeDelivery: true
		};

		// Check if user is super admin by checking if they have access to a super restaurant
		let allRestaurantsForSuperCheck: any[] = [];
		try {
			allRestaurantsForSuperCheck = await locals.pb.collection('restaurants').getFullList();
			console.log('All restaurants fetched:', allRestaurantsForSuperCheck.length);
		} catch (e) {
			console.error('Error fetching restaurants for super check:', e);
		}

		const userAdminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const userRestaurantIdsList = locals.user?.restaurantIds || [];
		const allUserRestaurantIds = [
			...new Set([...userAdminRestaurantIds, ...userRestaurantIdsList])
		];

		const isSuperUser = allUserRestaurantIds.some((id: string) => {
			const rest = allRestaurantsForSuperCheck.find((r: any) => r.id === id);
			return rest?.isSuper === true;
		});

		console.log('isSuperUser check:', {
			userAdminRestaurantIds,
			allUserRestaurantIds,
			isSuperUser
		});

		// Fetch team members based on super user status
		let teamMembers;
		if (isSuperUser) {
			// For super users, show ALL users in the system
			teamMembers = await locals.pb.collection('users').getFullList({
				sort: 'name'
			});

			console.log('All users fetched for super admin:', teamMembers.length);

			// Fetch all restaurants to map IDs to names
			const allRestaurants = await locals.pb.collection('restaurants').getFullList();
			const restaurantMap = new Map(allRestaurants.map((r: any) => [r.id, r.name]));

			// Add restaurant names to each member
			teamMembers = teamMembers.map((member: any) => {
				const adminRestaurants = (member.adminRestaurantIds || [])
					.map((id: string) => restaurantMap.get(id))
					.filter(Boolean);
				const userRestaurants = (member.restaurantIds || [])
					.map((id: string) => restaurantMap.get(id))
					.filter(Boolean);
				return {
					...member,
					adminRestaurants: [...adminRestaurants, ...userRestaurants]
				};
			});
		} else {
			// For regular restaurants, show ALL users - the filter will be applied in a more relaxed way
			// First get all users, then filter by restaurant access
			teamMembers = await locals.pb.collection('users').getFullList({
				sort: 'name'
			});

			console.log('All users fetched (non-super):', teamMembers.length);

			// Filter to users who have this restaurant in their admin or regular restaurant list
			teamMembers = teamMembers.filter((m: any) => {
				const adminIds = m.adminRestaurantIds || [];
				const regularIds = m.restaurantIds || [];
				return adminIds.includes(restaurantId) || regularIds.includes(restaurantId);
			});

			console.log('Users with access to restaurant', restaurantId, ':', teamMembers.length);
		}

		// Fetch all accessible restaurants for the dropdown
		let restaurants: any[] = [];
		if (isSuperUser) {
			// Super users can see all restaurants in the system
			restaurants = await locals.pb.collection('restaurants').getFullList({
				sort: 'name'
			});
		} else if (allAccessibleIds.length > 0) {
			const filterParts = allAccessibleIds.map((id) => `id = "${id}"`);
			restaurants = await locals.pb.collection('restaurants').getFullList({
				filter: filterParts.join(' || ')
			});
		}

		// Load setup inquiries for super users
		let setupInquiries: any[] = [];
		if (isSuperUser) {
			try {
				setupInquiries = await locals.pb.collection('setupInquiries').getFullList({
					sort: '-created'
				});
			} catch (e) {
				console.log('No setup inquiries found');
			}
		}

		let galleryImages: string[] = [];
		if (restaurant.galleryImages) {
			if (typeof restaurant.galleryImages === 'string') {
				try {
					galleryImages = JSON.parse(restaurant.galleryImages);
				} catch {
					galleryImages = [];
				}
			} else if (Array.isArray(restaurant.galleryImages)) {
				galleryImages = restaurant.galleryImages;
			}
		}

		return {
			restaurant,
			orderServices,
			galleryImages,
			restaurantId,
			restaurants: restaurants.map((r: any) => ({ id: r.id, name: r.name })),
			teamMembers: teamMembers.map((member: any) => ({
				id: member.id,
				name: member.name,
				email: member.email,
				role: member.role || 'manager',
				isActive: member.isActive !== false,
				adminRestaurants: member.adminRestaurants || []
			})),
			isSuper: isSuperUser,
			setupInquiries
		};
	} catch (error: any) {
		console.error('Error loading settings:', error);
		// Return more info for debugging
		const errorMessage = error?.message || error?.data?.message || 'Unknown error';
		console.error('Detailed error:', errorMessage);
		return {
			restaurant: null,
			orderServices: null,
			teamMembers: [],
			restaurants: [],
			error: errorMessage
		};
	}
};

export const actions: Actions = {
	updateOrderServices: async ({ request, locals, url }) => {
		const formData = await request.formData();

		const restaurantId =
			(formData.get('restaurantId') as string) ||
			url.searchParams.get('restaurantId') ||
			locals.restaurant?.id;

		if (!restaurantId) {
			return fail(400, { error: 'No restaurant selected' });
		}

		const userRole = locals.user?.role || 'manager';
		const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

		if (!isManagerOrOwner) {
			return fail(403, { error: 'Unauthorized' });
		}

		const tableService = formData.get('tableService') === 'on';
		const pickup = formData.get('pickup') === 'on';
		const homeDelivery = formData.get('homeDelivery') === 'on';

		const orderServices = {
			tableService,
			pickup,
			homeDelivery
		};

		try {
			await locals.pb.collection('restaurants').update(restaurantId, {
				orderServices
			});

			return { success: true, message: 'Order services saved successfully' };
		} catch (error) {
			return fail(500, { error: 'Failed to save settings' });
		}
	},

	updateRestaurantInfo: async ({ request, locals, url }) => {
		const formData = await request.formData();

		const restaurantId =
			(formData.get('restaurantId') as string) ||
			url.searchParams.get('restaurantId') ||
			locals.restaurant?.id;

		if (!restaurantId) {
			return fail(400, { error: 'No restaurant selected' });
		}

		const userRole = locals.user?.role || 'manager';
		const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

		if (!isManagerOrOwner) {
			return fail(403, { error: 'Unauthorized' });
		}

		const name = formData.get('name') as string;
		const domain = formData.get('domain') as string;
		const category = formData.get('category') as string;
		const motto = formData.get('motto') as string;
		const description = formData.get('description') as string;
		const openingTime = formData.get('openingTime') as string;
		const closingTime = formData.get('closingTime') as string;
		const address = formData.get('address') as string;
		const phone = formData.get('phone') as string;
		const state = formData.get('state') as string;
		const localGovernment = formData.get('localGovernment') as string;
		const imageUrl = formData.get('imageUrl') as string;
		const logoUrl = formData.get('logoUrl') as string;
		const bannerUrl = formData.get('bannerUrl') as string;

		const updateData: Record<string, any> = {};
		if (name) updateData.name = name;
		if (domain) updateData.domain = domain;
		if (category) updateData.category = category;
		if (motto) updateData.motto = motto;
		if (description) updateData.description = description;
		if (openingTime) updateData.openingTime = openingTime;
		if (closingTime) updateData.closingTime = closingTime;
		if (address) {
			updateData.address = address;
			updateData.restaurantAddress = address;
		}
		if (phone) {
			updateData.phone = phone;
			updateData.phoneNumber = phone;
		}
		if (state) updateData.state = state;
		if (localGovernment) updateData.localGovernment = localGovernment;
		if (imageUrl) updateData.imageUrl = imageUrl;
		// Only update logoUrl if it's a valid URL (http, https, or data URI for base64)
		if (
			logoUrl &&
			(logoUrl.startsWith('http') || logoUrl.startsWith('data:') || logoUrl.startsWith('/'))
		) {
			updateData.logoUrl = logoUrl;
		}
		if (
			bannerUrl &&
			(bannerUrl.startsWith('http') || bannerUrl.startsWith('data:') || bannerUrl.startsWith('/'))
		) {
			updateData.bannerUrl = bannerUrl;
		}

		console.log('Updating restaurant:', restaurantId, updateData);

		try {
			await locals.pb.collection('restaurants').update(restaurantId, updateData);

			return { success: true, message: 'Restaurant information saved successfully' };
		} catch (error) {
			return fail(500, { error: 'Failed to save restaurant information' });
		}
	},

	updateGallery: async ({ request, locals, url }) => {
		const formData = await request.formData();

		const restaurantId =
			(formData.get('restaurantId') as string) ||
			url.searchParams.get('restaurantId') ||
			locals.restaurant?.id;

		if (!restaurantId) {
			return fail(400, { error: 'No restaurant selected' });
		}

		const userRole = locals.user?.role || 'manager';
		const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

		if (!isManagerOrOwner) {
			return fail(403, { error: 'Unauthorized' });
		}

		const galleryImagesJson = formData.get('galleryImages') as string;
		let galleryImages: string[] = [];

		if (galleryImagesJson) {
			try {
				galleryImages = JSON.parse(galleryImagesJson);
			} catch {
				return fail(400, { error: 'Invalid gallery images format' });
			}
		}

		try {
			await locals.pb.collection('restaurants').update(restaurantId, {
				galleryImages
			});

			return { success: true, message: 'Gallery updated successfully' };
		} catch (error) {
			return fail(500, { error: 'Failed to update gallery' });
		}
	},

	updateUserRole: async ({ request, locals, url }) => {
		const restaurantId =
			((await request.formData()).get('restaurantId') as string) ||
			url.searchParams.get('restaurantId') ||
			locals.restaurant?.id;

		if (!restaurantId) {
			return fail(400, { error: 'No restaurant selected' });
		}

		const userRole = locals.user?.role || 'manager';
		const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

		if (!isManagerOrOwner) {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const newRole = formData.get('role') as string;

		if (!userId || !newRole) {
			return fail(400, { error: 'Missing required fields' });
		}

		if (userId === locals.user?.id) {
			return fail(400, { error: 'You cannot change your own role' });
		}

		try {
			await locals.pb.collection('users').update(userId, {
				role: newRole
			});

			return { success: true, message: 'Role updated successfully' };
		} catch (error) {
			return fail(500, { error: 'Failed to update role' });
		}
	},

	removeTeamMember: async ({ request, locals, url }) => {
		const restaurantId =
			((await request.formData()).get('restaurantId') as string) ||
			url.searchParams.get('restaurantId') ||
			locals.restaurant?.id;

		if (!restaurantId) {
			return fail(400, { error: 'No restaurant selected' });
		}

		const userRole = locals.user?.role || 'manager';
		const isOwner = userRole === 'owner';

		if (!isOwner) {
			return fail(403, { error: 'Only owners can remove team members' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'Missing user ID' });
		}

		if (userId === locals.user?.id) {
			return fail(400, { error: 'You cannot remove yourself' });
		}

		try {
			const user = await locals.pb.collection('users').getOne(userId);
			const adminRestaurantIds = user.adminRestaurantIds || [];
			const restaurantIds = user.restaurantIds || [];

			const newAdminRestaurantIds = adminRestaurantIds.filter((id: string) => id !== restaurantId);
			const newRestaurantIds = restaurantIds.filter((id: string) => id !== restaurantId);

			await locals.pb.collection('users').update(userId, {
				adminRestaurantIds: newAdminRestaurantIds,
				restaurantIds: newRestaurantIds
			});

			return { success: true, message: 'Team member removed successfully' };
		} catch (error) {
			return fail(500, { error: 'Failed to remove team member' });
		}
	},

	createRestaurant: async ({ request, locals, url }) => {
		const formData = await request.formData();

		// Check if user is super admin by checking if they have access to a super restaurant
		const allRestaurantsForSuperCheck = await locals.pb.collection('restaurants').getFullList();
		const userAdminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const userRestaurantIdsList = locals.user?.restaurantIds || [];
		const allUserRestaurantIds = [
			...new Set([...userAdminRestaurantIds, ...userRestaurantIdsList])
		];

		const isSuperUser = allUserRestaurantIds.some((id: string) => {
			const rest = allRestaurantsForSuperCheck.find((r: any) => r.id === id);
			return rest?.isSuper === true;
		});

		console.log('isSuperUser for create:', {
			userAdminRestaurantIds,
			allUserRestaurantIds,
			isSuperUser
		});

		if (!isSuperUser) {
			return fail(403, { error: 'Only super admins can create restaurants' });
		}

		const name = formData.get('name') as string;
		const domain = formData.get('domain') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const motto = formData.get('motto') as string;
		const category = formData.get('category') as string;
		const email = formData.get('email') as string;
		const phone = formData.get('phone') as string;
		const state = formData.get('state') as string;
		const localGovernment = formData.get('localGovernment') as string;
		const address = formData.get('address') as string;
		const openingTime = formData.get('openingTime') as string;
		const closingTime = formData.get('closingTime') as string;
		const serviceFee = formData.get('serviceFee') as string;
		const deliveryFeePerKm = formData.get('deliveryFeePerKm') as string;
		const maxDeliveryRadius = formData.get('maxDeliveryRadius') as string;
		const isSuperValue = formData.get('isSuper') as string;

		if (!name || !domain) {
			return fail(400, { error: 'Restaurant name and domain are required' });
		}

		try {
			console.log('Creating restaurant with data:', {
				name,
				domain,
				category,
				state,
				localGovernment,
				phone,
				address
			});

			// Check if domain already exists
			try {
				const existing = await locals.pb
					.collection('restaurants')
					.getFirstListItem(`domain = "${domain}"`);
				if (existing) {
					return fail(400, { error: 'A restaurant with this domain already exists' });
				}
			} catch (e) {
				// Domain doesn't exist, continue
			}

			// Create restaurant with all fields
			const newRestaurant = await locals.pb.collection('restaurants').create({
				name: name,
				domain: domain,
				slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
				description: description || '',
				motto: motto || '',
				category: category || '',
				email: email || '',
				phone: phone || '',
				state: state || '',
				localGovernment: localGovernment || '',
				restaurantAddress: address || '',
				address: address || '',
				openingTime: openingTime || '09:00',
				closingTime: closingTime || '22:00',
				serviceFee: serviceFee ? parseFloat(serviceFee) : 0,
				deliveryFeePerKm: deliveryFeePerKm ? parseFloat(deliveryFeePerKm) : 0,
				maxDeliveryRadius: maxDeliveryRadius ? parseInt(maxDeliveryRadius) : 10,
				isSuper: isSuperValue === 'on' || isSuperValue === 'true',
				orderServices: {
					tableService: true,
					pickup: true,
					homeDelivery: true
				}
			});

			// Add the new restaurant to the current user's adminRestaurantIds
			const currentUser = locals.user;
			if (currentUser) {
				const currentAdminIds = currentUser.adminRestaurantIds || [];
				const currentRestaurantIds = currentUser.restaurantIds || [];

				await locals.pb.collection('users').update(currentUser.id, {
					adminRestaurantIds: [...currentAdminIds, newRestaurant.id],
					restaurantIds: [...currentRestaurantIds, newRestaurant.id]
				});

				// Refresh auth to get updated user record
				await locals.pb.collection('users').authRefresh();
			}

			console.log('Restaurant created successfully:', newRestaurant.id);

			return {
				success: true,
				message: 'Restaurant created successfully',
				restaurantId: newRestaurant.id
			};
		} catch (error: any) {
			console.error('Failed to create restaurant - full error:', JSON.stringify(error, null, 2));
			let errorMsg = 'Failed to create restaurant';
			if (error?.data) {
				errorMsg = JSON.stringify(error.data);
			} else if (error?.message) {
				errorMsg = error.message;
			}
			return fail(500, { error: errorMsg });
		}
	},

	updateInquiryStatus: async ({ request, locals, url }) => {
		const formData = await request.formData();

		const isSuper = locals.user?.isSuper || locals.isSuper || false;
		if (!isSuper) {
			return fail(403, { error: 'Only super admins can update inquiries' });
		}

		const inquiryId = formData.get('inquiryId') as string;
		const status = formData.get('status') as string;

		if (!inquiryId || !status) {
			return fail(400, { error: 'Inquiry ID and status are required' });
		}

		try {
			await locals.pb.collection('setupInquiries').update(inquiryId, {
				status
			});

			return { success: true, message: 'Inquiry status updated' };
		} catch (error) {
			return fail(500, { error: 'Failed to update inquiry status' });
		}
	}
};
