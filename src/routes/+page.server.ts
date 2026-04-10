import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isSuperRestaurant, buildRestaurantFilter } from '$lib/utils/restaurantAccess';
import { canPublicAccessRestaurant, resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const load: PageServerLoad = async ({ locals, url, request }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const searchType = url.searchParams.get('type')?.trim() ?? 'restaurant';
	const selectedRestaurantId = url.searchParams.get('restaurant')?.trim() ?? '';

	try {
		const host = request.headers.get('host') || '';
		const currentRestaurant = await resolveRestaurantByDomain(locals.pb, host, {
			allowSuperFallback: false
		});

		// If no restaurant found for this domain, show not found
		if (!currentRestaurant) {
			throw redirect(307, '/not-found');
		}

		const isSuper = isSuperRestaurant(currentRestaurant);

		// For non-super restaurants, redirect to their dedicated store page
		// This prevents flash of content by doing the redirect server-side
		if (!isSuper) {
			throw redirect(307, `/stores/${currentRestaurant.id}`);
		}

		// Fetch restaurants - only what's needed
		let allRestaurants: any[] = [];
		if (isSuper) {
			// Use getList with pagination for super restaurants
			const result = await locals.pb.collection('restaurants').getList(1, 50, {
				sort: '-created',
				filter: 'name != "ProxifeastLocal"'
			});
			allRestaurants = result.items;
		} else if (currentRestaurant) {
			// Non-super restaurants only see themselves
			allRestaurants = [currentRestaurant];
		}

		// Determine which restaurant to filter featured dishes by
		// If selectedRestaurantId is in URL, use that; otherwise use currentRestaurant
		let featuredRestaurant = currentRestaurant;
		if (selectedRestaurantId && currentRestaurant) {
			// If there's a selected restaurant in URL, fetch it and use for featured dishes
			try {
				if (canPublicAccessRestaurant(currentRestaurant, selectedRestaurantId)) {
					featuredRestaurant = await locals.pb
						.collection('restaurants')
						.getOne(selectedRestaurantId);
				}
			} catch {
				// Keep using currentRestaurant if not found
			}
		}

		// Fetch featured dishes - use pagination
		const featuredFilter = buildRestaurantFilter(
			featuredRestaurant,
			'isFeatured = true && availability = "Available"',
			'restaurantId'
		);

		const featuredResult = await locals.pb.collection('dishes').getList(1, 20, {
			filter: featuredFilter,
			sort: '-created',
			expand: 'restaurant'
		});

		// Filter out Proxifeastt and ProxifeastLocal after fetching
		const featuredDishes = featuredResult.items.filter((dish: any) => {
			const restaurantName = dish.expand?.restaurant?.name;
			return restaurantName !== 'Proxifeastt' && restaurantName !== 'ProxifeastLocal';
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
						r.name?.toLowerCase().includes(query) ||
						r.restaurantAddress?.toLowerCase().includes(query)
				);
			} else if (searchType === 'dish') {
				// Search dishes with pagination
				const dishResult = await locals.pb.collection('dishes').getList(1, 50, {
					filter: `(name ~ "${search}" || description ~ "${search}") && availability = "Available"`,
					fields: 'restaurantId'
				});
				const restaurantIds = [...new Set(dishResult.items.map((d: any) => d.restaurantId))];
				filteredRestaurants = allRestaurants.filter((r: any) => restaurantIds.includes(r.id));
			}
		}

		// Handle restaurant selection
		if (selectedRestaurantId) {
			selectedRestaurant = allRestaurants.find((r: any) => r.id === selectedRestaurantId) || null;

			if (selectedRestaurant) {
				// Fetch dishes for selected restaurant with pagination
				const categoryFilter = url.searchParams.get('category')?.trim() ?? 'All';
				let filter = `restaurantId = "${selectedRestaurantId}"`;

				if (categoryFilter && categoryFilter !== 'All') {
					filter += ` && category = "${categoryFilter}"`;
				}

				const dishesResult = await locals.pb.collection('dishes').getList(1, 100, {
					sort: '-created',
					filter
				});
				dishes = dishesResult.items;

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
			selectedRestaurantId,
			isSuper,
			currentRestaurant
		};
	} catch (error: any) {
		// Re-throw redirects so SvelteKit can handle them properly
		if (error?.status === 307 || error?.status === 308 || error?.location) {
			throw error;
		}
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
			error: 'Failed to load data',
			isSuper: false,
			currentRestaurant: null
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
