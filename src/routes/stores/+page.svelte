<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import Carousel from '$lib/Carousel.svelte';
	import pb from '$lib/pb';

	let { data } = $props();

	let restaurants: any[] = $state([]);
	let filteredRestaurants: any[] = $state([]);
	let searchInput = $state('');
	let hasSearched = $state(false);
	let isLoading = $state(true);
	let favorites: string[] = $state([]);
	let user = $derived($page.data.user);
	let togglingFavorite = $state<string | null>(null);
	let activeFilter = $state('all');

	// Current time for reactive updates (updates every second)
	let currentTime = $state(new Date());
	let timeInterval: ReturnType<typeof setInterval>;
	let restaurantSubscription: any;

	const storeTypes = [
		{ id: 'all', name: 'All', icon: '🏪' },
		{ id: 'hotel', name: 'Hotels', icon: '🏨' },
		{ id: 'restaurant', name: 'Restaurants', icon: '🍽️' },
		{ id: 'bar', name: 'Bars', icon: '🍸' },
		{ id: 'cafe', name: 'Cafés', icon: '☕' }
	];

	function normalizeRestaurantType(type: string | null | undefined): string {
		return String(type || '')
			.trim()
			.toLowerCase()
			.replace(/[_\s-]+/g, '');
	}

	function applyFilters() {
		const normalizedFilter = normalizeRestaurantType(activeFilter);
		const normalizedQuery = searchInput.trim().toLowerCase();

		let nextRestaurants = restaurants.filter((restaurant: any) => {
			if (normalizedFilter === 'all') return true;

			const restaurantType = normalizeRestaurantType(restaurant.type);
			return restaurantType === normalizedFilter;
		});

		if (normalizedQuery) {
			nextRestaurants = nextRestaurants.filter(
				(restaurant: any) =>
					restaurant.name?.toLowerCase().includes(normalizedQuery) ||
					restaurant.restaurantAddress?.toLowerCase().includes(normalizedQuery) ||
					restaurant.motto?.toLowerCase().includes(normalizedQuery)
			);
		}

		filteredRestaurants = nextRestaurants;
	}

	function filterByType(type: string) {
		activeFilter = type;
		hasSearched = Boolean(searchInput.trim());
		applyFilters();
	}

	function getStoreTypeMeta(type: string | null | undefined) {
		switch (normalizeRestaurantType(type)) {
			case 'hotel':
				return {
					icon: '🏨',
					label: 'Hotel',
					badge: 'bg-blue-100 text-blue-700'
				};
			case 'bar':
				return {
					icon: '🍸',
					label: 'Bar',
					badge: 'bg-purple-100 text-purple-700'
				};
			case 'cafe':
				return {
					icon: '☕',
					label: 'Cafe',
					badge: 'bg-amber-100 text-amber-700'
				};
			default:
				return {
					icon: '🍽️',
					label: 'Restaurant',
					badge: 'bg-orange-100 text-orange-700'
				};
		}
	}

	onMount(async () => {
		restaurants = (data.restaurants || []).filter((r: any) => r.name !== 'ProxifeastLocal');
		applyFilters();

		// Update current time every second for precise status checks
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		// Subscribe to restaurant changes for real-time updates
		async function subscribeToRestaurants() {
			try {
				restaurantSubscription = await pb.collection('restaurants').subscribe('*', async (e) => {
					if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
						// Refetch restaurants to get updated data
						const restaurantsRes = await fetch(
							'https://playgzero.pb.itcass.net/api/collections/restaurants/records'
						);
						const data = await restaurantsRes.json();
						restaurants = data.items.filter((r: any) => r.name !== 'ProxifeastLocal');
						applyFilters();
						currentTime = new Date();
					}
				});
			} catch (err) {
				console.error('Failed to subscribe to restaurants:', err);
			}
		}

		subscribeToRestaurants();

		try {
			const [restaurantsRes, favoritesRes] = await Promise.all([
				fetch('https://playgzero.pb.itcass.net/api/collections/restaurants/records'),
				user ? fetch('/api/favorites') : Promise.resolve(null)
			]);

			const data = await restaurantsRes.json();
			restaurants = data.items.filter((r: any) => r.name !== 'ProxifeastLocal');
			applyFilters();

			if (favoritesRes && favoritesRes.ok) {
				const favData = await favoritesRes.json();
				favorites = favData.favorites || [];
			}
		} catch (err) {
			console.error('Failed to fetch restaurants:', err);
		} finally {
			isLoading = false;
		}

		return () => {
			if (timeInterval) clearInterval(timeInterval);
			if (restaurantSubscription) {
				pb.collection('restaurants').unsubscribe('*');
			}
		};
	});

	async function toggleFavorite(restaurantId: string, e: Event) {
		e.stopPropagation();
		if (!user) {
			window.location.href = '/login';
			return;
		}

		togglingFavorite = restaurantId;
		const action = favorites.includes(restaurantId) ? 'remove' : 'add';

		try {
			const res = await fetch('/api/favorites', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ restaurantId, action })
			});

			if (res.ok) {
				const data = await res.json();
				favorites = data.favorites;
			}
		} catch (err) {
			console.error('Failed to toggle favorite:', err);
		} finally {
			togglingFavorite = null;
		}
	}

	function isFavorite(restaurantId: string): boolean {
		return favorites.includes(restaurantId);
	}

	function formatTime(time: string): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		const h = parseInt(hours);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const h12 = h % 12 || 12;
		return `${h12}:${minutes} ${ampm}`;
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		hasSearched = Boolean(searchInput.trim());
		applyFilters();
	}

	function clearSearch() {
		searchInput = '';
		hasSearched = false;
		applyFilters();
	}

	const canSearch = $derived(Boolean(searchInput.trim()));

	function selectRestaurant(r: any) {
		window.location.href = `/stores/${r.id}`;
	}

	function isRestaurantOpen(restaurant: any): boolean {
		if (!restaurant.openingTime || !restaurant.closingTime) return true;

		const now = currentTime;
		const currentMinutes = now.getHours() * 60 + now.getMinutes();

		const [openHour, openMin] = restaurant.openingTime.split(':').map(Number);
		const [closeHour, closeMin] = restaurant.closingTime.split(':').map(Number);

		const openTime = openHour * 60 + openMin;
		const closeTime = closeHour * 60 + closeMin;

		return currentMinutes >= openTime && currentMinutes <= closeTime;
	}

	function isRestaurantNew(restaurant: any): boolean {
		if (!restaurant.created) return false;

		const created = new Date(restaurant.created);
		const now = new Date();
		const diffTime = now.getTime() - created.getTime();
		const diffDays = diffTime / (1000 * 60 * 60 * 24);

		return diffDays <= 7;
	}
</script>

<svelte:head>
	<title>Restaurants - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Hero Section -->
	<section
		class="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-20 text-center text-white"
	>
		<div class="absolute inset-0 opacity-10">
			<svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
				<pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
					<path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5" />
				</pattern>
				<rect width="100" height="100" fill="url(#grid)" />
			</svg>
		</div>
		<div class="relative container mx-auto px-4">
			<div class="mx-auto max-w-3xl">
				<h1
					class="font-playfair mb-4 text-4xl font-bold md:text-5xl"
					in:fly={{ y: 30, duration: 600 }}
				>
					Hospitality — Just a Scan Away
				</h1>
				<p class="text-lg font-medium text-slate-300" in:fade={{ duration: 600, delay: 200 }}>
					Scan. Order. Reserve. Experience.
				</p>
				<p class="mt-2 text-base text-slate-400" in:fade={{ duration: 600, delay: 250 }}>
					Discover stores, bars, cafés, and hotels
				</p>
				<div class="mt-4 text-sm text-slate-400" in:fade={{ duration: 600, delay: 300 }}>
					{restaurants.length} stores available
				</div>
			</div>
		</div>
	</section>

	<!-- Search Section -->
	<section class="relative -mt-8 px-4">
		<div class="mx-auto max-w-2xl">
			<form
				onsubmit={handleSearch}
				class="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-xl sm:flex-row sm:items-center"
			>
				<div class="flex items-center pl-3 sm:pl-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-slate-400"
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
					class="w-full flex-1 bg-transparent py-3 text-slate-700 placeholder-slate-400 focus:outline-none"
				/>
				<div class="flex w-full gap-2 sm:w-auto">
					<button
						type="submit"
						disabled={!canSearch}
						class="flex-1 rounded-xl bg-slate-800 px-6 py-2 text-sm font-medium text-white transition enabled:hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:flex-none"
					>
						Search
					</button>
				{#if canSearch}
					<button
						type="button"
						onclick={clearSearch}
						class="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
					>
						Clear
					</button>
				{/if}
				</div>
			</form>
		</div>
	</section>

	<!-- Store Type Filter -->
	<section class="container mx-auto px-4 py-6">
		<div class="flex flex-wrap justify-center gap-2">
			{#each storeTypes as type}
				<button
					onclick={() => filterByType(type.id)}
					class="rounded-full px-5 py-2 text-sm font-medium transition-all {activeFilter === type.id
						? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
						: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}"
				>
					<span class="mr-1">{type.icon}</span>{type.name}
				</button>
			{/each}
		</div>
	</section>

	<!-- Get Your Store Online CTA -->
	<section class="bg-slate-900 py-12 text-white">
		<div class="container mx-auto px-4 text-center">
			<h2 class="mb-4 text-2xl font-bold">Get Your Store Online!</h2>
			<p class="mx-auto mb-6 max-w-xl text-slate-300">
				Create a digital menu and start managing your business today. Join hundreds of stores using
				Proxifeast.
			</p>
			<div class="flex flex-wrap justify-center gap-4">
				<a
					href="/signup"
					class="rounded-full bg-amber-500 px-8 py-3 font-semibold text-white transition-all hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30"
				>
					Get Started
				</a>
				<a
					href="/setup-pricing"
					class="rounded-full border border-slate-600 px-8 py-3 font-semibold text-white transition-all hover:bg-slate-800"
				>
					View Pricing
				</a>
			</div>
		</div>
	</section>

	<!-- Results Info -->
	<section class="container mx-auto px-4 py-12">
		{#if hasSearched}
			<div class="mb-6 text-center" in:fade>
				{#if filteredRestaurants.length > 0}
					<p class="text-slate-600">
						Found <span class="font-semibold text-slate-800">{filteredRestaurants.length}</span>
						store{filteredRestaurants.length !== 1 ? 's' : ''} matching "<span class="font-medium"
							>{searchInput}</span
						>"
					</p>
				{:else}
					<p class="text-slate-500">
						No stores found for "<span class="font-medium">{searchInput}</span>"
					</p>
				{/if}
			</div>
		{/if}

		<!-- Loading State -->
		{#if isLoading}
			{@const placeholders = [
				{ name: 'Savory Bites', category: 'Fast Food', address: 'Loading location...' },
				{ name: 'Golden Spoon', category: 'African Cuisine', address: 'Loading location...' },
				{ name: 'Taste Haven', category: 'Continental', address: 'Loading location...' },
				{ name: 'Flavor Palace', category: 'Local Dishes', address: 'Loading location...' },
				{ name: "Chef's Corner", category: 'Grill & BBQ', address: 'Loading location...' },
				{ name: 'Meal Magic', category: 'Healthy Food', address: 'Loading location...' }
			]}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each placeholders as placeholder}
					<div class="animate-pulse rounded-2xl bg-white p-6 shadow-md">
						<div class="mb-4 flex items-center gap-4">
							<div class="h-16 w-16 rounded-xl bg-slate-200"></div>
							<div class="flex-1">
								<div class="mb-2 h-6 w-3/4 rounded bg-slate-200"></div>
								<div class="h-4 w-1/2 rounded bg-slate-200"></div>
							</div>
						</div>
						<div class="mb-4 h-16 w-full rounded bg-slate-200"></div>
						<div class="h-4 w-full rounded bg-slate-200"></div>
						<div class="mt-4 flex items-center gap-2">
							<div class="h-3 w-3 rounded-full bg-slate-200"></div>
							<div class="h-3 w-24 rounded bg-slate-200"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if filteredRestaurants.length === 0 && !hasSearched}
			<!-- Empty state when no restaurants -->
			<div class="py-16 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-slate-300"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
					<path d="M7 2v20" />
					<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
				</svg>
				<h3 class="mt-4 text-lg font-medium text-slate-700">No Stores Available</h3>
				<p class="text-slate-500">Please check back later</p>
			</div>
		{:else}
			<Carousel>
				{#each filteredRestaurants as r, i}
					{@const isOpen = isRestaurantOpen(r)}
					{@const isNew = isRestaurantNew(r)}
					{@const typeMeta = getStoreTypeMeta(r.type)}
					<article
						class="group relative flex w-[min(22rem,85vw)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
						in:fly={{ y: 20, duration: 300, delay: i * 50 }}
					>
						<div class="relative aspect-[16/10] overflow-hidden bg-slate-100">
							{#if r.bannerUrl || r.logoUrl || r.faviconUrl}
								<img
									src={r.bannerUrl || r.logoUrl || r.faviconUrl}
									alt={r.name}
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							{:else}
								<div class="flex h-full items-center justify-center text-6xl">{typeMeta.icon}</div>
							{/if}

							<div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent"></div>

						<!-- New Tag -->
						{#if isNew}
							<div class="absolute top-4 right-16 z-10">
								<span
									class="rounded-l-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-md"
								>
									NEW
								</span>
							</div>
						{/if}

						<!-- Open/Closed Tag -->
						<div class="absolute top-4 left-0 z-10">
							<span
								class="rounded-r-full {isOpen
									? 'bg-green-500'
									: 'bg-red-500'} px-3 py-1 text-xs font-bold text-white shadow-md"
							>
								{isOpen ? 'OPEN' : 'CLOSED'}
							</span>
						</div>

						<!-- Favorite Button -->
						<button
							onclick={(e) => toggleFavorite(r.id, e)}
							disabled={togglingFavorite === r.id}
							class="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md transition-all hover:scale-110 hover:bg-white disabled:opacity-50"
							title={user
								? isFavorite(r.id)
									? 'Remove from favorites'
									: 'Add to favorites'
								: 'Sign in to save favorites'}
						>
							{#if togglingFavorite === r.id}
								<svg
									class="h-5 w-5 animate-spin text-slate-400"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{:else if isFavorite(r.id)}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-red-500"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-slate-400 transition-colors group-hover:text-red-400"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
									/>
								</svg>
							{/if}
						</button>

							<div class="absolute right-4 bottom-4 z-10 flex items-center gap-2">
								<span class={`rounded-full px-3 py-1 text-xs font-semibold ${typeMeta.badge}`}>
									{typeMeta.label}
								</span>
							</div>
						</div>

						<div class="flex flex-1 flex-col p-6">
							<!-- Header -->
							<div class="mb-5 flex items-start gap-4">
							<div class="shrink-0">
								<img
									src={r.faviconUrl || r.logoUrl}
									alt={r.name}
									class="h-16 w-16 rounded-xl border border-slate-100 object-contain shadow-sm"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<h2 class="font-playfair truncate text-xl font-semibold text-slate-900">
									{r.name}
								</h2>
								{#if r.motto}
									<p class="mt-0.5 truncate text-sm text-slate-600">{r.motto}</p>
								{/if}
							</div>
						</div>

						<!-- Description -->
						{#if r.description}
							<p class="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
								{r.description}
							</p>
						{/if}

						<!-- Category -->
						{#if r.category}
							<div class="mb-3">
								<span
									class="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
								>
									{r.category}
								</span>
							</div>
						{/if}

						<!-- Location & Hours Grid -->
						<div class="mb-4 grid grid-cols-2 gap-2 text-xs">
							<!-- Location -->
							{#if r.state || r.localGovernment || r.restaurantAddress}
								<div class="flex items-start gap-1.5 text-slate-500">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mt-0.5 h-3.5 w-3.5 shrink-0"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
										<circle cx="12" cy="10" r="3" />
									</svg>
									<span class="line-clamp-1">
										{r.localGovernment ? `${r.localGovernment}, ` : ''}{r.state || ''}
									</span>
								</div>
							{/if}

							<!-- Hours -->
							{#if r.openingTime || r.closingTime}
								<div class="flex items-start gap-1.5 text-slate-500">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mt-0.5 h-3.5 w-3.5 shrink-0"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<circle cx="12" cy="12" r="10" />
										<polyline points="12 6 12 12 16 14" />
									</svg>
									<span class="line-clamp-1">
										{formatTime(r.openingTime)}{r.openingTime && r.closingTime
											? ' - '
											: ''}{formatTime(r.closingTime)}
									</span>
								</div>
							{/if}
						</div>

						<!-- Order Services -->
						{#if r.orderServices}
							{@const os = r.orderServices}
							{#if os.tableService || os.pickup || os.homeDelivery}
								<div class="mb-4 flex flex-wrap gap-1.5">
									{#if os.tableService}
										<span
											class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
										>
											Table
										</span>
									{/if}
									{#if os.pickup}
										<span
											class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
										>
											Pickup
										</span>
									{/if}
									{#if os.homeDelivery}
										<span
											class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
										>
											Delivery
										</span>
									{/if}
								</div>
							{/if}
						{/if}

						<div class="mb-4 grid grid-cols-1 gap-2 text-xs text-slate-500">
							{#if r.restaurantAddress}
								<div class="line-clamp-2 rounded-xl bg-slate-50 px-3 py-2">
									<span class="font-medium text-slate-700">Address:</span> {r.restaurantAddress}
								</div>
							{/if}
							{#if r.minOrderValue || r.serviceFee}
								<div class="rounded-xl bg-slate-50 px-3 py-2">
									{#if r.minOrderValue}
										<span class="font-medium text-slate-700">Min order:</span>
										N{Number(r.minOrderValue).toLocaleString()}
									{/if}
									{#if r.minOrderValue && r.serviceFee}
										<span class="mx-1">.</span>
									{/if}
									{#if r.serviceFee}
										<span class="font-medium text-slate-700">Service fee:</span>
										N{Number(r.serviceFee).toLocaleString()}
									{/if}
								</div>
							{/if}
						</div>

						<div class="mt-auto pt-2">
							<button
								onclick={() => isOpen && selectRestaurant(r)}
								disabled={!isOpen}
								class="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all {isOpen
									? 'border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white'
									: 'cursor-not-allowed border-slate-200 text-slate-400'}"
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
								{isOpen ? 'View Menu' : 'Closed'}
							</button>
						</div>
						</div>
					</article>
				{/each}
			</Carousel>
		{/if}
	</section>

	<!-- Footer Note -->
	<section class="border-t border-slate-200 bg-white py-8 text-center">
		<p class="text-sm text-slate-500">
			Powered by <span class="font-medium text-slate-700">Proxifeast</span> • Quality Dining Experience
		</p>
	</section>
</div>
