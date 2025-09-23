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
			}, 2000);
		}
		if (errorAlert) {
			setTimeout(() => {
				errorAlert = false;
			}, 2000);
		}
	});

	let showError = false;

	$: {
		const params = $page.url.searchParams;
		showError = params.get('not_admin') === '1';
	}
</script>

{#if successAlert}
	<div
		role="alert"
		class="alert alert-success fixed top-1/2 z-20 mb-4 ml-2 px-6"
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
		class="alert alert-error fixed top-1/2 z-20 mb-4"
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

{#if showError}
	<div
		role="alert"
		class="alert alert-error fixed top-1/2 z-20 mb-4"
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
		<span>You must be an admin to access the admin panel.</span>
	</div>
{/if}

<h1
	class="mb-4 flex items-center justify-center text-center text-3xl font-bold md:mt-8 md:text-4xl"
	in:fly={{ x: 200, duration: 800 }}
>
	Welcome to ProxiFeast Admin Dashboard
</h1>
<h3
	class="text-secondary flex justify-center text-center text-3xl"
	in:fly={{ x: 200, duration: 800 }}
>
	{user?.name || ''}
</h3>
<div class="mt-8 grid gap-6 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	<a
		href="/admin"
		class="card bg-base-100 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
	>
		<div class="card-body items-center text-center">
			<h2 class="card-title">Dashboard</h2>
			<p>Overview of your restaurant activity</p>
		</div>
	</a>

	<a
		href="/admin/admin-menu"
		class="card bg-base-100 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
	>
		<div class="card-body items-center text-center">
			<h2 class="card-title">Menu</h2>
			<p>Manage your dishes and categories</p>
		</div>
	</a>

	<a
		href="/admin/admin-order"
		class="card bg-base-100 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
	>
		<div class="card-body items-center text-center">
			<h2 class="card-title">Pending Orders</h2>
			<p>View and process new orders</p>
		</div>
	</a>

	<a
		href="/admin/admin-history"
		class="card bg-base-100 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
	>
		<div class="card-body items-center text-center">
			<h2 class="card-title">Order History</h2>
			<p>Track completed orders</p>
		</div>
	</a>

	<a
		href="/admin/admin-reservation"
		class="card bg-base-100 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
	>
		<div class="card-body items-center text-center">
			<h2 class="card-title">Reservations</h2>
			<p>Manage customer reservations</p>
		</div>
	</a>
</div>
