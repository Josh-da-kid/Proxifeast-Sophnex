import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	try {
		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);
		const restaurantId = restaurant.id;

		// Check if user is admin - if so, show stats for ALL restaurants
		const isAdmin = locals.user?.isAdmin === true;

		// Build restaurant filter - admin sees all, otherwise just their restaurant
		const restaurantFilter = isAdmin ? '' : `restaurantId = "${restaurantId}" && `;

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
			if (inputUrl && typeof inputUrl === 'string') {
				imageUrl = inputUrl;
			}
		}

		const host = request.headers.get('host') || '';
		const domain = host.split(':')[0];

		const restaurant = await locals.pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${domain}"`);

		const restaurantId = restaurant.id;

		if (!restaurantId || typeof restaurantId !== 'string') {
			return {
				success: false,
				error: 'restaurantId is required.'
			};
		}

		try {
			const record = await locals.pb.collection('dishes').create({
				name: formData.get('name'),
				description: formData.get('description'),
				category: formData.get('category'),
				image: imageUrl,
				imageSource: imageSource,
				quantity: parseInt(formData.get('quantity')),
				availability: formData.get('availability'),
				defaultAmount: parseInt(formData.get('defaultAmount')),
				promoAmount: formData.get('promoAmount') ? parseInt(formData.get('promoAmount')) : null,
				restaurantId // <-- this links the dish to a restaurant
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
