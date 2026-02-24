import type { PageServerLoad } from '../$types';
import { isSuperRestaurant, hasRestaurantAccess } from '$lib/utils/restaurantAccess';

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0].replace('www.', '').toLowerCase();

	try {
		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);
		const restaurantId = restaurant.id;
		const isSuper = isSuperRestaurant(restaurant);

		// Build restaurant filter - always filter by current restaurant (based on domain)
		// Even super admins should only see orders for the restaurant they're currently managing
		const restaurantFilter = `restaurantId = "${restaurantId}" && `;

		console.log('Admin Dashboard - Restaurant ID:', restaurantId, 'Domain:', domain);
		console.log('Admin Dashboard - Filter:', restaurantFilter);

		// Get today's date range - use PocketBase date format for local timezone
		const now = new Date();
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
		const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

		console.log('Date range:', {
			startOfDay: startOfDay.toISOString(),
			endOfDay: endOfDay.toISOString(),
			localStart: startOfDay.toString(),
			localEnd: endOfDay.toString()
		});

		// Fetch today's revenue - completed orders for today
		const todayOrdersResult = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}status = "Delivered" && created >= "${startOfDay.toISOString()}" && created < "${endOfDay.toISOString()}"`
		});

		console.log(
			'Today orders (Delivered):',
			todayOrdersResult.length,
			todayOrdersResult.map((o: any) => ({
				id: o.id,
				restaurantId: o.restaurantId,
				status: o.status,
				totalAmount: o.totalAmount
			}))
		);

		const todayOrders = todayOrdersResult;

		const todayRevenue = todayOrders.reduce(
			(sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0),
			0
		);

		console.log('Today Revenue:', todayRevenue);

		// Fetch pending orders for potential revenue (all pending orders, not just today's)
		const pendingOrdersResult = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}(status = "Pending" || status = "Preparing" || status = "Ready")`
		});

		console.log(
			'Pending orders:',
			pendingOrdersResult.length,
			pendingOrdersResult.map((o: any) => ({
				id: o.id,
				restaurantId: o.restaurantId,
				status: o.status
			}))
		);

		const pendingRevenue = pendingOrdersResult.reduce(
			(sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0),
			0
		);

		// Fetch pending orders with pagination
		const pendingResult = await locals.pb.collection('orders').getList(1, 50, {
			filter: `${restaurantFilter}(status = "Pending" || status = "Preparing" || status = "Ready")`
		});
		const pendingOrdersCount = pendingResult.totalItems;

		// Fetch completed orders with pagination
		const completedResult = await locals.pb.collection('orders').getList(1, 100, {
			filter: `${restaurantFilter}status = "Delivered"`
		});
		const completedOrdersCount = completedResult.totalItems;

		// Get subscription stats for super restaurants
		let subscriptionStats = null;
		if (isSuper) {
			try {
				const subsResult = await locals.pb.collection('subscriptions').getList(1, 100);
				const subscriptions = subsResult.items;

				const now = new Date();
				const thirtyDaysFromNow = new Date();
				thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

				const activeCount = subscriptions.filter((s: any) => s.status === 'active').length;
				const expiringSoonCount = subscriptions.filter((s: any) => {
					const endDate = new Date(s.endDate);
					return s.status === 'active' && endDate <= thirtyDaysFromNow && endDate > now;
				}).length;

				const totalRevenue = subscriptions
					.filter((s: any) => s.status === 'active')
					.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

				subscriptionStats = {
					totalRestaurants: subscriptions.length,
					activeCount,
					expiringSoonCount,
					totalRevenue
				};
			} catch (err) {
				console.error('Error loading subscription stats:', err);
			}
		}

		return {
			restaurant,
			restaurantId,
			isSuper,
			stats: {
				todayRevenue,
				pendingRevenue,
				pendingOrdersCount,
				completedOrdersCount
			},
			subscriptionStats
		};
	} catch (error) {
		console.error('Error loading restaurant or stats:', error);
		return {
			dishes: [],
			stats: {
				todayRevenue: 0,
				pendingRevenue: 0,
				pendingOrdersCount: 0,
				completedOrdersCount: 0
			},
			error: 'Restaurant not found or failed to load data'
		};
	}
};

export const actions = {
	createDish: async ({ locals, request }) => {
		const formData = await request.formData();

		let imageUrl = '';
		const imageSource = formData.get('imageSource'); // 'file' or 'url'

		if (imageSource === 'file') {
			const file = formData.get('imageFile');

			if (file instanceof File && file.size > 0) {
				try {
					const uploadForm = new FormData();
					uploadForm.append('imageFile', file);

					const uploaded = await locals.pb.collection('uploads').create(uploadForm);
					imageUrl = locals.pb.files.getURL(uploaded, uploaded.imageFile);
				} catch (uploadErr) {
					console.error('Error uploading image:', uploadErr);
					return {
						success: false,
						error: 'Failed to upload image file.'
					};
				}
			}
		} else if (imageSource === 'url') {
			const inputUrl = formData.get('imageUrl');
			if (inputUrl && typeof inputUrl === 'string' && inputUrl.trim() !== '') {
				imageUrl = inputUrl;
			}
		}

		// Set default image if none provided
		if (!imageUrl) {
			imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
		}

		// Get restaurantId from form selection
		let restaurantIdFromForm = formData.get('restaurantId') as string;

		// Get current restaurant from domain to validate access
		const host = request.headers.get('host') || '';
		const domain = host.split(':')[0];
		const currentRestaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);
		const isSuper = isSuperRestaurant(currentRestaurant);

		// For non-super restaurants, override the restaurantId to their own
		if (!isSuper) {
			restaurantIdFromForm = currentRestaurant.id;
		}

		// Validate restaurant access for super restaurants
		if (isSuper && !hasRestaurantAccess(currentRestaurant, restaurantIdFromForm)) {
			return {
				success: false,
				error: 'You do not have permission to create dishes for this restaurant.'
			};
		}

		// Validate required fields
		if (
			!formData.get('name') ||
			!formData.get('description') ||
			!formData.get('category') ||
			!formData.get('availability') ||
			!restaurantIdFromForm
		) {
			return {
				success: false,
				error: 'Please fill in all required fields.'
			};
		}

		try {
			const defaultAmount = parseInt(formData.get('defaultAmount') as string);
			const promoAmount = formData.get('promoAmount')
				? parseInt(formData.get('promoAmount') as string)
				: null;

			const record = await locals.pb.collection('dishes').create({
				name: formData.get('name'),
				description: formData.get('description'),
				category: formData.get('category'),
				image: imageUrl,
				imageSource: imageSource,
				quantity: parseInt(formData.get('quantity') as string) || 1,
				availability: formData.get('availability'),
				defaultAmount: defaultAmount,
				promoAmount: promoAmount && !isNaN(promoAmount) ? promoAmount : null,
				restaurantId: restaurantIdFromForm
			});

			return {
				success: true,
				record
			};
		} catch (error) {
			console.error('PocketBase Error:', error);
			return {
				success: false,
				error: 'Failed to create dish.'
			};
		}
	}
};
