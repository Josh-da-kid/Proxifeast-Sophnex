import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
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

const GUEST_CART_STORAGE_KEY = 'proxifeast_guest_cart';

function readGuestCart() {
	if (!browser) return [];

	try {
		const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (err) {
		console.error('Failed to read guest cart:', err);
		return [];
	}
}

function persistGuestCart(items: any[]) {
	if (!browser) return;

	try {
		const guestItems = items.filter((item) => String(item.id).startsWith('temp-'));
		if (guestItems.length === 0) {
			localStorage.removeItem(GUEST_CART_STORAGE_KEY);
			return;
		}

		localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(guestItems));
	} catch (err) {
		console.error('Failed to persist guest cart:', err);
	}
}

if (browser) {
	cart.set(readGuestCart());
	cart.subscribe((items) => {
		persistGuestCart(items);
	});
}

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

// Optimistically add item to cart for instant UI update
export function addToCartOptimistic(
	dish: any,
	quantity: number,
	restaurantId: string,
	restaurantName: string
) {
	const unitPrice = dish.promoAmount || dish.defaultAmount;
	const newItem = {
		id: `temp-${Date.now()}`,
		dish: dish.id,
		quantity: quantity,
		amount: unitPrice * quantity,
		restaurantId: restaurantId,
		restaurantName: restaurantName,
		expand: {
			dish: {
				id: dish.id,
				name: dish.name,
				defaultAmount: dish.defaultAmount,
				promoAmount: dish.promoAmount,
				availability: dish.availability,
				image: dish.image
			}
		}
	};

	cart.update((items) => {
		// Check if item already exists
		const existingIndex = items.findIndex(
			(item) => item.expand?.dish?.id === dish.id && item.restaurantId === restaurantId
		);

		if (existingIndex >= 0) {
			// Update quantity
			items[existingIndex].quantity += quantity;
			items[existingIndex].amount = items[existingIndex].quantity * unitPrice;
			return [...items];
		} else {
			// Add new item
			return [...items, newItem];
		}
	});
}

export async function fetchCart(restaurantId?: string, userId?: string) {
	try {
		const currentUserId = userId || pb.authStore.model?.id;
		if (!currentUserId) {
			return cart.set(readGuestCart());
		}

		const records = await pb.collection('cart').getFullList({
			filter: `user="${currentUserId}"`,
			expand: 'dish' // if dish is a relation
		});

		console.log('Cart records fetched:', records.length);

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
		console.error('Failed to fetch cart:', err);
	}
}

export async function clearCart(restaurantId?: string) {
	const userId = pb.authStore.model?.id;
	if (!userId) {
		cart.set([]);
		return;
	}

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
		if (id.startsWith('temp-')) {
			cart.update((items) => items.filter((item: any) => item.id !== id));
			return;
		}

		await pb.collection('cart').delete(id);
		await fetchCart();
	} catch (err) {
		console.error('Failed to remove item:', err);
	}
}

export function clearCartFrontend() {
	cart.set([]);
}
