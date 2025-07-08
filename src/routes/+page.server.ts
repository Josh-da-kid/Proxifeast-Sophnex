export const actions = {
	
	createDish: async ({ locals, request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries([...formData]);
        console.log('createDish called');
		console.log(data);



		 
       
    },
	
	addToCart: async ({ request, locals }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData.entries());

		try {
			const add = await locals.pb.collection('cart').create({
				name: data.name,
				description: data.description,
				category: data.category,
				image: data.image,
				quantity: parseInt(data.quantity),
				defaultAmount: parseInt(data.defaultAmount),
				promoAmount: data.promoAmount ? parseInt(data.promoAmount) : null
			});

			return { success: true, add };
		} catch (err) {
			console.error(err);
			return { success: false, error: 'add to cart failed.' };
		}
	}

 

}

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const category = url.searchParams.get('category')?.trim() ?? 'All';

	let dishes;
	let filters: string[] = [];

	if (search) {
		filters.push(`(name ~ "${search}" || description ~ "${search}")`);
	}

	if (category && category !== 'All') {
		filters.push(`category = "${category}"`);
	}

	const filter = filters.join(' && ');

	try {
		const options: any = {
			sort: '-created'
		};

		if (filter) {
			options.filter = filter;
		}

		dishes = await locals.pb.collection('dishes').getFullList(options);

		const allDishes = await locals.pb.collection('dishes').getFullList({
	fields: 'category'
});
const categorySet = new Set(
	allDishes.map((dish) => dish.category).filter(Boolean)
);
const categories = Array.from(categorySet).sort();


		return {
			dishes,
			searchTerm: search,
			selectedCategory: category,
			categories
		};
	} catch (error) {
		console.error('Failed to fetch dishes:', error);
		return {
			dishes: [],
			searchTerm: search,
			selectedCategory: category,
			error: 'Failed to load dishes'
		};
	}
};