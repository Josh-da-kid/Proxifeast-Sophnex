<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly, fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import Carousel from '$lib/Carousel.svelte';
	import pb from '$lib/pb';

	let { data, form } = $props();

	const featuredDishes = $derived(data?.featuredDishes ?? []);
	const allDishes = $derived(data?.allDishes ?? []);
	const restaurant = $derived(data?.restaurant ?? null);

	let showAddModal = $state(false);
	let isProcessing = $state(false);
	let addingDishId = $state<string | null>(null);

	const nonFeaturedDishes = $derived(
		allDishes.filter((d: any) => !featuredDishes.some((f: any) => f.id === d.id))
	);

	function formatPrice(amount: number | undefined): string {
		if (!amount) return '₦0';
		return `₦${Number(amount).toLocaleString()}`;
	}

	function getTodayDate(): string {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		return new Date().toLocaleDateString('en-US', options);
	}

	async function quickAddToFeatured(dishId: string) {
		addingDishId = dishId;
		isProcessing = true;
		try {
			await pb.collection('dishes').update(dishId, { isFeatured: true });
			window.location.reload();
		} catch (err) {
			console.error('Failed to add dish:', err);
		} finally {
			addingDishId = null;
			isProcessing = false;
		}
	}

	async function quickRemoveFromFeatured(dishId: string) {
		isProcessing = true;
		try {
			await pb.collection('dishes').update(dishId, { isFeatured: false });
			// Trigger a page reload to refresh data
			window.location.reload();
		} catch (err) {
			console.error('Failed to remove dish:', err);
		} finally {
			isProcessing = false;
		}
	}
</script>

<svelte:head>
	<title>Today's Menu - {restaurant?.name || 'Proxifeast'} Admin</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Hero Section -->
	<section
		class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 py-12 text-white"
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
			<div class="mx-auto max-w-3xl text-center">
				<div
					class="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
					{getTodayDate()}
				</div>
				<h1
					class="font-heading mb-3 text-3xl font-bold md:text-4xl"
					in:fly={{ y: 20, duration: 500 }}
				>
					Today's Special Menu
				</h1>
				<p class="text-lg text-slate-300" in:fade={{ delay: 200, duration: 500 }}>
					Manage your restaurant's featured dishes for today
				</p>
				<div
					class="mt-6 flex flex-wrap items-center justify-center gap-4"
					in:fly={{ y: 20, delay: 300, duration: 500 }}
				>
					<div
						class="flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-2 text-sm font-medium"
					>
						<span class="flex h-2 w-2 animate-pulse rounded-full bg-orange-400"></span>
						{featuredDishes.length} Featured Dishes
					</div>
					<div class="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
						{allDishes.length} Total Dishes
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content -->
	<section class="container mx-auto px-4 py-8">
		<!-- Featured Dishes -->
		<div class="mb-10">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h2 class="font-heading text-2xl font-bold text-slate-900">Featured for Today</h2>
					<p class="text-slate-500">
						These dishes are displayed as today's specials on the homepage
					</p>
				</div>
				{#if nonFeaturedDishes.length > 0}
					<button
						onclick={() => (showAddModal = true)}
						class="btn flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Add Dish
					</button>
				{/if}
			</div>

			{#if featuredDishes.length === 0}
				<div class="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-8 w-8 text-slate-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 2v20M2 12h20" />
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-semibold text-slate-700">No Featured Dishes Yet</h3>
					<p class="mb-4 text-slate-500">
						Add dishes to today's special menu to attract more customers
					</p>
					{#if allDishes.length > 0}
						<button
							onclick={() => (showAddModal = true)}
							class="btn rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
						>
							Add Your First Dish
						</button>
					{:else}
						<a
							href="/admin/admin-menu"
							class="btn rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
						>
							Create Your First Dish
						</a>
					{/if}
				</div>
			{:else}
				<Carousel showArrows={true} showDots={true} autoplay={false}>
					{#each featuredDishes as dish (dish.id)}
						<div class="w-72 shrink-0 px-2">
							<div
								class="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-lg"
							>
								<!-- Image -->
								<div class="relative h-56 overflow-hidden">
									<img
										src={dish.image ||
											'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
										alt={dish.name}
										class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
									/>
									<div
										class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
									></div>

									<!-- Badges -->
									<div class="absolute top-3 left-3">
										<span
											class="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="10"
												height="10"
												viewBox="0 0 24 24"
												fill="currentColor"
											>
												<polygon
													points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
												/>
											</svg>
											Featured
										</span>
									</div>

									{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
										<div class="absolute top-3 right-3">
											<span class="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
												{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
											</span>
										</div>
									{/if}

									<div class="absolute bottom-3 left-3">
										<span
											class="rounded-full {dish.availability === 'Available'
												? 'bg-green-500'
												: 'bg-red-500'} px-2 py-1 text-xs font-medium text-white"
										>
											{dish.availability === 'Available' ? 'Available' : 'Unavailable'}
										</span>
									</div>
								</div>

								<!-- Content -->
								<div class="p-4">
									<h3 class="font-heading mb-1 truncate text-base font-semibold text-slate-900">
										{dish.name}
									</h3>
									<p class="mb-3 line-clamp-2 text-xs text-slate-500">
										{dish.description || 'No description'}
									</p>

									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
												<span class="text-base font-bold text-orange-600">
													{formatPrice(dish.promoAmount)}
												</span>
												<span class="text-xs text-slate-400 line-through">
													{formatPrice(dish.defaultAmount)}
												</span>
											{:else}
												<span class="text-base font-bold text-slate-900">
													{formatPrice(dish.defaultAmount)}
												</span>
											{/if}
										</div>

										<button
											type="button"
											disabled={isProcessing}
											onclick={() => quickRemoveFromFeatured(dish.id)}
											class="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
										>
											Remove
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</Carousel>
			{/if}
		</div>

		<!-- Available Dishes to Add -->
		{#if nonFeaturedDishes.length > 0}
			<div>
				<div class="mb-6">
					<h2 class="font-heading text-xl font-bold text-slate-900">Add to Today's Menu</h2>
					<p class="text-slate-500">Select dishes from your menu to feature today</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each nonFeaturedDishes as dish (dish.id)}
						<div
							class="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
						>
							<img
								src={dish.image ||
									'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
								alt={dish.name}
								class="h-16 w-16 shrink-0 rounded-lg object-cover"
							/>
							<div class="min-w-0 flex-1">
								<h4 class="truncate font-medium text-slate-900">{dish.name}</h4>
								<p class="truncate text-sm text-slate-500">{formatPrice(dish.defaultAmount)}</p>
							</div>
							<form
								method="POST"
								action="?/addToFeatured"
								use:enhance={() => {
									isProcessing = true;
									return async ({ update }) => {
										await update();
										isProcessing = false;
									};
								}}
							>
								<input type="hidden" name="dishId" value={dish.id} />
								<button
									type="submit"
									disabled={isProcessing}
									class="rounded-lg bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-orange-100 hover:text-orange-600"
									title="Add to featured"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<line x1="12" y1="5" x2="12" y2="19" />
										<line x1="5" y1="12" x2="19" y2="12" />
									</svg>
								</button>
							</form>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<!-- Add Dish Modal -->
	{#if showAddModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
			onclick={() => (showAddModal = false)}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div
				class="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
				onclick={(e) => e.stopPropagation()}
				in:fly={{ y: 20, duration: 300 }}
			>
				<!-- Modal Header -->
				<div
					class="relative border-b border-slate-100 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							{#if addingDishId}
								<div
									class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
							{/if}
							<div>
								<h3 id="modal-title" class="font-heading text-xl font-bold text-white">
									Add to Today's Menu
								</h3>
								<p class="mt-1 text-sm text-white/80">Select dishes to feature on your homepage</p>
							</div>
						</div>
						<button
							onclick={() => (showAddModal = false)}
							class="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Modal Content -->
				<div class="max-h-[60vh] overflow-y-auto p-6">
					{#if nonFeaturedDishes.length === 0}
						<div class="py-12 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-8 w-8 text-green-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
									<polyline points="22 4 12 14.01 9 11.01" />
								</svg>
							</div>
							<h4 class="text-lg font-semibold text-slate-800">All Dishes Featured!</h4>
							<p class="mt-1 text-slate-500">Every dish is already on today's menu</p>
						</div>
					{:else}
						<div class="grid gap-4 sm:grid-cols-2">
							{#each nonFeaturedDishes as dish (dish.id)}
								<button
									type="button"
									disabled={addingDishId === dish.id}
									onclick={() => quickAddToFeatured(dish.id)}
									class="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-all hover:border-orange-300 hover:shadow-lg disabled:opacity-50"
								>
									{#if addingDishId === dish.id}
										<div class="absolute inset-0 flex items-center justify-center bg-white/80">
											<div
												class="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"
											></div>
										</div>
									{/if}
									<!-- Image -->
									<div class="relative h-32 overflow-hidden">
										<img
											src={dish.image ||
												'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'}
											alt={dish.name}
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
										/>
										<div
											class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
										></div>

										<!-- Price Badge -->
										<div class="absolute right-2 bottom-2">
											<span
												class="rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-orange-600 shadow"
											>
												{formatPrice(dish.defaultAmount)}
											</span>
										</div>

										<!-- Add Icon Overlay -->
										<div
											class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
										>
											<span
												class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="20"
													height="20"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<line x1="12" y1="5" x2="12" y2="19" />
													<line x1="5" y1="12" x2="19" y2="12" />
												</svg>
											</span>
										</div>
									</div>

									<!-- Content -->
									<div class="p-3">
										<h4 class="font-heading truncate font-semibold text-slate-900">{dish.name}</h4>
										<p class="mt-1 line-clamp-2 text-xs text-slate-500">
											{dish.description || 'No description'}
										</p>
										{#if dish.category}
											<span
												class="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
											>
												{dish.category}
											</span>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Modal Footer -->
				<div class="border-t border-slate-100 bg-slate-50 px-6 py-4">
					<button
						onclick={() => (showAddModal = false)}
						class="w-full rounded-xl border border-slate-200 bg-white py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.font-heading {
		font-family: 'Poppins', sans-serif;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
