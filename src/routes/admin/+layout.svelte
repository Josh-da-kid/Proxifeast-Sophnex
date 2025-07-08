<script>
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { isAdminPage } from '$lib/menuItems.svelte';
	import { fetchCart } from '$lib/stores/cart';
	import { onMount } from 'svelte';

	let { children } = $props();

	let loading = true;
	onMount(() => {
		loading = false;
		fetchCart();
	});

	afterNavigate(() => {
		loading = false;
	});
</script>

<div class="flex min-h-screen flex-col">
	<main class="flex-grow">{@render children()}</main>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&family=Roboto&display=swap');

	:global(html, body) {
		font-family: 'Roboto', sans-serif;
	}

	:global(h1, h2, h3) {
		font-family: 'Playfair Display', serif;
	}

	/* Smooth scrolling for anchor links */
	* {
		scroll-behavior: smooth;
	}

	/* Animate nav links on hover */
	.nav-link:hover {
		transition: color 0.3s ease;
	}
</style>
