import type { PageServerLoad } from '../$types';
import { isSuperRestaurant, hasRestaurantAccess } from '$lib/utils/restaurantAccess';

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	try {
		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);
		const restaurantId = restaurant.id;
		const isSuper = isSuperRestaurant(restaurant);

		// Build restaurant filter - super restaurants see all, otherwise just their restaurant
		const restaurantFilter = isSuper ? '' : `restaurantId = "${restaurantId}" && `;

		// Get today's date range
		const today = new Date();
		const startOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate()
		).toISOString();
		const endOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate() + 1
		).toISOString();

		// Fetch today's revenue (Delivered orders)
		const todayOrders = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}status = "Delivered" && created >= "${startOfDay}" && created < "${endOfDay}"`
		});

		const todayRevenue = todayOrders.reduce(
			(sum: number, order: any) => sum + (order.orderTotal || order.totalAmount || 0),
			0
		);

		// Fetch pending orders count
		const pendingOrders = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}(status = "Pending" || status = "Preparing" || status = "Ready")`
		});
		const pendingOrdersCount = pendingOrders.length;

		// Fetch completed orders (all time delivered)
		const completedOrders = await locals.pb.collection('orders').getFullList({
			filter: `${restaurantFilter}status = "Delivered"`
		});
		const completedOrdersCount = completedOrders.length;

		return {
			restaurant,
			restaurantId,
			isSuper,
			stats: {
				todayRevenue,
				pendingOrdersCount,
				completedOrdersCount
			}
		};
	} catch (error) {
		console.error('Error loading restaurant or stats:', error);
		return {
			dishes: [],
			stats: {
				todayRevenue: 0,
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
