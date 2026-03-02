import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

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

	// Get all accessible restaurant IDs
	const allAccessibleIds = [...new Set([...adminRestaurantIds, ...userRestaurantIds])];

	// Try URL param first, then fallback to first accessible restaurant
	let restaurantId = url.searchParams.get('restaurantId') || allAccessibleIds[0];

	if (!restaurantId) {
		console.log('No restaurant ID found. User data:', { adminRestaurantIds, userRestaurantIds });
		return { restaurant: null, orderServices: null, teamMembers: [], restaurants: [] };
	}

	// Verify user has access to the requested restaurant
	if (!allAccessibleIds.includes(restaurantId)) {
		console.log('User does not have access to restaurant:', restaurantId);
		return { restaurant: null, orderServices: null, teamMembers: [], restaurants: [] };
	}

	try {
		console.log('Loading restaurant:', restaurantId);
		const restaurant = await locals.pb.collection('restaurants').getOne(restaurantId);

		console.log('Restaurant fields:', Object.keys(restaurant));

		const orderServices = restaurant.orderServices || {
			tableService: true,
			pickup: true,
			homeDelivery: true
		};

		// Fetch team members for this restaurant
		const teamMembers = await locals.pb.collection('users').getFullList({
			filter: `adminRestaurantIds ?~ "${restaurantId}" || restaurantIds ?~ "${restaurantId}"`,
			sort: 'name'
		});

		// Fetch all accessible restaurants for the dropdown
		let restaurants: any[] = [];
		if (allAccessibleIds.length > 0) {
			const filterParts = allAccessibleIds.map((id) => `id = "${id}"`);
			restaurants = await locals.pb.collection('restaurants').getFullList({
				filter: filterParts.join(' || ')
			});
		}

		const isSuper = locals.user?.isSuper || locals.isSuper || false;

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
				isActive: member.isActive !== false
			})),
			isSuper
		};
	} catch (error) {
		console.error('Error loading settings:', error);
		return { restaurant: null, orderServices: null, teamMembers: [], restaurants: [] };
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
		if (logoUrl) updateData.logoUrl = logoUrl;
		if (bannerUrl) updateData.bannerUrl = bannerUrl;

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
	}
};
