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

		// Get restaurantId from the form
		const restaurantId = formData.get('restaurantId');

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
				promoAmount: formData.get('promoAmount')
					? parseInt(formData.get('promoAmount'))
					: null,
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



