<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/stores';

	let { data } = $props();
	let user = $derived($page.data.user);
</script>

<svelte:head>
	<title>My Favorites - Proxifeast</title>
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
				<div class="mb-4 flex justify-center">
					<div class="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-8 w-8 text-red-400"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
							/>
						</svg>
					</div>
				</div>
				<h1
					class="font-playfair mb-4 text-4xl font-bold md:text-5xl"
					in:fly={{ y: 30, duration: 600 }}
				>
					Your Favorite Restaurants
				</h1>
				<p class="text-lg font-medium text-slate-300" in:fade={{ duration: 600, delay: 200 }}>
					Quick access to your saved dining destinations
				</p>
				<div class="mt-4 text-sm text-slate-400" in:fade={{ duration: 600, delay: 300 }}>
					{data.restaurants.length} favorite{data.restaurants.length !== 1 ? 's' : ''} saved
				</div>
			</div>
		</div>
	</section>

	<!-- Content -->
	<section class="container mx-auto px-4 py-12">
		{#if data.restaurants.length === 0}
			<!-- Empty State -->
			<div class="mx-auto max-w-md py-16 text-center" in:fade>
				<div class="mb-6 flex justify-center">
					<div class="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-12 w-12 text-slate-300"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path
								d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
							/>
						</svg>
					</div>
				</div>
				<h2 class="font-playfair mb-3 text-2xl font-semibold text-slate-900">No Favorites Yet</h2>
				<p class="mb-8 text-slate-500">
					Start building your collection by adding restaurants to your favorites
				</p>
				<a
					href="/restaurants"
					class="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-8 py-3 font-medium text-white transition-all hover:bg-slate-700 hover:shadow-lg"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3" />
					</svg>
					Explore Restaurants
				</a>
			</div>
		{:else}
			<!-- Favorites Grid -->
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each data.restaurants as r, i}
					<article
						class="group relative flex flex-col rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
						in:fly={{ y: 20, duration: 300, delay: i * 50 }}
					>
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
							<p class="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
								{r.description}
							</p>
						{/if}

						<!-- Address -->
						{#if r.restaurantAddress}
							<div class="mb-5 flex items-start gap-2 text-sm text-slate-500">
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
							<button
								onclick={() => (window.location.href = `/?restaurant=${r.id}`)}
								class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-800 transition-all hover:bg-slate-800 hover:text-white"
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
								Order Now
							</button>
						</div>
					</article>
				{/each}
			</div>

			<!-- CTA to add more -->
			<div class="mt-12 text-center">
				<a
					href="/restaurants"
					class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" x2="12" y1="5" y2="19" />
						<line x1="5" x2="19" y1="12" y2="12" />
					</svg>
					Add more favorites
				</a>
			</div>
		{/if}
	</section>

	<!-- Footer Note -->
	<section class="border-t border-slate-200 bg-white py-8 text-center">
		<p class="text-sm text-slate-500">
			Powered by <span class="font-medium text-slate-700">Proxifeast</span> • Quality Dining Experience
		</p>
	</section>
</div>
