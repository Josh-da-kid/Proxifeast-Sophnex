import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const searchType = url.searchParams.get('type')?.trim() ?? 'restaurant';
	const selectedRestaurantId = url.searchParams.get('restaurant')?.trim() ?? '';

	try {
		// Fetch all restaurants (excluding ProxifeastLocal)
		const allRestaurants = await locals.pb.collection('restaurants').getFullList({
			sort: 'name',
			filter: 'name != "ProxifeastLocal"'
		});

		// Fetch all featured dishes with restaurant info for "Today's Special"
		const featuredDishes = await locals.pb.collection('dishes').getFullList({
			filter: 'isFeatured = true && availability = "Available"',
			sort: '-created',
			expand: 'restaurantId'
		});

		let filteredRestaurants = allRestaurants;
		let selectedRestaurant = null;
		let dishes: any[] = [];
		let categories: string[] = [];

		// Handle search
		if (search) {
			if (searchType === 'restaurant') {
				// Search restaurants by name or address
				const query = search.toLowerCase();
				filteredRestaurants = allRestaurants.filter(
					(r: any) =>
						r.name.toLowerCase().includes(query) ||
						r.restaurantAddress?.toLowerCase().includes(query)
				);
			} else if (searchType === 'dish') {
				// Search dishes and find restaurants that serve them
				const matchingDishes = await locals.pb.collection('dishes').getFullList({
					filter: `(name ~ "${search}" || description ~ "${search}") && availability = "Available"`,
					fields: 'restaurantId'
				});
				const restaurantIds = [...new Set(matchingDishes.map((d: any) => d.restaurantId))];
				filteredRestaurants = allRestaurants.filter((r: any) => restaurantIds.includes(r.id));
			}
		}

		// Handle restaurant selection
		if (selectedRestaurantId) {
			selectedRestaurant = allRestaurants.find((r: any) => r.id === selectedRestaurantId) || null;

			if (selectedRestaurant) {
				// Fetch dishes for selected restaurant
				const categoryFilter = url.searchParams.get('category')?.trim() ?? 'All';
				let filter = `restaurantId = "${selectedRestaurantId}"`;

				if (categoryFilter && categoryFilter !== 'All') {
					filter += ` && category = "${categoryFilter}"`;
				}

				dishes = await locals.pb.collection('dishes').getFullList({
					sort: '-created',
					filter
				});

				const categorySet = new Set(dishes.map((dish: any) => dish.category).filter(Boolean));
				categories = Array.from(categorySet).sort();
			}
		}

		return {
			restaurants: filteredRestaurants,
			allRestaurants,
			featuredDishes,
			selectedRestaurant,
			dishes,
			categories,
			searchQuery: search,
			searchType,
			selectedRestaurantId
		};
	} catch (error) {
		console.error('Error loading data:', error);
		return {
			restaurants: [],
			allRestaurants: [],
			featuredDishes: [],
			selectedRestaurant: null,
			dishes: [],
			categories: [],
			searchQuery: search,
			searchType,
			selectedRestaurantId: '',
			error: 'Failed to load data'
		};
	}
};

export const actions = {
	createDish: async ({ locals, request }: { locals: any; request: Request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries([...formData]);
	},

	addToCart: async ({ request, locals }: { request: Request; locals: any }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData.entries());

		if (!data.restaurantId) {
			return { success: false, error: 'Missing restaurant ID' };
		}

		try {
			const add = await locals.pb.collection('cart').create({
				name: data.name,
				description: data.description,
				category: data.category,
				image: data.image,
				quantity: parseInt(data.quantity as string),
				defaultAmount: parseInt(data.defaultAmount as string),
				promoAmount: data.promoAmount ? parseInt(data.promoAmount as string) : null,
				user: locals.user.id,
				dish: data.dish,
				restaurant: data.restaurantId,
				restaurantId: data.restaurantId,
				restaurantName: data.restaurantName || 'Unknown Restaurant'
			});

			return { success: true, add };
		} catch (err) {
			console.error(err);
			return { success: false, error: 'add to cart failed.' };
		}
	}
};
