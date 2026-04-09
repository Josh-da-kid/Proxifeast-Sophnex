import { json, type RequestHandler } from '@sveltejs/kit';
import { isSuperRestaurant } from '$lib/utils/restaurantAccess';
import { resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

// GET /api/favorites/dishes - Get dish favorites for the current restaurant context
export const GET: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Get current restaurant from domain
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	const currentRestaurant = await resolveRestaurantByDomain(
		locals.pb,
		request.headers.get('host') || '',
		{
			allowSuperFallback: true
		}
	);

	// Only super restaurants can have dish favorites
	if (!currentRestaurant || !isSuperRestaurant(currentRestaurant)) {
		return json({ dishFavorites: [] }, { status: 200 });
	}

	// Get dish favorites for the current restaurant context
	const dishFavorites = locals.user.dishFavorites || {};
	const restaurantDishFavorites = dishFavorites[currentRestaurant.id] || [];

	return json({ dishFavorites: restaurantDishFavorites });
};

// POST /api/favorites/dishes - Add/remove dish from favorites
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { dishId, action } = await request.json();

	if (!dishId || !action || (action !== 'add' && action !== 'remove')) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	// Get current restaurant from domain
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	const currentRestaurant = await resolveRestaurantByDomain(
		locals.pb,
		request.headers.get('host') || '',
		{
			allowSuperFallback: true
		}
	);

	// Only super restaurants can favorite dishes
	if (!currentRestaurant || !isSuperRestaurant(currentRestaurant)) {
		return json(
			{ error: 'Forbidden: Only super restaurants can favorite dishes' },
			{ status: 403 }
		);
	}

	// Get current dish favorites
	const userId = locals.user.id;
	let dishFavorites = locals.user.dishFavorites || {};
	const dish = await locals.pb.collection('dishes').getOne(dishId);
	if (dish.restaurantId !== currentRestaurant.id) {
		return json({ error: 'Dish does not belong to this restaurant' }, { status: 403 });
	}

	// Get favorites for current restaurant
	const restaurantId = currentRestaurant.id;
	let restaurantDishFavorites = dishFavorites[restaurantId] || [];

	// Update favorites
	if (action === 'add') {
		if (!restaurantDishFavorites.includes(dishId)) {
			restaurantDishFavorites = [...restaurantDishFavorites, dishId];
		}
	} else if (action === 'remove') {
		restaurantDishFavorites = restaurantDishFavorites.filter((id: string) => id !== dishId);
	}

	// Update the dishFavorites object
	dishFavorites[restaurantId] = restaurantDishFavorites;

	// Save to user record
	try {
		await locals.pb.collection('users').update(userId, { dishFavorites });
		return json({ success: true, dishFavorites: restaurantDishFavorites });
	} catch (err) {
		console.error('Failed to update dish favorites:', err);
		return json({ error: 'Failed to update favorites' }, { status: 500 });
	}
};
