import type PocketBase from 'pocketbase';

type UserRecord = Record<string, any> | null | undefined;

export function normalizeDomain(host: string): string {
	return host
		.split(':')[0]
		.replace(/^www\./, '')
		.trim()
		.toLowerCase();
}

export function escapeFilterValue(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function isSuperRestaurant(restaurant: Record<string, any> | null | undefined): boolean {
	return restaurant?.isSuper === true || restaurant?.isSuper === 'true';
}

export function getUserRestaurantIds(user: UserRecord): string[] {
	if (!user) return [];

	const restaurantIds = Array.isArray(user.restaurantIds) ? [...user.restaurantIds] : [];
	if (restaurantIds.length === 0 && user.restaurantId) {
		restaurantIds.push(user.restaurantId);
	}

	return [...new Set(restaurantIds.filter(Boolean))];
}

export function getUserAdminRestaurantIds(user: UserRecord): string[] {
	if (!user) return [];
	return [
		...new Set(
			(Array.isArray(user.adminRestaurantIds) ? user.adminRestaurantIds : []).filter(Boolean)
		)
	];
}

export async function resolveRestaurantByDomain(
	pb: PocketBase,
	host: string,
	options: { allowSuperFallback?: boolean } = {}
) {
	const domain = normalizeDomain(host);
	if (!domain) return null;

	try {
		return await pb
			.collection('restaurants')
			.getFirstListItem(`domain = "${escapeFilterValue(domain)}"`);
	} catch {
		const results = await pb.collection('restaurants').getFullList({
			fields:
				'id,name,domain,isSuper,state,restaurantAddress,openingTime,closingTime,email,restaurantEmail,latitude,longitude,maxDeliveryRadius,serviceFee,minOrderValue,smallOrderFee'
		});
		const exactMatch = results.find((restaurant: Record<string, any>) => {
			return normalizeDomain(restaurant.domain || '') === domain;
		});

		if (exactMatch) return exactMatch;
		if (options.allowSuperFallback) {
			return (
				results.find((restaurant: Record<string, any>) => isSuperRestaurant(restaurant)) || null
			);
		}
		return null;
	}
}

export async function isSuperadmin(pb: PocketBase, user: UserRecord): Promise<boolean> {
	if (!user) return false;
	return user.isSuper === true || user.isSuper === 'true';
}

export async function canAdminAccessRestaurant(
	pb: PocketBase,
	user: UserRecord,
	restaurantId: string
): Promise<boolean> {
	if (!user || !restaurantId) return false;
	if (await isSuperadmin(pb, user)) return true;

	const adminRestaurantIds = getUserAdminRestaurantIds(user);
	if (adminRestaurantIds.length > 0) {
		return adminRestaurantIds.includes(restaurantId);
	}

	return user.isAdmin === true && getUserRestaurantIds(user).includes(restaurantId);
}

export function canPublicAccessRestaurant(
	currentRestaurant: Record<string, any> | null | undefined,
	targetRestaurantId: string
): boolean {
	if (!currentRestaurant || !targetRestaurantId) return false;
	if (isSuperRestaurant(currentRestaurant)) return true;
	return currentRestaurant.id === targetRestaurantId;
}

export async function getScopedRestaurantForRequest(
	pb: PocketBase,
	host: string,
	targetRestaurantId: string,
	options: { allowSuperFallback?: boolean } = {}
) {
	const currentRestaurant = await resolveRestaurantByDomain(pb, host, options);
	if (!currentRestaurant) return { currentRestaurant: null, allowed: false };

	return {
		currentRestaurant,
		allowed: canPublicAccessRestaurant(currentRestaurant, targetRestaurantId)
	};
}
