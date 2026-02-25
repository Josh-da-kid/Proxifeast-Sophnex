<script>
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { isAdminPage } from '$lib/menuItems.svelte';
	import { fetchCart } from '$lib/stores/cart';
	import { onMount } from 'svelte';
	import { navigating } from '$app/stores';
	import { get } from 'svelte/store';

	let { children } = $props();

	let isNavigating = $state(false);

	$effect(() => {
		isNavigating = get(navigating) !== null;
		const unsub = navigating.subscribe((n) => {
			isNavigating = n !== null;
		});
		return unsub;
	});

	onMount(() => {
		fetchCart();
	});
</script>

{#if isNavigating}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
	>
		<div class="relative">
			<div
				class="h-20 w-20 animate-spin rounded-full border-4 border-slate-700 border-t-amber-500"
			></div>
			<div class="absolute inset-0 flex items-center justify-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8 text-amber-500"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
					<line x1="3" y1="9" x2="21" y2="9"></line>
					<line x1="9" y1="21" x2="9" y2="9"></line>
				</svg>
			</div>
		</div>
		<p class="mt-6 font-serif text-lg tracking-widest text-slate-300">LOADING</p>
		<p class="mt-2 text-sm text-slate-500">Proxifeast Admin</p>
	</div>
{/if}

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
