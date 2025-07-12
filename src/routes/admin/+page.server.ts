export const actions = {
	createDish: async ({ locals, request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries([...formData]);

		console.log('createDish called');
		console.log(data);

		// Save to PocketBase
		try {
			const record = await locals.pb.collection('dishes').create({
				name: data.name,
				description: data.description,
                category: data.category,
				image: data.image,
				quantity: parseInt(data.quantity),
				availability: data.availability,
				defaultAmount: parseInt(data.defaultAmount),
				promoAmount: data.promoAmount ? parseInt(data.promoAmount) : null
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
