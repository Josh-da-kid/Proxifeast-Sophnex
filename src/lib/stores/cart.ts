import { writable, derived } from 'svelte/store';

export interface CartItem {
	name: string;
	price: string;
	image: string;
	quantity: number;
}

export const cart = writable<CartItem[]>([]);

export function addToCart(item: CartItem) {
	cart.update((items) => {
		const existing = items.find((i) => i.name === item.name);
		if (existing) {
			return items.map((i) =>
				i.name === item.name ? { ...i, quantity: i.quantity + item.quantity } : i
			);
		} else {
			return [...items, item];
		}
	});
}

export function removeFromCart(name: string) {
	cart.update((items) => items.filter((item) => item.name !== name));
}

export function clearCart() {
	cart.set([]);
}

// 🧮 Add this derived store to calculate total
function getNumericPrice(price: string | number) {
	return typeof price === 'string' ? parseFloat(price.replace(/[₦,]/g, '')) || 0 : price;
}

export const total = derived(cart, ($cart) =>
	$cart.reduce((sum, item) => sum + getNumericPrice(item.price) * item.quantity, 0)
);
