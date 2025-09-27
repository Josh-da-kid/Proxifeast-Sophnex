<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';

	let restaurants: any[] = $state([]);
	let filteredRestaurants: any[] = $state([]);
	let searchInput = $state('');

	const searchSubmitted = derived(page, ($page) => {
		return ($page.url.searchParams.get('search')?.trim() ?? '') !== '';
	});

	onMount(async () => {
		try {
			const res = await fetch(
				'https://playgzero.pb.itcass.net/api/collections/restaurants/records'
			);
			const data = await res.json();
			restaurants = data.items.filter((r) => r.name !== 'ProxifeastLocal');
			filteredRestaurants = restaurants; // default
		} catch (err) {
			console.error('Failed to fetch restaurants:', err);
		}
	});

	function handleSearchSubmit(e: Event) {
		e.preventDefault();

		if (!searchInput.trim()) {
			filteredRestaurants = restaurants; // reset
			return;
		}

		const query = searchInput.toLowerCase();
		filteredRestaurants = restaurants.filter(
			(r) =>
				r.name.toLowerCase().includes(query) || r.restaurantAddress?.toLowerCase().includes(query)
		);
	}

	function clearSearch() {
		searchInput = '';
		filteredRestaurants = restaurants;
	}
</script>

<div class="min-h-screen bg-gray-50 px-6 py-12 md:px-12">
	<h1 class="mb-10 text-center text-3xl font-bold md:text-4xl">
		🍽 Featured Restaurants on <span class="text-yellow-500">Proxifeast</span>
	</h1>

	<form method="GET" onsubmit={handleSearchSubmit} class="gap-2 sm:flex">
		<div class="mx-auto items-center justify-center gap-2 p-2 sm:flex">
			<div class="flex gap-2 px-2">
				<input
					type="text"
					name="search"
					placeholder="Search dishes..."
					bind:value={searchInput}
					class="input input-bordered border-secondary focus:ring-secondary w-full max-w-xs border focus:ring-2 focus:outline-none md:w-[400px]"
				/>

				{#if searchInput.trim() && $searchSubmitted}
					<!-- svelte-ignore a11y_consider_explicit_label -->

					<button type="button" onclick={clearSearch} class="btn btn-secondary">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
							<path
								fill="none"
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243"
							/>
						</svg>
					</button>
				{/if}
				{#if searchInput.length > 0 && !$searchSubmitted}
					<button type="submit" class="btn btn-secondary">Search</button>
				{/if}
			</div>
		</div>
	</form>

	<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
		{#each filteredRestaurants as r}
			<div class="flex flex-col rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
				<div class="mb-4 flex items-center space-x-4">
					<img
						src={r.faviconUrl || r.logoUrl}
						alt={r.name}
						class="h-16 w-16 rounded-full border object-contain"
					/>
					<div>
						<h2 class="text-xl font-semibold">{r.name}</h2>
						<p class="text-sm text-gray-500">{r.motto}</p>
					</div>
				</div>

				<p class="mb-4 line-clamp-3 text-gray-600">{r.description}</p>

				<div class="mb-6 text-sm text-gray-500">
					📍 {r.restaurantAddress}
				</div>

				<a
					href={`https://${r.domain}/#menu`}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-auto inline-block rounded-lg bg-yellow-500 px-4 py-2 text-center font-medium text-white transition hover:bg-yellow-600"
				>
					Visit & Order
				</a>
			</div>
		{/each}
	</div>
</div>
