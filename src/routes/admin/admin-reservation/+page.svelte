<script lang="ts">
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';
	import { fly, fade } from 'svelte/transition';

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
</script>

<svelte:head>
	<title>Reservations - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-8 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1
				class="font-playfair mb-2 text-2xl font-bold md:text-3xl"
				in:fly={{ y: 20, duration: 400 }}
			>
				Reservations
			</h1>
			<p class="text-sm text-slate-300" in:fade={{ duration: 400, delay: 100 }}>
				Manage customer table reservations
			</p>
		</div>
	</section>

	<main class="container mx-auto px-4 py-8">
		{#if $isLoggedIn}
			<div class="py-16 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-slate-300"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<rect x="3" y="4" width="18" height="18" rx="2" />
					<line x1="16" x2="16" y1="2" y2="6" />
					<line x1="8" x2="8" y1="2" y2="6" />
					<line x1="3" x2="21" y1="10" y2="10" />
				</svg>
				<h3 class="text-slate- font-medium700 mt-4 text-lg">No Reservations Yet</h3>
				<p class="mt-1 text-slate-500">Reservation management coming soon.</p>
			</div>
		{:else}
			<div class="py-16 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-slate-300"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
					<polyline points="10 17 15 12 10 7" />
					<line x1="15" x2="3" y1="12" y2="12" />
				</svg>
				<h3 class="mt-4 text-lg font-medium text-slate-700">Login Required</h3>
				<p class="mt-1 text-slate-500">You must be logged in as an admin to view reservations.</p>
				<a href="/admin/admin-login" class="btn btn-primary mt-4">Login</a>
			</div>
		{/if}
	</main>
</div>
