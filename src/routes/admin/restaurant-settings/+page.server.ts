import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { canAdminAccessRestaurant, isSuperadmin } from '$lib/server/restaurantAccess';

async function assertRestaurantAccess(locals: App.Locals, restaurantId: string) {
	return canAdminAccessRestaurant(locals.pb, locals.user, restaurantId);
}

function hasSuperStoreContext(locals: App.Locals) {
	return locals.restaurant?.isSuper === true || locals.restaurant?.isSuper === 'true';
}

export const load: PageServerLoad = async ({ locals, url }) => {
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
	const allAccessibleIds = [...new Set([...adminRestaurantIds, ...userRestaurantIds])];

	const isSuperRestaurant = (r: any) => r?.isSuper === true || r?.isSuper === 'true';

	// Try URL param first
	let restaurantId = url.searchParams.get('restaurantId');
	let restaurant: any = null;

	// Fetch user's accessible restaurants
	let userAccessibleRestaurants: any[] = [];
	if (allAccessibleIds.length > 0) {
		userAccessibleRestaurants = await locals.pb.collection('restaurants').getFullList({
			filter: allAccessibleIds.map((id) => `id = "${id}"`).join(' || ')
		});
	}

	// If we have a restaurantId from URL, verify it's accessible
	if (restaurantId) {
		restaurant = userAccessibleRestaurants.find((r: any) => r.id === restaurantId);
		if (!restaurant) {
			restaurantId = null;
		}
	}

	// Use domain matching on user's accessible restaurants
	const domainOnly = (url.hostname || '').replace('www.', '').toLowerCase().trim();

	if (!restaurantId && userAccessibleRestaurants.length > 0) {
		// Try exact domain match first
		restaurant = userAccessibleRestaurants.find((r: any) => {
			const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
			return rDomain === domainOnly;
		});

		// Try partial match
		if (!restaurant) {
			restaurant = userAccessibleRestaurants.find((r: any) => {
				const rDomain = (r.domain || '').replace('www.', '').toLowerCase().trim();
				return domainOnly.includes(rDomain) || rDomain.includes(domainOnly);
			});
		}

		if (restaurant) {
			restaurantId = restaurant.id;
			console.log('Matched restaurant by domain:', restaurant.name, domainOnly);
		}
	}

	// If still no restaurant, prioritize non-super from user's accessible list
	if (!restaurantId && userAccessibleRestaurants.length > 0) {
		const nonSuper = userAccessibleRestaurants.filter((r: any) => !isSuperRestaurant(r));
		if (nonSuper.length > 0) {
			restaurant = nonSuper[0];
			restaurantId = restaurant.id;
		} else {
			restaurant = userAccessibleRestaurants[0];
			restaurantId = restaurant.id;
		}
		console.log('Selected restaurant (fallback):', restaurant?.name);
	}

	// Final validation
	if (!restaurantId || !allAccessibleIds.includes(restaurantId)) {
		console.log('No valid restaurant found.');
		return { restaurant: null, orderServices: null, teamMembers: [], restaurants: [] };
	}

	try {
		console.log('Loading restaurant:', restaurantId);
		restaurant = await locals.pb.collection('restaurants').getOne(restaurantId);
		console.log('Restaurant loaded:', restaurant?.name, 'isSuper:', restaurant?.isSuper);

		const orderServices = restaurant.orderServices || {
			tableService: true,
			pickup: true,
			homeDelivery: true
		};

		// KEY CHECK: Determine if current restaurant is super
		const isCurrentRestaurantSuper = isSuperRestaurant(restaurant);
		const shouldShowSuperData = isCurrentRestaurantSuper;
		console.log('shouldShowSuperData:', shouldShowSuperData);

		const allRestaurantsData = shouldShowSuperData
			? await locals.pb.collection('restaurants').getFullList({ sort: 'name' })
			: [restaurant];

		const allUsers = shouldShowSuperData
			? await locals.pb.collection('users').getFullList({ sort: 'name' })
			: await locals.pb.collection('users').getFullList({
					filter: `adminRestaurantIds ?~ "${restaurantId}"`,
					sort: 'name'
				});

		let setupInquiries: any[] = [];
		if (shouldShowSuperData) {
			try {
				setupInquiries = await locals.pb.collection('setupInquiries').getFullList({
					sort: '-created'
				});
			} catch (e) {
				console.log('No setup inquiries found');
			}
		}

		// Process team members based on whether CURRENT restaurant is super
		let teamMembers;
		let managedStores: any[] = [];
		let globalUsers: any[] = [];
		if (shouldShowSuperData) {
			managedStores = allRestaurantsData.map((r: any) => {
				const admins = allUsers.filter((u: any) => (u.adminRestaurantIds || []).includes(r.id));
				const members = allUsers.filter((u: any) => (u.restaurantIds || []).includes(r.id));
				return {
					id: r.id,
					name: r.name,
					email: r.email || '',
					domain: r.domain,
					isSuper: r.isSuper,
					type: r.type || 'restaurant',
					adminCount: admins.length,
					memberCount: members.length,
					role: 'restaurant',
					adminUsers: admins.map((a: any) => ({
						id: a.id,
						name: a.name,
						email: a.email,
						role: a.role
					}))
				};
			});

			globalUsers = allUsers.map((user: any) => {
				const adminIds = user.adminRestaurantIds || [];
				const memberIds = user.restaurantIds || [];
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role || 'manager',
					isActive: user.isActive !== false,
					isSuperUser: user.isSuper === true || user.isSuper === 'true',
					adminRestaurants: allRestaurantsData
						.filter((store: any) => adminIds.includes(store.id))
						.map((store: any) => ({ id: store.id, name: store.name })),
					memberRestaurants: allRestaurantsData
						.filter((store: any) => memberIds.includes(store.id))
						.map((store: any) => ({ id: store.id, name: store.name }))
				};
			});

			teamMembers = managedStores;

			console.log('Super stores loaded:', managedStores.length, 'users:', globalUsers.length);
		} else {
			// For regular restaurants, show users who are ADMINS of this specific restaurant
			teamMembers = allUsers.filter((m: any) => {
				const adminIds = m.adminRestaurantIds || [];
				return adminIds.includes(restaurantId);
			});

			teamMembers = teamMembers.map((member: any) => ({
				...member,
				adminRestaurants: [restaurant?.name]
			}));

			console.log('Admin users for restaurant', restaurantId, ':', teamMembers.length);
		}

		// Fetch all accessible restaurants for the dropdown
		let restaurants: any[] = [];
		if (shouldShowSuperData) {
			const currentRest = allRestaurantsData.find((r: any) => r.id === restaurantId);
			const otherRestaurants = allRestaurantsData.filter((r: any) => r.id !== restaurantId);
			restaurants = currentRest ? [currentRest, ...otherRestaurants] : allRestaurantsData;
		} else if (allAccessibleIds.length > 0) {
			restaurants = userAccessibleRestaurants;
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
			teamMembers: teamMembers.map((member: any) => {
				if (shouldShowSuperData) {
					// For super users, return restaurant data with admin users
					return {
						id: member.id,
						name: member.name,
						email: member.email,
						domain: member.domain,
						isSuper: member.isSuper,
						role: 'restaurant',
						isActive: true,
						adminUsers: member.adminUsers || []
					};
				} else {
					// For regular users, return user data
					return {
						id: member.id,
						name: member.name,
						email: member.email,
						role: member.role || 'manager',
						isActive: member.isActive !== false,
						adminRestaurants: member.adminRestaurants || []
					};
				}
			}),
			managedStores,
			globalUsers,
			isSuper: shouldShowSuperData,
			isAdminForRestaurant: true,
			setupInquiries
		};
	} catch (error: any) {
		console.error('Error loading settings:', error);
		const errorMessage = error?.message || error?.data?.message || 'Unknown error';
		console.error('Detailed error:', errorMessage);
		return {
			restaurant: null,
			isAdminForRestaurant: true,
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

		if (!isManagerOrOwner || !(await assertRestaurantAccess(locals, restaurantId))) {
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

	updateUserAdminAccess: async ({ request, locals }) => {
		if (!hasSuperStoreContext(locals) && !(await isSuperadmin(locals.pb, locals.user))) {
			return fail(403, { error: 'Only super admins can manage global user access' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const restaurantId = formData.get('restaurantId') as string;
		const mode = formData.get('mode') as string;

		if (!userId || !restaurantId || !mode) {
			return fail(400, { error: 'Missing required fields' });
		}

		if (userId === locals.user?.id && mode === 'remove') {
			return fail(400, { error: 'You cannot remove your own admin access' });
		}

		try {
			const user = await locals.pb.collection('users').getOne(userId);
			const restaurant = await locals.pb.collection('restaurants').getOne(restaurantId);

			const adminRestaurantIds = [...new Set([...(user.adminRestaurantIds || [])])];
			const restaurantIds = [...new Set([...(user.restaurantIds || [])])];

			if (mode === 'grant') {
				if (!adminRestaurantIds.includes(restaurantId)) adminRestaurantIds.push(restaurantId);
				if (!restaurantIds.includes(restaurantId)) restaurantIds.push(restaurantId);
			} else if (mode === 'remove') {
				if (restaurant.isSuper === true || restaurant.isSuper === 'true') {
					return fail(400, { error: 'Use the super user toggle to manage super-store access' });
				}

				const nextAdminIds = adminRestaurantIds.filter((id: string) => id !== restaurantId);
				const nextRestaurantIds = restaurantIds.filter((id: string) => id !== restaurantId);

				await locals.pb.collection('users').update(userId, {
					adminRestaurantIds: nextAdminIds,
					restaurantIds: nextRestaurantIds
				});

				return { success: true, message: 'Admin access removed successfully' };
			} else {
				return fail(400, { error: 'Invalid action requested' });
			}

			await locals.pb.collection('users').update(userId, {
				adminRestaurantIds,
				restaurantIds
			});

			return { success: true, message: 'Admin access updated successfully' };
		} catch (error) {
			return fail(500, { error: 'Failed to update admin access' });
		}
	},

	toggleSuperStore: async ({ request, locals }) => {
		if (!hasSuperStoreContext(locals) && !(await isSuperadmin(locals.pb, locals.user))) {
			return fail(403, { error: 'Only super admins can manage super stores' });
		}

		const formData = await request.formData();
		const restaurantId = formData.get('restaurantId') as string;
		const nextValue = formData.get('isSuper') === 'true';

		if (!restaurantId) {
			return fail(400, { error: 'Store is required' });
		}

		try {
			await locals.pb.collection('restaurants').update(restaurantId, {
				isSuper: nextValue
			});

			return {
				success: true,
				message: nextValue ? 'Store promoted to super store' : 'Store removed from super stores'
			};
		} catch (error) {
			return fail(500, { error: 'Failed to update store tier' });
		}
	},

	toggleSuperUser: async ({ request, locals }) => {
		if (!hasSuperStoreContext(locals) && !(await isSuperadmin(locals.pb, locals.user))) {
			return fail(403, { error: 'Only super admins can manage super users' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const nextValue = formData.get('isSuper') === 'true';

		if (!userId) {
			return fail(400, { error: 'User is required' });
		}

		if (userId === locals.user?.id && !nextValue) {
			return fail(400, { error: 'You cannot remove your own super access' });
		}

		try {
			await locals.pb.collection('users').update(userId, {
				isSuper: nextValue
			});

			return {
				success: true,
				message: nextValue ? 'User promoted to super admin' : 'Super admin access removed'
			};
		} catch (error) {
			return fail(500, { error: 'Failed to update super admin access' });
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

		if (!isManagerOrOwner || !(await assertRestaurantAccess(locals, restaurantId))) {
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

		// Handle image URLs - only update if it's a valid URL or empty (for removal)
		// If empty string, we'll set it to null to remove the image
		if (imageUrl !== undefined) {
			if (imageUrl === '' || imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
				updateData.imageUrl = imageUrl || null;
			}
		}
		if (logoUrl !== undefined) {
			if (logoUrl === '' || logoUrl.startsWith('http') || logoUrl.startsWith('/')) {
				updateData.logoUrl = logoUrl || null;
			}
		}
		if (bannerUrl !== undefined) {
			if (bannerUrl === '' || bannerUrl.startsWith('http') || bannerUrl.startsWith('/')) {
				updateData.bannerUrl = bannerUrl || null;
			}
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

		if (!isManagerOrOwner || !(await assertRestaurantAccess(locals, restaurantId))) {
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

		if (!isManagerOrOwner || !(await assertRestaurantAccess(locals, restaurantId))) {
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
			const targetUser = await locals.pb.collection('users').getOne(userId);
			const isAssignedToRestaurant = [
				...(targetUser.adminRestaurantIds || []),
				...(targetUser.restaurantIds || [])
			].includes(restaurantId);

			if (!isAssignedToRestaurant) {
				return fail(404, { error: 'User is not assigned to this store' });
			}

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

		if (!isOwner || !(await assertRestaurantAccess(locals, restaurantId))) {
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

		const isSuperUser =
			hasSuperStoreContext(locals) || (await isSuperadmin(locals.pb, locals.user));

		console.log('isSuperUser for create:', {
			userAdminRestaurantIds,
			allUserRestaurantIds,
			isSuperUser
		});

		if (!isSuperUser) {
			return fail(403, { error: 'Only super admins can create restaurants' });
		}

		const name = formData.get('name') as string;
		const type = formData.get('type') as string;
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
		const hasReservationValue = formData.get('hasReservation') as string;
		const hasRoomServiceValue = formData.get('hasRoomService') as string;

		if (!name || !domain) {
			return fail(400, { error: 'Store name and domain are required' });
		}

		try {
			console.log('Creating store with data:', {
				name,
				type,
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
					return fail(400, { error: 'A store with this domain already exists' });
				}
			} catch (e) {
				// Domain doesn't exist, continue
			}

			// Create restaurant with all fields
			const newRestaurant = await locals.pb.collection('restaurants').create({
				name: name,
				type: type || 'restaurant',
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
				features: {
					hasMenu: true,
					hasReservation: hasReservationValue === 'true',
					hasRoomService: hasRoomServiceValue === 'true',
					hasBar: type === 'bar',
					hasCafeService: type === 'cafe'
				},
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

		const isSuper = hasSuperStoreContext(locals) || (await isSuperadmin(locals.pb, locals.user));
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
