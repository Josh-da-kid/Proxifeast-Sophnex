<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let restaurants: any[] = $state([]);
	let filteredRestaurants: any[] = $state([]);
	let searchInput = $state('');
	let hasSearched = $state(false);
	let isLoading = $state(true);

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
		} finally {
			isLoading = false;
		}
	});

	function handleSearch(e: Event) {
		e.preventDefault();
		hasSearched = true;

		if (!searchInput.trim()) {
			filteredRestaurants = restaurants;
			hasSearched = false;
			return;
		}

		const query = searchInput.toLowerCase();
		filteredRestaurants = restaurants.filter(
			(r) =>
				r.name.toLowerCase().includes(query) ||
				r.restaurantAddress?.toLowerCase().includes(query) ||
				r.motto?.toLowerCase().includes(query)
		);
	}

	function clearSearch() {
		searchInput = '';
		filteredRestaurants = restaurants;
		hasSearched = false;
	}
</script>

<svelte:head>
	<title>Restaurants - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-stone-50">
	<!-- Hero Section -->
	<section
		class="bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 py-16 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<div class="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
					<path d="M7 2v20" />
					<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
				</svg>
				Proxifeast
			</div>
			<h1 class="font-playfair mb-4 text-4xl font-bold md:text-5xl">Discover Fine Dining</h1>
			<p class="mx-auto max-w-2xl text-lg text-white/80">
				Explore our curated selection of exceptional restaurants, each offering unique culinary
				experiences
			</p>
			<div class="mt-6 text-sm text-white/60">
				{restaurants.length} restaurants available
			</div>
		</div>
	</section>

	<!-- Search Section -->
	<section class="relative -mt-8 px-4">
		<div class="mx-auto max-w-2xl">
			<form
				onsubmit={handleSearch}
				class="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-xl shadow-amber-900/10"
			>
				<div class="flex items-center pl-3">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-gray-400"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3" />
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchInput}
					placeholder="Search by name, cuisine, or location..."
					class="flex-1 bg-transparent py-3 text-gray-700 placeholder-gray-400 focus:outline-none"
				/>
				{#if searchInput}
					<button
						type="button"
						onclick={clearSearch}
						class="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
					>
						Clear
					</button>
				{:else}
					<button
						type="submit"
						class="rounded-xl bg-amber-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
					>
						Search
					</button>
				{/if}
			</form>
		</div>
	</section>

	<!-- Results Info -->
	<section class="container mx-auto px-4 py-8">
		{#if hasSearched}
			<div class="mb-6 text-center" in:fade>
				{#if filteredRestaurants.length > 0}
					<p class="text-gray-600">
						Found <span class="font-semibold text-amber-700">{filteredRestaurants.length}</span>
						restaurant{filteredRestaurants.length !== 1 ? 's' : ''} matching "<span
							class="font-medium">{searchInput}</span
						>"
					</p>
				{:else}
					<p class="text-gray-500">
						No restaurants found for "<span class="font-medium">{searchInput}</span>"
					</p>
				{/if}
			</div>
		{/if}

		<!-- Loading State -->
		{#if isLoading}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(6) as _}
					<div class="animate-pulse rounded-2xl bg-white p-6 shadow-md">
						<div class="mb-4 flex items-center gap-4">
							<div class="h-16 w-16 rounded-xl bg-gray-200"></div>
							<div class="flex-1">
								<div class="mb-2 h-5 w-3/4 rounded bg-gray-200"></div>
								<div class="h-4 w-1/2 rounded bg-gray-200"></div>
							</div>
						</div>
						<div class="mb-4 h-16 w-full rounded bg-gray-200"></div>
						<div class="h-4 w-full rounded bg-gray-200"></div>
					</div>
				{/each}
			</div>
		{:else if filteredRestaurants.length === 0 && !hasSearched}
			<!-- Empty state when no restaurants -->
			<div class="py-16 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-gray-300"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
					<path d="M7 2v20" />
					<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-700">No Restaurants Available</h3>
				<p class="mt-1 text-gray-500">Please check back later</p>
			</div>
		{:else}
			<!-- Restaurant Grid -->
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredRestaurants as r, i}
					<article
						class="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/5"
						in:fly={{ y: 20, duration: 300, delay: i * 50 }}
					>
						<!-- Header -->
						<div class="mb-5 flex items-start gap-4">
							<div class="shrink-0">
								<img
									src={r.faviconUrl || r.logoUrl}
									alt={r.name}
									class="h-16 w-16 rounded-xl border border-gray-100 object-contain shadow-sm"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<h2 class="font-playfair truncate text-xl font-semibold text-gray-900">
									{r.name}
								</h2>
								{#if r.motto}
									<p class="mt-0.5 truncate text-sm text-amber-600">{r.motto}</p>
								{/if}
							</div>
						</div>

						<!-- Description -->
						{#if r.description}
							<p class="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">
								{r.description}
							</p>
						{/if}

						<!-- Address -->
						{#if r.restaurantAddress}
							<div class="mb-5 flex items-start gap-2 text-sm text-gray-500">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mt-0.5 h-4 w-4 shrink-0"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
								<span class="line-clamp-2">{r.restaurantAddress}</span>
							</div>
						{/if}

						<!-- Spacer -->
						<div class="mt-auto pt-2">
							<a
								href={`https://${r.domain}/#menu`}
								target="_blank"
								rel="noopener noreferrer"
								class="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-600 px-4 py-3 text-sm font-medium text-amber-600 transition-all duration-200 hover:bg-amber-600 hover:text-white"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
									<polyline points="10 17 15 12 10 7" />
									<line x1="15" x2="3" y1="12" y2="12" />
								</svg>
								View Menu
							</a>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Footer Note -->
	<section class="border-t border-gray-200 bg-white py-8 text-center">
		<p class="text-sm text-gray-500">
			Powered by <span class="font-medium text-amber-700">Proxifeast</span> • Quality Dining Experience
		</p>
	</section>
</div>
