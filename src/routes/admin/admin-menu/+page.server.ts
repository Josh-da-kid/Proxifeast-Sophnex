import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const dishes = await locals.pb.collection('dishes').getFullList({
			sort: '-created',
			expand: 'user' // if you want related user data
		});

		return {
			dishes
		};
	} catch (error) {
		console.error('Failed to fetch dishes:', error);
		return {
			dishes: []
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

