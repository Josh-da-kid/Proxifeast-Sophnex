import { writable, derived } from 'svelte/store';
import pb from '$lib/pb'; // your PocketBase instance


type CartItem = {
	id: string;
	quantity: number;
	expand: {
		dish: {
			name: string;
			price: number;
		};
	};
};

export const cart = writable<any[]>([]);

export const total = derived(cart, ($cart) =>

$cart.reduce((acc, item) => acc + (item.expand?.dish?.price || 0), 0)

);

export async function fetchCart() {
	
	try {
		const userId = pb.authStore.model?.id;
		if (!userId) return cart.set([]);

		const records = await pb.collection('cart').getFullList({
			filter: `user="${userId}"`,
			expand: 'dish' // if dish is a relation
		});

		cart.set(records);
		
	} catch (err) {
		// console.error('Failed to fetch cart:', err);
	}

	
}


export async function clearCart() {
			const userId = pb.authStore.model?.id;
		if (!userId) return;
	try {
		const items = await pb.collection('cart').getFullList();
		await Promise.all(items.map((item) => pb.collection('cart').delete(item.id)));
		await fetchCart();
	} catch (err) {
		console.error('Failed to clear cart:', err);
	}
}

export async function removeFromCart(id: string) {
	try {
		await pb.collection('cart').delete(id);
		await fetchCart();
	} catch (err) {
		console.error('Failed to remove item:', err);
	}
}


export function clearCartFrontend() {
	cart.set([]);
}
