	import { page } from '$app/stores';
	import { derived } from 'svelte/store';

	export const isAdminPage = derived(page, ($page) => $page.url.pathname.startsWith('/admin'));
     export let isMenuOpen = false;
    
export const toggleMenu = () => (isMenuOpen = !isMenuOpen);

    export const menuItems = [
		// { id: 'home', label: 'Home' },
		// { id: 'menu', label: 'Menu' },
		{ id: 'about', label: 'About' },
		{ id: 'contact', label: 'Contact' },
		// { id: 'signup', label: 'Signup/Login' }
		// { id: 'reservation', label: 'Book Reservation' }
	];

	export function getHref(id: string) {
		return `/${id}`;
	}