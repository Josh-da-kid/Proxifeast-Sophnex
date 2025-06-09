	
     export let isMenuOpen = false;
    
export const toggleMenu = () => (isMenuOpen = !isMenuOpen);

    export const menuItems = [
		{ id: 'home', label: 'Home' },
		// { id: 'menu', label: 'Menu' },
		{ id: 'about', label: 'About' },
		{ id: 'contact', label: 'Contact' }
	];