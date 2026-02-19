<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/stores';

	let { data } = $props();
	let user = $derived($page.data.user);
	let isSuper = $derived(data.isSuper ?? false);

	// Calculate total favorites
	const totalFavorites = $derived(
		data.restaurants.length + (isSuper ? data.dishFavorites?.length || 0 : 0)
	);
</script>

<svelte:head>
	<title>Saved Favorites - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Hero Section - Matches pending/about pages -->
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
			<div class="mx-auto max-w-2xl">
				<div class="mb-4 flex justify-center">
					<div
						class="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-7 w-7"
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
					class="font-playfair mb-3 text-3xl font-bold md:text-4xl"
					in:fly={{ y: 20, duration: 500 }}
				>
					Your Saved Collection
				</h1>
				<p class="text-base font-medium text-slate-300" in:fade={{ duration: 500, delay: 150 }}>
					Everything you love, in one place
				</p>
				{#if totalFavorites > 0}
					<div
						class="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm"
						in:fade={{ duration: 500, delay: 300 }}
					>
						<span class="text-sm">
							{totalFavorites} item{totalFavorites !== 1 ? 's' : ''} saved
						</span>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Content -->
	<section class="container mx-auto px-4 py-10">
		<!-- Restaurant Favorites Section -->
		{#if data.restaurants.length > 0}
			<div class="mb-12">
				<div class="mb-6 flex items-center justify-between">
					<h2 class="font-playfair text-2xl font-bold text-slate-900">Saved Restaurants</h2>
					<span class="text-sm text-slate-500">{data.restaurants.length} saved</span>
				</div>

				<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{#each data.restaurants as r, i}
						<article
							class="group relative flex flex-col rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
							in:fly={{ y: 20, duration: 400, delay: i * 50 }}
						>
							<!-- Header -->
							<div class="mb-4 flex items-start gap-3">
								<div class="shrink-0">
									<img
										src={r.faviconUrl || r.logoUrl}
										alt={r.name}
										class="h-14 w-14 rounded-xl border border-slate-100 object-contain shadow-sm"
									/>
								</div>
								<div class="min-w-0 flex-1">
									<h3 class="font-playfair truncate text-lg font-semibold text-slate-900">
										{r.name}
									</h3>
									{#if r.motto}
										<p class="mt-0.5 truncate text-sm text-slate-500">{r.motto}</p>
									{/if}
								</div>
							</div>

							<!-- Description -->
							{#if r.description}
								<p class="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
									{r.description}
								</p>
							{/if}

							<!-- Address -->
							{#if r.restaurantAddress}
								<div class="mb-4 flex items-start gap-2 text-sm text-slate-500">
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

							<!-- CTA -->
							<div class="mt-auto pt-2">
								<a
									href="/?restaurant={r.id}"
									class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
								>
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
									View Menu
								</a>
							</div>
						</article>
					{/each}
				</div>

				<!-- Add New Restaurant Button - Super restaurants only -->
				{#if isSuper}
					<div class="mt-8 text-center">
						<a
							href="/restaurants"
							class="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-6 py-3 text-sm font-medium text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="16" />
								<line x1="8" y1="12" x2="16" y2="12" />
							</svg>
							Add New Restaurant
						</a>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Dish Favorites Section - All restaurants can save dishes -->
		{#if data.dishFavorites && data.dishFavorites.length > 0}
			<div class={data.restaurants.length > 0 ? 'border-t border-slate-200 pt-10' : ''}>
				<div class="mb-6 flex items-center justify-between">
					<h2 class="font-playfair text-2xl font-bold text-slate-900">Saved Dishes</h2>
					<span class="text-sm text-slate-500">{data.dishFavorites.length} saved</span>
				</div>

				<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{#each data.dishFavorites as dish, i}
						<article
							class="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
							in:fly={{ y: 20, duration: 400, delay: i * 50 }}
						>
							<!-- Image -->
							<div class="relative h-44 overflow-hidden">
								<img
									src={dish.image}
									alt={dish.name}
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
								/>
								<!-- Gradient Overlay -->
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
								></div>

								<!-- Restaurant Tag - Only for super restaurants -->
								{#if isSuper}
									<div class="absolute top-2.5 left-2.5">
										<span
											class="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-3 w-3"
												viewBox="0 0 24 24"
												fill="currentColor"
											>
												<path
													d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
												/>
											</svg>
											{dish.restaurantName || 'Unknown Restaurant'}
										</span>
									</div>
								{/if}

								<!-- Discount Badge -->
								{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
									<div class="absolute top-2.5 right-2.5">
										<span
											class="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-md"
										>
											-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
										</span>
									</div>
								{/if}
							</div>

							<!-- Content -->
							<div class="flex flex-1 flex-col p-4">
								<h3 class="font-playfair mb-1 text-base font-semibold text-slate-900">
									{dish.name}
								</h3>
								<p class="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
									{dish.description}
								</p>

								<div class="mt-auto flex items-center justify-between">
									<div class="flex items-baseline gap-2">
										{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
											<span class="text-lg font-bold text-amber-600">
												₦{Number(dish.promoAmount).toLocaleString()}
											</span>
											<span class="text-xs text-slate-400 line-through">
												₦{Number(dish.defaultAmount).toLocaleString()}
											</span>
										{:else}
											<span class="text-lg font-bold text-slate-900">
												₦{Number(dish.defaultAmount).toLocaleString()}
											</span>
										{/if}
									</div>
									<a
										href="/?restaurant={dish.restaurantId}"
										class="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-sm font-medium text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700"
									>
										Order
									</a>
								</div>
							</div>
						</article>
					{/each}
				</div>

				<!-- Add New Dishes Button - Available to all restaurants -->
				<div class="mt-8 text-center">
					<a
						href="/"
						class="inline-flex items-center gap-2 rounded-xl border-2 border-amber-500 bg-white px-6 py-3 text-sm font-medium text-amber-600 transition-all hover:bg-amber-500 hover:text-white"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="16" />
							<line x1="8" y1="12" x2="16" y2="12" />
						</svg>
						Add New Dishes
					</a>
				</div>
			</div>
		{/if}

		<!-- Empty State -->
		{#if data.restaurants.length === 0 && (!data.dishFavorites || data.dishFavorites.length === 0)}
			<div class="mx-auto max-w-md py-16 text-center" in:fade>
				<div class="mb-6 flex justify-center">
					<div class="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-10 text-slate-300"
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
				<h2 class="font-playfair mb-2 text-xl font-semibold text-slate-900">No Saved Items</h2>
				<p class="mb-6 text-sm text-slate-500">
					{isSuper
						? 'Start saving restaurants and dishes you love'
						: 'Save dishes you love for quick access'}
				</p>
				<div class="flex flex-col items-center gap-3">
					{#if isSuper}
						<a
							href="/restaurants"
							class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="11" cy="11" r="8" />
								<path d="m21 21-4.3-4.3" />
							</svg>
							Discover Restaurants
						</a>
					{/if}
					<a
						href="/"
						class="inline-flex items-center gap-2 rounded-xl border-2 border-amber-500 px-6 py-2.5 text-sm font-medium text-amber-600 transition-all hover:bg-amber-500 hover:text-white"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
							<polyline points="9 22 9 12 15 12 15 22" />
						</svg>
						Browse Menu
					</a>
				</div>
			</div>
		{/if}
	</section>

	<!-- Footer Note -->
	<footer class="border-t border-slate-200 bg-white py-6 text-center">
		<p class="text-xs text-slate-400">Your favorites are synced across devices</p>
	</footer>
</div>
