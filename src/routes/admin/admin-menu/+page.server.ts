import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url, request }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const category = url.searchParams.get('category')?.trim() ?? 'All';
	// const restaurantId = locals.user?.restaurantId;
	const host = request.headers.get('host') || '';
	const domain = host.split(':')[0];

	const restaurant = await locals.pb.collection('restaurants').getFirstListItem(`domain = "${domain}"`);

		const restaurantId = restaurant.id;

	if (!restaurantId) {
		return {
			dishes: [],
			searchTerm: search,
			selectedCategory: category,
			categories: [],
			error: 'Restaurant ID is required'
		};
	}

	let dishes;
	let filters: string[] = [`restaurantId="${restaurantId}"`]; // <-- Ensure only this restaurant's dishes show

	if (search) {
		filters.push(`(name ~ "${search}" || description ~ "${search}")`);
	}

	if (category && category !== 'All') {
		filters.push(`category = "${category}"`);
	}

	const filter = filters.join(' && ');

	try {
		const options: any = {
			sort: '-created',
			filter
		};

		dishes = await locals.pb.collection('dishes').getFullList(options);

		// Fetch only this restaurant's dishes to extract categories
		const allDishes = await locals.pb.collection('dishes').getFullList({
			filter: `restaurantId="${restaurantId}"`,
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
			categories,
			restaurantId // optional: return it to the page
		};
	} catch (error) {
		console.error('Failed to fetch dishes:', error);
		return {
			dishes: [],
			searchTerm: search,
			selectedCategory: category,
			categories: [],
			error: 'Failed to load dishes'
		};
	}
};



export const actions = {
	editDish: async ({ request, locals }) => {
		const formData = await request.formData();

		let imageUrl = '';
		const imageSource = formData.get('imageSource'); // 'url' or 'file'

		// Upload image if selected as file
		if (imageSource === 'file') {
			const file = formData.get('imageFile');
			if (file instanceof File && file.size > 0) {
				try {
					const uploadForm = new FormData();
					uploadForm.append('imageFile', file);

					const uploaded = await locals.pb.collection('uploads').create(uploadForm);
					imageUrl = locals.pb.files.getUrl(uploaded, uploaded.imageFile);
				} catch (uploadErr) {
					console.error('Upload failed:', uploadErr);
					return {
						success: false,
						error: 'Image upload failed.'
					};
				}
			}
		} else if (imageSource === 'url') {
			const inputUrl = formData.get('imageUrl');
			if (inputUrl && typeof inputUrl === 'string') {
				imageUrl = inputUrl;
			}
		}

		// Get restaurantId — either from the form or from the logged-in user's restaurant
		const restaurantId = formData.get('restaurantId') || locals.user?.restaurantId;

		if (!restaurantId) {
			return {
				success: false,
				error: 'Restaurant ID is missing.'
			};
		}

		// Proceed to update the dish
		try {
			const updated = await locals.pb.collection('dishes').update(formData.get('id'), {
				name: formData.get('name'),
				description: formData.get('description'),
				category: formData.get('category'),
				image: imageUrl,
				quantity: parseInt(formData.get('quantity')),
				availability: formData.get('availability'),
				defaultAmount: parseInt(formData.get('defaultAmount')),
				promoAmount: formData.get('promoAmount') ? parseInt(formData.get('promoAmount')) : null,
				restaurantId: restaurantId // ✅ important!
			});

			return { success: true, updated };
		} catch (err) {
			console.error('Update error:', err);
			return { success: false, error: 'Update failed.' };
		}
	}
};
