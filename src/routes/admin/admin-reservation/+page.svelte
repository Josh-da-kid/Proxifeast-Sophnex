<script>
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';
	import { fly } from 'svelte/transition';
	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
</script>

<main>
	{#if $isLoggedIn}
		<h1 class="mb-4 text-center text-2xl font-bold" in:fly={{ x: 200, duration: 800 }}>
			Reservation Orders
		</h1>
	{:else}
		<p class="mt-8 text-center text-gray-500 italic">
			You must be logged in as an admin inorder to view reservation orders.
		</p>
		<a href="/login" class="btn btn-primary mx-auto mt-4 flex w-fit items-center justify-center"
			>Login</a
		>
	{/if}
</main>
