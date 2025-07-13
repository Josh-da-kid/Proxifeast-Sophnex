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



// export const actions = {
// 	editDish: async ({ request, locals }) => {
// 		const formData = await request.formData();
// 		const data = Object.fromEntries(formData.entries());

// 		try {
// 			const updated = await locals.pb.collection('dishes').update(data.id, {
// 				name: data.name,
// 				description: data.description,
// 				category: data.category,
// 				image: data.image,
// 				quantity: parseInt(data.quantity),
// 				availability: data.availability,
// 				defaultAmount: parseInt(data.defaultAmount),
// 				promoAmount: data.promoAmount ? parseInt(data.promoAmount) : null
// 			});

// 			return { success: true, updated };
// 		} catch (err) {
// 			console.error(err);
// 			return { success: false, error: 'Update failed.' };
// 		}
// 	}

//  };



export const actions = {
	editDish: async ({ request, locals }) => {
		const formData = await request.formData();

		let imageUrl = '';
		const imageSource = formData.get('imageSource'); // 'url' or 'file'

		// Handle file upload if user selected "file"
		if (imageSource === 'file') {
			const file = formData.get('imageFile');

			if (file instanceof File && file.size > 0) {
				try {
					const uploadForm = new FormData();
					uploadForm.append('imageFile', file);

					const uploaded = await locals.pb.collection('uploads').create(uploadForm);
					imageUrl = locals.pb.files.getUrl(uploaded, uploaded.imageFile);
					console.log('Uploaded new image:', imageUrl);
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

		// Continue with update
		try {
			const updated = await locals.pb.collection('dishes').update(formData.get('id'), {
				name: formData.get('name'),
				description: formData.get('description'),
				category: formData.get('category'),
				image: imageUrl, // ✅ always final image URL
				quantity: parseInt(formData.get('quantity')),
				availability: formData.get('availability'),
				defaultAmount: parseInt(formData.get('defaultAmount')),
				promoAmount: formData.get('promoAmount') ? parseInt(formData.get('promoAmount')) : null
			});

			return { success: true, updated };
		} catch (err) {
			console.error('Update error:', err);
			return { success: false, error: 'Update failed.' };
		}
	}
};
