// src/hooks.server.js
import PocketBase from 'pocketbase';
import type { Handle } from '@sveltejs/kit';

/** @type {Handle} */
export async function handle({ event, resolve }) {
	event.locals.pb = new PocketBase('https://playgzero.pb.itcass.net/');

	// load the store data from the request cookie string
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		// verify and refresh the user
		if (event.locals.pb.authStore.isValid) {
			const authData = await event.locals.pb.collection('users').authRefresh();
			event.locals.user = authData.record;
		} else {
			event.locals.user = null;
		}
	} catch (_) {
		// clear the auth store on failed refresh
		event.locals.pb.authStore.clear();
		event.locals.user = null;
	}

	const response = await resolve(event);

	// send updated cookie back
	response.headers.append('set-cookie', event.locals.pb.authStore.exportToCookie());

	// Add cache headers for static assets
	const url = event.request.url;
	const isStaticFile =
		url.includes('/fonts/') || url.includes('/icons/') || url.includes('/favicon');
	const isLogoutRoute = url.includes('/logout') || url.includes('/admin-logout');
	const isAuthenticatedPage = event.locals.user !== null;

	if (isStaticFile) {
		// Cache static assets for 1 year
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (isLogoutRoute || isAuthenticatedPage) {
		// Don't cache logout routes or authenticated pages
		response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');
	} else if (!url.includes('/api/')) {
		// Cache public pages for 5 minutes
		response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
	}

	return response;
}
