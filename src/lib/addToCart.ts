// src/lib/api/addToCartPB.ts
import type PocketBase from 'pocketbase';

export async function addToCartPB(pb: PocketBase, dishId: string, quantity: number = 1) {
	try {
		const record = await pb.collection('cart').create({
			dish: dishId,
			quantity,
			user: pb.authStore.model?.id // Optional if cart is user-based
		});
		return record;
	} catch (err) {
		console.error('Failed to add to cart:', err);
		throw err;
	}
}
