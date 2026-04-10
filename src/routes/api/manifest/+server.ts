import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveRestaurantByDomain } from '$lib/server/restaurantAccess';

export const GET: RequestHandler = async ({ locals, request }) => {
	const host = request.headers.get('host') || '';
	const restaurant = await resolveRestaurantByDomain(locals.pb, host, { allowSuperFallback: true });

	const name = restaurant?.name || 'Proxifeast';
	const shortName = restaurant?.name || 'Proxifeast';
	const description =
		restaurant?.motto ||
		`Order online at ${restaurant?.name || 'your favorite restaurant'}. Scan, order, and enjoy!`;

	const typeLabels: Record<string, string> = {
		restaurant: 'Restaurant',
		cafe: 'Café',
		bar: 'Bar',
		hotel: 'Hotel'
	};
	const venueType = restaurant?.type ? typeLabels[restaurant.type] || 'Venue' : 'Venue';

	const hasReservations = restaurant?.features?.hasReservation;
	const hasMenu = restaurant?.features?.hasMenu;
	const hasRoomService = restaurant?.features?.hasRoomService && restaurant?.type === 'hotel';

	const shortcuts = [
		{
			name: 'Browse Menu',
			short_name: 'Menu',
			description: `View ${venueType} menu`,
			url: '/#menu',
			icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
		},
		...(hasReservations
			? [
					{
						name: restaurant?.type === 'hotel' ? 'Book Room' : 'Reserve Table',
						short_name: 'Reserve',
						description: `Make a reservation`,
						url: `/reservation?store=${restaurant?.id || ''}`,
						icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
					}
				]
			: []),
		...(hasMenu
			? [
					{
						name: 'View Cart',
						short_name: 'Cart',
						description: 'View your shopping cart',
						url: '/checkout',
						icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
					}
				]
			: []),
		{
			name: 'Order History',
			short_name: 'History',
			description: 'View your order history',
			url: '/history',
			icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
		}
	];

	const manifest = {
		name,
		short_name: shortName,
		description,
		start_url: '/',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: '#f59e0b',
		orientation: 'portrait-primary',
		scope: '/',
		lang: 'en',
		dir: 'ltr',
		categories: ['business', 'food', 'shopping', 'lifestyle', 'travel'],
		icons: [
			{ src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png', purpose: 'maskable any' },
			{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png', purpose: 'maskable any' },
			{
				src: '/icons/icon-128x128.png',
				sizes: '128x128',
				type: 'image/png',
				purpose: 'maskable any'
			},
			{
				src: '/icons/icon-144x144.png',
				sizes: '144x144',
				type: 'image/png',
				purpose: 'maskable any'
			},
			{
				src: '/icons/icon-152x152.png',
				sizes: '152x152',
				type: 'image/png',
				purpose: 'maskable any'
			},
			{
				src: '/icons/icon-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable any'
			},
			{
				src: '/icons/icon-384x384.png',
				sizes: '384x384',
				type: 'image/png',
				purpose: 'maskable any'
			},
			{
				src: '/icons/icon-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable any'
			}
		],
		screenshots: [
			{
				src: '/screenshots/home.png',
				sizes: '1280x720',
				type: 'image/png',
				form_factor: 'wide',
				label: 'Homepage'
			},
			{
				src: '/screenshots/mobile.png',
				sizes: '750x1334',
				type: 'image/png',
				form_factor: 'narrow',
				label: 'Mobile view'
			}
		],
		shortcuts,
		related_applications: [],
		prefer_related_applications: false
	};

	return json(manifest, {
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate',
			'Content-Type': 'application/manifest+json'
		}
	});
};
