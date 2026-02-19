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
	$cart.reduce((acc, item) => {
		// Only add to total if the dish is available
		if (item.expand?.dish?.availability === 'Available') {
			const price = item.expand?.dish?.promoAmount ?? item.expand?.dish?.defaultAmount ?? 0;
			return acc + price * item.quantity;
		}
		return acc;
	}, 0)
);

export async function fetchCart(restaurantId?: string) {
	try {
		const userId = pb.authStore.model?.id;
		if (!userId) return cart.set([]);

		const records = await pb.collection('cart').getFullList({
			filter: `user="${userId}"`,
			expand: 'dish' // if dish is a relation
		});

		// Filter by restaurant if restaurantId is provided
		let filteredRecords = records;
		if (restaurantId) {
			filteredRecords = records.filter((item: any) => {
				const itemRestaurantId = item.restaurant || item.restaurantId;
				return itemRestaurantId === restaurantId;
			});
		}

		cart.set(filteredRecords);
	} catch (err) {
		// console.error('Failed to fetch cart:', err);
	}
}

export async function clearCart(restaurantId?: string) {
	const userId = pb.authStore.model?.id;
	if (!userId) return;

	try {
		let items = await pb.collection('cart').getFullList({
			filter: `user="${userId}"`
		});

		// Filter by restaurant if restaurantId is provided
		if (restaurantId) {
			items = items.filter((item: any) => {
				const itemRestaurantId = item.restaurant || item.restaurantId;
				return itemRestaurantId === restaurantId;
			});
		}

		await Promise.all(items.map((item: any) => pb.collection('cart').delete(item.id)));
		await fetchCart(restaurantId);
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
