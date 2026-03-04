// src/lib/utils/restaurantAccess.ts
import type { StoreFeatures } from '$lib/types/store';

/**
 * Check if a restaurant is a "super" restaurant with cross-restaurant access
 */
export function isSuperRestaurant(restaurant: any): boolean {
	if (!restaurant) return false;
	return restaurant.isSuper === true || restaurant.isSuper === 'true';
}

/**
 * Check if a store has a specific feature enabled
 */
export function hasFeature(store: any, feature: keyof StoreFeatures): boolean {
	if (!store || !store.features) return false;
	return store.features[feature] === true || store.features[feature] === 'true';
}

/**
 * Get the store type label
 */
export function getStoreTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		restaurant: 'Restaurant',
		bar: 'Bar',
		cafe: 'Café',
		hotel: 'Hotel'
	};
	return labels[type] || 'Store';
}

/**
 * Get color class for store type
 */
export function getStoreTypeColor(type: string): string {
	const colors: Record<string, string> = {
		restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
		bar: 'bg-purple-100 text-purple-800 border-purple-200',
		cafe: 'bg-amber-100 text-amber-800 border-amber-200',
		hotel: 'bg-blue-100 text-blue-800 border-blue-200'
	};
	return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get the current restaurant from the request domain
 */
export async function getCurrentRestaurant(locals: any): Promise<any> {
	// Restaurant should already be set in locals by admin layout or hooks
	return locals.restaurant || null;
}

/**
 * Filter items by restaurant access
 * Super restaurants see all items, regular restaurants see only their own
 */
export function filterByRestaurantAccess(
	items: any[],
	currentRestaurant: any,
	restaurantField: string = 'restaurant'
): any[] {
	if (!currentRestaurant) return [];
	if (isSuperRestaurant(currentRestaurant)) return items;

	return items.filter((item) => {
		const itemRestaurantId = item[restaurantField] || item.restaurantId || item.restaurant;
		return itemRestaurantId === currentRestaurant.id;
	});
}

/**
 * Check if user has permission to access/modify a specific restaurant's data
 */
export function hasRestaurantAccess(currentRestaurant: any, targetRestaurantId: string): boolean {
	if (!currentRestaurant) return false;
	if (isSuperRestaurant(currentRestaurant)) return true;
	return currentRestaurant.id === targetRestaurantId;
}

/**
 * Build a filter string for PocketBase queries based on restaurant access
 */
export function buildRestaurantFilter(
	currentRestaurant: any,
	baseFilter: string = '',
	restaurantField: string = 'restaurant'
): string {
	if (!currentRestaurant) return baseFilter;
	if (isSuperRestaurant(currentRestaurant)) return baseFilter;

	const restaurantFilter = `${restaurantField} = "${currentRestaurant.id}"`;

	if (baseFilter) {
		return `${baseFilter} && ${restaurantFilter}`;
	}
	return restaurantFilter;
}
