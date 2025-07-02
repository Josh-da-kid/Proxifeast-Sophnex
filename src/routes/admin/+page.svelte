<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	export let data;
	const user = data.user;
	let successAlert = false;
	let errorAlert = false;
	if ($page.form?.success) {
		successAlert = true;
	} else if ($page.form?.error) {
		errorAlert = true;
	}

	onMount(() => {
		if (successAlert) {
			setTimeout(() => {
				successAlert = false;
			}, 2000); // Hide after 4 seconds
		}
		if (errorAlert) {
			setTimeout(() => {
				errorAlert = false;
			}, 2000); // Hide after 4 seconds
		}
	});
</script>

{#if successAlert}
	<div
		role="alert"
		class="alert alert-success fixed mb-4 ml-2 px-6"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Dish created successfully!</span>
	</div>
{/if}

{#if errorAlert}
	<div
		role="alert"
		class="alert alert-error fixed mb-4"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
			/>
		</svg>
		<span>{$page.form.error}</span>
	</div>
{/if}

<h1 class="mb-4 flex items-center justify-center text-center text-3xl font-bold md:text-4xl">
	Welcome to Admin Dashboard
</h1>
<h3 class="text-secondary flex justify-center text-center text-2xl">{user?.name || ''}</h3>
<div class="mt-4 flex justify-center">
	<!-- Sidebar -->
	<!-- <aside class="w-64 p-4"> -->
	<nav class="flex gap-2">
		<a href="/admin" class="hover:underline">Dashboard</a>
		<a href="/admin/admin-menu" class="hover:underline">Menu</a>
		<a href="/admin/admin-order" class="hover:underline">Orders</a>
		<a href="/admin/admin-reservation" class="hover:underline">Reservations</a>
	</nav>
	<!-- </aside> -->
</div>
