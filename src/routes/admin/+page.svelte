<script lang="ts">
	import { page } from '$app/stores';
	import Footer from '$lib/Footer.svelte';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	let { data } = $props();
	const user = data.user;
	const stats = data.stats ?? { todayRevenue: 0, pendingOrdersCount: 0, completedOrdersCount: 0 };

	let successAlert = $state(false);
	let errorAlert = $state(false);

	$effect(() => {
		if ($page.form?.success) {
			successAlert = true;
			setTimeout(() => {
				successAlert = false;
			}, 3000);
		} else if ($page.form?.error) {
			errorAlert = true;
			setTimeout(() => {
				errorAlert = false;
			}, 3000);
		}
	});

	let showError = $state(false);

	$effect(() => {
		const params = $page.url.searchParams;
		showError = params.get('not_admin') === '1';
	});
</script>

<svelte:head>
	<title>Admin Dashboard - Proxifeast</title>
</svelte:head>

{#if successAlert}
	<div
		class="alert alert-success fixed top-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 shadow-lg"
		in:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Dish created successfully!</span>
	</div>
{/if}

{#if errorAlert}
	<div
		class="alert alert-error fixed top-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 shadow-lg"
		in:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>{$page.form.error}</span>
	</div>
{/if}

{#if showError}
	<div
		class="alert alert-error fixed top-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 shadow-lg"
		in:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>You must be an admin to access the admin panel.</span>
	</div>
{/if}

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-12 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-3xl" in:fly={{ y: 30, duration: 600 }}>
				<div class="mb-4 flex justify-center">
					<div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 shadow-lg">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-8 w-8"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
							<path d="M7 2v20" />
							<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
						</svg>
					</div>
				</div>
				<h1 class="font-playfair mb-2 text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
				<p class="text-slate-300">Welcome back, {user?.name || 'Admin'}</p>
			</div>
		</div>
	</section>

	<!-- Navigation Cards -->
	<main class="container mx-auto px-4 py-12">
		<div class="mx-auto max-w-5xl">
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<!-- Menu -->
				<a
					href="/admin/admin-menu"
					class="group rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
					in:fly={{ y: 20, duration: 400, delay: 100 }}
				>
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-800"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-7 w-7 text-slate-600 transition-colors group-hover:text-white"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
							<path d="M7 2v20" />
							<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
						</svg>
					</div>
					<h2 class="font-playfair text-lg font-semibold text-slate-900">Menu</h2>
					<p class="mt-1 text-sm text-slate-500">Manage dishes & categories</p>
				</a>

				<!-- Pending Orders -->
				<a
					href="/admin/admin-order"
					class="group rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
					in:fly={{ y: 20, duration: 400, delay: 200 }}
				>
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-800"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-7 w-7 text-slate-600 transition-colors group-hover:text-white"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
							<rect x="9" y="3" width="6" height="4" rx="1" />
							<path d="M9 12h6" />
							<path d="M9 16h6" />
						</svg>
					</div>
					<h2 class="font-playfair text-lg font-semibold text-slate-900">Orders</h2>
					<p class="mt-1 text-sm text-slate-500">View & process new orders</p>
				</a>

				<!-- Order History -->
				<a
					href="/admin/admin-history"
					class="group rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
					in:fly={{ y: 20, duration: 400, delay: 300 }}
				>
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-800"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-7 w-7 text-slate-600 transition-colors group-hover:text-white"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
					</div>
					<h2 class="font-playfair text-lg font-semibold text-slate-900">History</h2>
					<p class="mt-1 text-sm text-slate-500">Track completed orders</p>
				</a>

				<!-- Reservations -->
				<a
					href="/admin/admin-reservation"
					class="group rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
					in:fly={{ y: 20, duration: 400, delay: 400 }}
				>
					<div
						class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-slate-800"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-7 w-7 text-slate-600 transition-colors group-hover:text-white"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" />
							<line x1="16" x2="16" y1="2" y2="6" />
							<line x1="8" x2="8" y1="2" y2="6" />
							<line x1="3" x2="21" y1="10" y2="10" />
						</svg>
					</div>
					<h2 class="font-playfair text-lg font-semibold text-slate-900">Reservations</h2>
					<p class="mt-1 text-sm text-slate-500">Manage bookings</p>
				</a>
			</div>

			<!-- Quick Stats -->
			<div class="mt-12 grid gap-6 sm:grid-cols-3" in:fly={{ y: 20, duration: 400, delay: 500 }}>
				<div class="rounded-2xl bg-white p-6 shadow-md">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 text-amber-600"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
							</svg>
						</div>
						<div>
							<p class="text-sm text-slate-500">Today's Revenue</p>
							<p class="text-xl font-bold text-slate-900">
								₦{(stats.todayRevenue ?? 0).toLocaleString()}
							</p>
						</div>
					</div>
				</div>

				<div class="rounded-2xl bg-white p-6 shadow-md">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 text-emerald-600"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
								<polyline points="22 4 12 14.01 9 11.01" />
							</svg>
						</div>
						<div>
							<p class="text-sm text-slate-500">Completed Orders</p>
							<p class="text-xl font-bold text-slate-900">{stats.completedOrdersCount ?? 0}</p>
						</div>
					</div>
				</div>

				<div class="rounded-2xl bg-white p-6 shadow-md">
					<div class="flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 text-blue-600"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
						</div>
						<div>
							<p class="text-sm text-slate-500">Pending Orders</p>
							<p class="text-xl font-bold text-slate-900">{stats.pendingOrdersCount ?? 0}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>

<div class="bottom-0 z-2">
	<Footer restaurant={$page.data.restaurant} />
</div>
