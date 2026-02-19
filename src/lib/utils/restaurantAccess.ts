// src/lib/utils/restaurantAccess.ts
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Check if a restaurant is a "super" restaurant with cross-restaurant access
 */
export function isSuperRestaurant(restaurant: any): boolean {
	return restaurant?.isSuper === true;
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
