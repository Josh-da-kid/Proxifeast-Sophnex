// export const actions = {
// 	createDish: async ({ locals, request }) => {
// 		const formData = await request.formData();
// 		const data = Object.fromEntries([...formData]);

// 		console.log('createDish called');
// 		console.log(data);

// 		// Save to PocketBase
// 		try {
// 			const record = await locals.pb.collection('dishes').create({
// 				name: data.name,
// 				description: data.description,
//                 category: data.category,
// 				image: data.image,
// 				quantity: parseInt(data.quantity),
// 				availability: data.availability,
// 				defaultAmount: parseInt(data.defaultAmount),
// 				promoAmount: data.promoAmount ? parseInt(data.promoAmount) : null
// 			});

// 			console.log('Record saved to PocketBase:', record);

// 			return {
// 				success: true,
// 				record
// 			};
// 		} catch (error) {
// 			console.error('PocketBase Error:', error);

// 			return {
// 				success: false,
// 				error: 'Failed to create dish.'
// 			};
// 		}
// 	}
// };



export const actions = {
	createDish: async ({ locals, request }) => {
		const formData = await request.formData();

		console.log('createDish called');

		// For debugging
		for (let [key, value] of formData.entries()) {
			console.log(key, value);
		}

		let imageUrl = '';
		const imageSource = formData.get('imageSource'); // 'file' or 'url'

		// Handle image upload if imageSource is 'file'
		if (imageSource === 'file') {
			const file = formData.get('imageFile');

			if (file instanceof File && file.size > 0) {
				try {
					const uploadForm = new FormData();
					uploadForm.append('imageFile', file); // 'imageFile' is the file field in the 'uploads' collection

					const uploaded = await locals.pb.collection('uploads').create(uploadForm);
					imageUrl = locals.pb.files.getUrl(uploaded, uploaded.imageFile);
					console.log('Image uploaded to uploads collection:', imageUrl);
				} catch (uploadErr) {
					console.error('Error uploading image to uploads collection:', uploadErr);
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

		// Save dish record with final image URL
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
					: null
			});

			console.log('Record saved to PocketBase:', record);

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


