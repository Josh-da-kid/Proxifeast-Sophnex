import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { restaurant: null, orderServices: null, teamMembers: [] };
	}

	const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
	const restaurantIds = locals.user?.restaurantIds || [];
	const restaurantId = adminRestaurantIds[0] || restaurantIds[0];

	if (!restaurantId) {
		return { restaurant: null, orderServices: null, teamMembers: [] };
	}

	const userRole = locals.user?.role || 'manager';
	const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

	if (!isManagerOrOwner) {
		return { restaurant: null, orderServices: null, teamMembers: [] };
	}

	try {
		const restaurant = await locals.pb.collection('restaurants').getOne(restaurantId);
		const orderServices = restaurant.orderServices || {
			tableService: true,
			pickup: true,
			homeDelivery: true
		};

		console.log('Fetching team members for restaurant:', restaurantId);

		const teamMembers = await locals.pb.collection('users').getFullList({
			filter: `adminRestaurantIds.id ?~ "${restaurantId}" || restaurantIds.id ?~ "${restaurantId}" || adminRestaurantIds ?~ "${restaurantId}" || restaurantIds ?~ "${restaurantId}"`,
			sort: 'name'
		});

		console.log('Found team members:', teamMembers.length, teamMembers.map((m: any) => ({ name: m.name, email: m.email, restaurantIds: m.restaurantIds, adminRestaurantIds: m.adminRestaurantIds })));

		return {
			restaurant,
			orderServices,
			restaurantId,
			teamMembers: teamMembers.map((member: any) => ({
				id: member.id,
				name: member.name,
				email: member.email,
				role: member.role || 'manager',
				isActive: member.isActive !== false
			}))
		};
	} catch (error) {
		return { restaurant: null, orderServices: null, teamMembers: [] };
	}
};

export const actions: Actions = {
	updateOrderServices: async ({ request, locals }) => {
		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const restaurantIds = locals.user?.restaurantIds || [];
		const restaurantId = adminRestaurantIds[0] || restaurantIds[0];

		if (!restaurantId) {
			return fail(400, { error: 'No restaurant selected' });
		}

		const userRole = locals.user?.role || 'manager';
		const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

		if (!isManagerOrOwner) {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
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

	updateRestaurantInfo: async ({ request, locals }) => {
		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const restaurantIds = locals.user?.restaurantIds || [];
		const restaurantId = adminRestaurantIds[0] || restaurantIds[0];

		if (!restaurantId) {
			return fail(400, { error: 'No restaurant selected' });
		}

		const userRole = locals.user?.role || 'manager';
		const isManagerOrOwner = userRole === 'owner' || userRole === 'manager';

		if (!isManagerOrOwner) {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const domain = formData.get('domain') as string;
		const openingTime = formData.get('openingTime') as string;
		const closingTime = formData.get('closingTime') as string;
		const address = formData.get('address') as string;
		const phone = formData.get('phone') as string;

		const updateData: Record<string, any> = {};
		if (name) updateData.name = name;
		if (domain) updateData.domain = domain;
		if (openingTime) updateData.openingTime = openingTime;
		if (closingTime) updateData.closingTime = closingTime;
		if (address) updateData.address = address;
		if (phone) updateData.phone = phone;

		try {
			await locals.pb.collection('restaurants').update(restaurantId, updateData);

			return { success: true, message: 'Restaurant information saved successfully' };
		} catch (error) {
			return fail(500, { error: 'Failed to save restaurant information' });
		}
	},

	updateUserRole: async ({ request, locals }) => {
		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const restaurantIds = locals.user?.restaurantIds || [];
		const restaurantId = adminRestaurantIds[0] || restaurantIds[0];

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

	removeTeamMember: async ({ request, locals }) => {
		const adminRestaurantIds = locals.user?.adminRestaurantIds || [];
		const restaurantIds = locals.user?.restaurantIds || [];
		const restaurantId = adminRestaurantIds[0] || restaurantIds[0];

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
