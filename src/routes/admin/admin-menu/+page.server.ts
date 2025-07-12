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

console.log(category)

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



export const actions = {
	editDish: async ({ request, locals }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData.entries());

		try {
			const updated = await locals.pb.collection('dishes').update(data.id, {
				name: data.name,
				description: data.description,
				category: data.category,
				image: data.image,
				quantity: parseInt(data.quantity),
				availability: data.availability,
				defaultAmount: parseInt(data.defaultAmount),
				promoAmount: data.promoAmount ? parseInt(data.promoAmount) : null
			});

			return { success: true, updated };
		} catch (err) {
			console.error(err);
			return { success: false, error: 'Update failed.' };
		}
	}

 };



