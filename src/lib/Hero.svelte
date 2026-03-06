<script lang="ts">
	import { page } from '$app/stores';

	let { restaurant, showSearch = true } = $props();

	const restaurantData = $derived(restaurant ?? $page.data.restaurant);
	const isSuper = $derived($page.data.isSuper ?? false);

	let searchQuery = $state('');
	let isSearching = $state(false);

	function handleSearch(e: Event) {
		e.preventDefault();
		if (!searchQuery.trim()) return;

		isSearching = true;
		// Navigate to restaurants page with search query
		window.location.href = `/stores?q=${encodeURIComponent(searchQuery)}`;
	}

	const features = [
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
			title: 'Easy Ordering',
			description: 'Order from your phone in seconds'
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
			title: 'Real-time Updates',
			description: 'Track your order status live'
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
			title: '24/7 Support',
			description: "We're here to help anytime"
		}
	];
</script>

<!-- Hero Section -->
<section
	class="relative overflow-hidden bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50"
>
	<!-- Background Pattern -->
	<div class="absolute inset-0 opacity-40">
		<svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
			<defs>
				<pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
					<path
						d="M 10 0 L 0 0 0 10"
						fill="none"
						stroke="currentColor"
						stroke-width="0.3"
						class="text-slate-300"
					/>
				</pattern>
			</defs>
			<rect width="100" height="100" fill="url(#grid)" />
		</svg>
	</div>

	<!-- Decorative Circles -->
	<div class="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl"></div>
	<div class="absolute top-40 -left-20 h-64 w-64 rounded-full bg-teal-200/20 blur-3xl"></div>

	<div class="container-custom relative py-16 md:py-24 lg:py-32">
		<div class="mx-auto max-w-3xl text-center">
			<!-- Badge -->
			<div
				class="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700"
			>
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
				</span>
				{isSuper ? 'Multiple Restaurants' : restaurantData?.name || 'Premium Dining'}
			</div>

			<!-- Headline -->
			<h1
				class="font-heading animate-fade-in-up stagger-1 mb-6 text-4xl leading-tight font-bold text-slate-900 md:text-5xl lg:text-6xl"
			>
				{#if isSuper}
					Order Food from <span class="text-gradient">Your Favorite Restaurants</span>
				{:else}
					{restaurantData?.motto || 'Delicious Food, Delivered Fast'}
				{/if}
			</h1>

			<!-- Subheadline -->
			<p class="animate-fade-in-up stagger-2 mb-8 text-lg text-slate-600 md:text-xl">
				{isSuper
					? 'Discover the best stores in your area and order your favorite dishes with just a few taps.'
					: restaurantData?.description ||
						'Experience the convenience of online ordering. Browse our menu, order, and enjoy!'}
			</p>

			<!-- Search Bar (for super restaurants) -->
			{#if showSearch && isSuper}
				<form onsubmit={handleSearch} class="animate-fade-in-up stagger-3 mx-auto mb-10 max-w-xl">
					<div class="relative">
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search for stores or dishes..."
							class="input-custom w-full !rounded-full !py-4 pr-14 text-base"
						/>
						<button
							type="submit"
							disabled={isSearching}
							class="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-amber-500 p-3 text-white transition-all hover:bg-amber-600 disabled:opacity-50"
						>
							{#if isSearching}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="11" cy="11" r="8" />
									<path d="m21 21-4.3-4.3" />
								</svg>
							{/if}
						</button>
					</div>
				</form>
			{/if}

			<!-- CTA Buttons -->
			<div class="animate-fade-in-up stagger-4 flex flex-col gap-4 sm:flex-row sm:justify-center">
				<a
					href={isSuper ? '/stores' : '/?restaurant=' + (restaurantData?.id || '')}
					class="btn-primary-custom !px-8 !py-4 text-lg"
				>
					{isSuper ? 'Browse Stores' : 'View Menu'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="ml-2"
					>
						<path d="M5 12h14" />
						<path d="m12 5 7 7-7 7" />
					</svg>
				</a>
				<a href="/about" class="btn-outline-custom !px-8 !py-4 text-lg"> Learn More </a>
			</div>
		</div>
	</div>

	<!-- Features Strip -->
	<div class="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
		<div class="container-custom py-6">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				{#each features as feature}
					<div class="flex items-center gap-4">
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600"
						>
							{@html feature.icon}
						</div>
						<div>
							<h3 class="font-semibold text-slate-900">{feature.title}</h3>
							<p class="text-sm text-slate-500">{feature.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.font-heading {
		font-family: 'Plus Jakarta Sans', sans-serif;
	}

	.text-gradient {
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		background-image: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in-up {
		animation: fadeInUp 0.6s ease-out forwards;
		opacity: 0;
	}

	.stagger-1 {
		animation-delay: 0.1s;
	}
	.stagger-2 {
		animation-delay: 0.2s;
	}
	.stagger-3 {
		animation-delay: 0.3s;
	}
	.stagger-4 {
		animation-delay: 0.4s;
	}

	.input-custom {
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid #e2e8f0;
		padding: 0.75rem 1rem;
		background-color: white;
		color: #334155;
		transition: all 0.2s;
	}

	.input-custom::placeholder {
		color: #94a3b8;
	}

	.input-custom:focus {
		border-color: #f59e0b;
		outline: none;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
	}
</style>
