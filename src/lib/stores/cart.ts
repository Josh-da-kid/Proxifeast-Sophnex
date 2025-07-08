import { writable, derived } from 'svelte/store';
import pb from '$lib/pb'; // your PocketBase instance

export const cart = writable<any[]>([]);

export const total = derived(cart, ($cart) =>
	$cart.reduce((acc, item) => acc + item.dishAmount, 0)
);

export async function fetchCart() {
	try {
		const records = await pb.collection('cart').getFullList();
		cart.set(records);
	} catch (err) {
		console.error('Failed to fetch cart:', err);
	}
}



export async function clearCart() {
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
