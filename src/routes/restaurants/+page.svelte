<script lang="ts">
	import { onMount } from 'svelte';

	let restaurants: any[] = $state([]);
	let filteredRestaurants: any[] = $state([]);
	let searchInput = $state('');
	let hasSearched = $state(false);

	onMount(async () => {
		try {
			const res = await fetch(
				'https://playgzero.pb.itcass.net/api/collections/restaurants/records'
			);
			const data = await res.json();
			restaurants = data.items.filter((r) => r.name !== 'ProxifeastLocal');
			filteredRestaurants = restaurants;
		} catch (err) {
			console.error('Failed to fetch restaurants:', err);
		}
	});

	function handleSearchSubmit(e: Event) {
		e.preventDefault();

		if (!searchInput.trim()) {
			filteredRestaurants = restaurants;
			hasSearched = false;
			return;
		}

		const query = searchInput.toLowerCase();
		filteredRestaurants = restaurants.filter(
			(r) =>
				r.name.toLowerCase().includes(query) || r.restaurantAddress?.toLowerCase().includes(query)
		);

		hasSearched = true;
	}

	function clearSearch() {
		searchInput = '';
		filteredRestaurants = restaurants;
		hasSearched = false;
	}
</script>

<div class="min-h-screen bg-gray-50 px-6 py-12 md:px-12">
	<h1 class="mb-10 text-center text-3xl font-bold md:text-4xl">
		🍽 Featured Restaurants on <span class="text-yellow-500">Proxifeast</span>
	</h1>

	<form on:submit={handleSearchSubmit} class="gap-2 sm:flex">
		<div class="mx-auto items-center justify-center gap-2 p-2 sm:flex">
			<div class="flex gap-2 px-2">
				<input
					type="text"
					name="search"
					placeholder="Search restaurants..."
					bind:value={searchInput}
					class="input input-bordered border-secondary focus:ring-secondary w-full max-w-xs border focus:ring-2 focus:outline-none md:w-[400px]"
				/>

				{#if hasSearched}
					<button type="button" on:click={clearSearch} class="btn btn-secondary"> Cancel </button>
				{:else if searchInput.length > 0}
					<button type="submit" class="btn btn-secondary">Search</button>
				{/if}
			</div>
		</div>
	</form>

	<!-- Restaurants Grid OR Not Found -->
	{#if hasSearched && filteredRestaurants.length === 0}
		<p class="mt-10 text-center text-lg font-medium text-gray-500">
			❌ No restaurants found matching "<span class="text-yellow-600">{searchInput}</span>"
		</p>
	{:else}
		{#if hasSearched && filteredRestaurants.length >= 1}
			<h3>Showing results for <span class="text-gray-500">'{searchInput}'</span></h3>
		{/if}
		<div class="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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

					<div class="mb-6 text-sm text-gray-500">📍 {r.restaurantAddress}</div>

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
	{/if}
</div>
