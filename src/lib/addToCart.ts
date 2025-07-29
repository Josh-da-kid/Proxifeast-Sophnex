import type PocketBase from 'pocketbase';

export async function addToCartPB(
	pb: PocketBase,
	dishId: string,
	quantity: number = 1,
	userId: string,
	defaultAmount: number,
	promoAmount: number,
	restaurantId: string // ✅ new argument
) {
	try {
		// Determine price
		const unitPrice = promoAmount || defaultAmount;

		// Check if this dish already exists in the user's cart for this restaurant
		let existing: any = null;

		try {
			existing = await pb.collection('cart').getFirstListItem(
				`user="${userId}" && dish="${dishId}" && restaurantId="${restaurantId}"`
			);
		} catch (err) {
			// No item found — ignore
		}

		if (existing) {
			// Update existing cart item
			const updatedQuantity = existing.quantity + quantity;
			const updatedAmount = unitPrice * updatedQuantity;

			const updated = await pb.collection('cart').update(existing.id, {
				quantity: updatedQuantity,
				amount: updatedAmount
			});

			return updated;
		} else {
			// Add new cart item
			const totalAmount = unitPrice * quantity;

			const record = await pb.collection('cart').create({
				dish: dishId,
				quantity,
				amount: totalAmount,
				user: userId,
				restaurantId // ✅ include restaurantId
			});

			return record;
		}
	} catch (err) {
		console.error('Failed to add/update cart:', err);
		throw err;
	}
}


