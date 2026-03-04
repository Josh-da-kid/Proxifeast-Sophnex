// src/lib/types/store.ts

export type StoreType = 'restaurant' | 'bar' | 'cafe' | 'hotel';

export interface StoreFeatures {
	hasMenu: boolean;
	hasReservation: boolean;
	hasRoomService: boolean;
	hasBar: boolean;
	hasCafeService: boolean;
}

export interface Store {
	id: string;
	name: string;
	slug: string;
	type: StoreType;
	features: StoreFeatures;
	description: string;
	location: string;
	coverImage: string;
	domain: string;
	email: string;
	phone: string;
	address: string;
	isSuper: boolean;
	created: string;
	updated: string;
}

export type ReservationType = 'hotel_room' | 'table' | 'event';

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'cancelled';

export interface Reservation {
	id: string;
	storeId: string;
	userId: string;
	type: ReservationType;
	reservationDate: string;
	checkInTime: string;
	status: ReservationStatus;
	qrToken: string;
	checkedInAt: string | null;
	guestName: string;
	guestEmail: string;
	guestPhone: string;
	partySize?: number;
	roomNumber?: string;
	created: string;
	updated: string;
}

export const STORE_TYPE_LABELS: Record<StoreType, string> = {
	restaurant: 'Restaurant',
	bar: 'Bar',
	cafe: 'Café',
	hotel: 'Hotel'
};

export const STORE_TYPE_COLORS: Record<StoreType, string> = {
	restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
	bar: 'bg-purple-100 text-purple-800 border-purple-200',
	cafe: 'bg-amber-100 text-amber-800 border-amber-200',
	hotel: 'bg-blue-100 text-blue-800 border-blue-200'
};

export const FEATURE_LABELS: Record<keyof StoreFeatures, string> = {
	hasMenu: 'Menu',
	hasReservation: 'Reservations',
	hasRoomService: 'Room Service',
	hasBar: 'Bar',
	hasCafeService: 'Café'
};

export const DEFAULT_FEATURES: StoreFeatures = {
	hasMenu: true,
	hasReservation: false,
	hasRoomService: false,
	hasBar: false,
	hasCafeService: false
};
