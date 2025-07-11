import type PocketBase from 'pocketbase';

export async function addToCartPB(
	pb: PocketBase,
	dishId: string,
	quantity: number = 1,
	userId: string,
	defaultAmount: number,
	promoAmount: number
) {
	try {
		// Determine price
		const unitPrice = promoAmount || defaultAmount;

		// Check if this dish already exists in the user's cart
		let existing: any = null;

		try {
			existing = await pb.collection('cart').getFirstListItem(
				`user="${userId}" && dish="${dishId}"`
			);
		} catch (err) {
			// if no item found, PocketBase throws error — ignore it
		}

		if (existing) {
			// update existing cart item
			const updatedQuantity = existing.quantity + quantity;
			const updatedAmount = unitPrice * updatedQuantity;

			const updated = await pb.collection('cart').update(existing.id, {
				quantity: updatedQuantity,
				amount: updatedAmount
			});

			return updated;
		} else {
			// add new cart item
			const totalAmount = unitPrice * quantity;

			const record = await pb.collection('cart').create({
				dish: dishId,
				quantity,
				amount: totalAmount,
				user: userId
			});

			return record;
		}
	} catch (err) {
		console.error('Failed to add/update cart:', err);
		throw err;
	}
}

