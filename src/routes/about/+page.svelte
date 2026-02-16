<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';

	const restaurant = get(page).data.restaurant;
</script>

<svelte:head>
	<title>About - {restaurant?.name || 'Proxifeast'}</title>
</svelte:head>

<div class="min-h-screen bg-stone-50">
	<!-- Hero -->
	<section
		class="relative overflow-hidden bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 py-20 text-center text-white"
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
					About {restaurant?.name || 'Us'}
				</h1>
				<p class="text-lg text-white/80" in:fade={{ duration: 600, delay: 200 }}>
					Celebrating culinary excellence since our inception
				</p>
			</div>
		</div>
	</section>

	<!-- Content -->
	<section class="container mx-auto px-4 py-16">
		<div class="mx-auto max-w-4xl">
			<!-- Story Card -->
			<article
				class="mb-12 rounded-2xl bg-white p-8 shadow-lg md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 300 }}
			>
				<div class="mb-6 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-amber-600"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 2L2 7l10 5 10-5-10-5z" />
							<path d="M2 17l10 5 10-5" />
							<path d="M2 12l10 5 10-5" />
						</svg>
					</div>
					<h2 class="font-playfair text-2xl font-semibold text-gray-900">Our Story</h2>
				</div>
				<p class="leading-relaxed text-gray-600">
					At {restaurant?.name || 'our restaurant'}, we celebrate the rich tapestry of Nigerian
					culinary heritage with a modern twist. Our journey began with a simple mission: to bring
					authentic flavors to our community while innovation in every dish we prepare.
				</p>
				<p class="mt-4 leading-relaxed text-gray-600">
					Every dish is crafted from fresh, locally sourced ingredients with passion and care. We
					believe that great food brings people together, and our team works tirelessly to ensure
					every visit is an unforgettable experience filled with tradition, flavor, and warmth.
				</p>
			</article>

			<!-- Values Grid -->
			<div class="grid gap-6 md:grid-cols-3">
				{#each [{ icon: 'heart', title: 'Passion', desc: 'Every dish is made with love and dedication to authentic flavors' }, { icon: 'leaf', title: 'Fresh Ingredients', desc: 'We source the finest local ingredients for our menu' }, { icon: 'users', title: 'Community', desc: 'Building lasting relationships through exceptional dining' }] as value, i}
					<article
						class="rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
						in:fly={{ y: 30, duration: 400, delay: 400 + i * 100 }}
					>
						<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
							{#if value.icon === 'heart'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-amber-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
									/>
								</svg>
							{:else if value.icon === 'leaf'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-amber-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
									/>
									<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-amber-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
									<circle cx="9" cy="7" r="4" />
									<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
									<path d="M16 3.13a4 4 0 0 1 0 7.75" />
								</svg>
							{/if}
						</div>
						<h3 class="font-playfair mb-2 text-lg font-semibold text-gray-900">{value.title}</h3>
						<p class="text-sm text-gray-600">{value.desc}</p>
					</article>
				{/each}
			</div>

			<!-- CTA -->
			<article
				class="mt-12 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-600 p-8 text-center text-white md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 700 }}
			>
				<h2 class="font-playfair mb-3 text-2xl font-bold">Visit Us Today</h2>
				<p class="mb-6 text-white/90">
					Experience the warmth of Nigerian hospitality and culinary excellence
				</p>
				<a
					href="/#menu"
					class="inline-block rounded-xl bg-white px-8 py-3 font-medium text-amber-700 transition-all hover:bg-gray-100"
				>
					View Our Menu
				</a>
			</article>
		</div>
	</section>
</div>
