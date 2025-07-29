export const actions = {
	
	createDish: async ({ locals, request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries([...formData]);
  
    },
	
	addToCart: async ({ request, locals }) => {
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
			quantity: parseInt(data.quantity),
			defaultAmount: parseInt(data.defaultAmount),
			promoAmount: data.promoAmount ? parseInt(data.promoAmount) : null,
			user: locals.user.id,
			dish: data.dish, // relation to dish
			restaurant: data.restaurantId // ✅ restaurant reference
		});

		return { success: true, add };
	} catch (err) {
		console.error(err);
		return { success: false, error: 'add to cart failed.' };
	}
}


}

import type { PageServerLoad } from './$types';



export const load: PageServerLoad = async ({ locals, url, request }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const category = url.searchParams.get('category')?.trim() ?? 'All';

	// ✅ Get host from the request headers
	// const host = request.headers.get('host') || '';
	// const domain = host.replace(/^www\./, '').toLowerCase(); // optional: strip www
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];
	console.log("domain:", domain)

	try {
		// ✅ Look up the restaurant by domain
		const restaurant = await locals.pb.collection('restaurants').getFirstListItem(`domain = "${domain}"`);

		const restaurantId = restaurant.id;

		let filters: string[] = [`restaurantId = "${restaurantId}"`];

		if (search) {
			filters.push(`(name ~ "${search}" || description ~ "${search}")`);
		}

		if (category && category !== 'All') {
			filters.push(`category = "${category}"`);
		}

		const filter = filters.join(' && ');

		const dishes = await locals.pb.collection('dishes').getFullList({
			sort: '-created',
			fields: '*',
			filter
		});

		const categorySet = new Set(dishes.map((dish) => dish.category).filter(Boolean));
		const categories = Array.from(categorySet).sort();

		return {
			dishes,
			searchTerm: search,
			selectedCategory: category,
			categories,
			restaurant,
			restaurantId
		};
	} catch (error) {
		console.error('Error loading restaurant or dishes:', error);
		return {
			dishes: [],
			searchTerm: search,
			selectedCategory: category,
			categories: [],
			error: 'Restaurant not found or failed to load dishes'
		};
	}
};

