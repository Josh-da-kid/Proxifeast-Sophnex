<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import { onMount, onDestroy } from 'svelte';
	import { derived as storeDerived, get } from 'svelte/store';
	import { fly, fade } from 'svelte/transition';
	import Notification from '$lib/Notification.svelte';
	import Carousel from '$lib/Carousel.svelte';
	import ImageCropper from '$lib/ImageCropper.svelte';

	let dishes = $state($page.form?.dishes ?? $page.data.dishes ?? []);
	const categories = $page.data.categories ?? [];

	// State for search/filter
	let searchInput = $state('');
	let selectedCategoryInput = $state('All');

	// Keep dishes in sync with page data
	$effect(() => {
		dishes = $page.form?.dishes ?? $page.data.dishes ?? [];
	});

	let unsubscribe: (() => void) | null = null;

	onMount(async () => {
		// Subscribe to real-time dish updates
		unsubscribe = await pb.collection('dishes').subscribe('*', async (e) => {
			// Refresh the page data when any dish is created, updated, or deleted
			await invalidateAll();
		});
	});

	// Helper to toggle featured status in local state for instant feedback
	function toggleFeaturedLocal(dishId: string) {
		dishes = dishes.map((dish: any) => {
			if (dish.id === dishId) {
				return { ...dish, isFeatured: !dish.isFeatured };
			}
			return dish;
		});
	}

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	let selectedDish = $state({
		restaurantId: '',
		id: '',
		name: '',
		description: '',
		category: '',
		availability: '',
		image: '',
		imageSource: 'url',
		quantity: 1,
		defaultAmount: '',
		promoAmount: ''
	});

	// Image cropper state
	let showImageCropper = $state(false);
	let croppedImageBlob: Blob | null = $state(null);
	let croppedImageBase64 = $state('');

	function handleDishImageCrop(blob: Blob, base64: string) {
		croppedImageBlob = blob;
		croppedImageBase64 = base64;
		selectedDish.image = base64;
		showImageCropper = false;
	}

	function openImageCropper() {
		showImageCropper = true;
	}

	const groupedDishes = $derived.by((): Record<string, any[]> => {
		const sourceDishes =
			searchInput.trim() || selectedCategoryInput !== 'All' ? filteredDishes : dishes;
		const groups: Record<string, any[]> = {};
		for (const dish of sourceDishes) {
			if (dish.category) {
				if (!groups[dish.category]) {
					groups[dish.category] = [];
				}
				groups[dish.category].push(dish);
			}
		}
		return groups;
	});

	const groupedDishEntries = $derived.by(
		() => Object.entries(groupedDishes).sort((a, b) => a[0].localeCompare(b[0])) as [string, any[]][]
	);

	function openEditDrawer(dish: any) {
		selectedDish = {
			...dish,
			imageSource: 'url'
		};
		const drawer = document.getElementById('my-drawer-4') as HTMLInputElement;
		if (drawer) drawer.checked = true;
	}

	function closeSideBar() {
		const drawer = document.getElementById('my-drawer-4') as HTMLInputElement;
		if (drawer) drawer.checked = false;
	}

	let successAlert = $state(false);
	let errorAlert = $state(false);

	$effect(() => {
		if ($page.form?.success) {
			successAlert = true;
			setTimeout(() => (successAlert = false), 3000);
		} else if ($page.form?.error) {
			errorAlert = true;
			setTimeout(() => (errorAlert = false), 3000);
		}
	});

	const searchSubmitted = storeDerived(page, ($page) => {
		return ($page.url.searchParams.get('search')?.trim() ?? '') !== '';
	});

	// Client-side filtered dishes
	let filteredDishes = $derived.by(() => {
		return dishes.filter((dish: any) => {
			const matchesSearch =
				!searchInput.trim() ||
				dish.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
				dish.description?.toLowerCase().includes(searchInput.toLowerCase());

			const matchesCategory =
				selectedCategoryInput === 'All' || dish.category === selectedCategoryInput;

			return matchesSearch && matchesCategory;
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	export const isLoggedIn = storeDerived(page, ($page) => $page.data.user !== null);

	function clearSearch() {
		searchInput = '';
		selectedCategoryInput = 'All';
	}

	function handleSearchSubmit(e: Event) {
		e.preventDefault();
		// Search is handled client-side via $derived
	}

	let deleteModal: HTMLDialogElement;
	let dishToDelete: any = $state(null);
	let deleteSuccessful = $state(false);
	let deleteUnsuccessful = $state(false);

	async function handleDeleteDish() {
		if (!dishToDelete) return;

		try {
			await pb.collection('dishes').delete(dishToDelete.id);
			deleteModal.close();
			deleteSuccessful = true;
			setTimeout(() => (deleteSuccessful = false), 3000);
			await invalidateAll();
		} catch (error) {
			console.error('Failed to delete dish:', error);
			deleteUnsuccessful = true;
			setTimeout(() => (deleteUnsuccessful = false), 3000);
		}
	}

	function handleImageSourceChange(e: any) {
		selectedDish.imageSource = e.target.value;
	}

	let modalImage: string | null = $state(null);

	export const user = storeDerived(page, ($page) => $page.data.user);
</script>

<svelte:head>
	<title>Menu Management - Proxifeast</title>
</svelte:head>

<Notification
	show={successAlert}
	type="success"
	title="Success!"
	message="Dish edited successfully!"
/>

<Notification
	show={errorAlert}
	type="error"
	title="Error"
	message={$page.form?.error || 'Something went wrong'}
/>

<Notification
	show={deleteSuccessful}
	type="success"
	title="Deleted!"
	message="Dish deleted successfully!"
/>

<Notification
	show={deleteUnsuccessful}
	type="error"
	title="Error"
	message="Failed to delete dish. Please try again."
/>

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
		<span>{$page.form?.error}</span>
	</div>
{/if}

{#if deleteSuccessful}
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
		<span>Dish deleted successfully!</span>
	</div>
{/if}

{#if deleteUnsuccessful}
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
		<span>Error Deleting Dish</span>
	</div>
{/if}

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-8 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1
				class="font-playfair mb-2 text-2xl font-bold md:text-3xl"
				in:fly={{ y: 20, duration: 400 }}
			>
				Menu Management
			</h1>
			<p class="text-sm text-slate-300" in:fade={{ duration: 400, delay: 100 }}>
				Manage your dishes and categories
			</p>
		</div>
	</section>

	<!-- Search & Filter -->
	<section class="container mx-auto px-4 py-6">
		<form onsubmit={handleSearchSubmit} class="flex flex-col gap-4 md:flex-row md:items-center">
			<div
				class="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-md shadow-slate-900/5"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-slate-400"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
				</svg>
				<input
					type="text"
					name="search"
					bind:value={searchInput}
					placeholder="Search dishes..."
					class="bg-transparent py-2 text-slate-700 placeholder-slate-400 focus:outline-none"
				/>
				{#if searchInput && $searchSubmitted}
					<button
						type="button"
						onclick={clearSearch}
						class="text-sm text-slate-500 hover:text-slate-700">Clear</button
					>
				{/if}
			</div>

			<select
				name="category"
				bind:value={selectedCategoryInput}
				class="rounded-xl border-0 bg-white px-4 py-2.5 shadow-md shadow-slate-900/5 focus:ring-2 focus:ring-slate-500 focus:outline-none"
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			>
				<option value="All">All Categories</option>
				{#each categories as category}
					<option value={category}>{category}</option>
				{/each}
			</select>
		</form>
	</section>

	<!-- Dishes -->
	<main class="container mx-auto px-4 pb-8">
		{#if dishes.length === 0}
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
				<h3 class="mt-4 text-lg font-medium text-slate-700">No Dishes Found</h3>
				<p class="mt-1 text-slate-500">
					{searchInput || selectedCategoryInput !== 'All'
						? `No dishes found for your search criteria`
						: 'No dishes in the menu yet'}
				</p>
			</div>
		{:else}
			{#each groupedDishEntries as [category, dishesInCategory]}
				<section class="relative mb-10">
					<div class="mx-auto max-w-7xl px-0">
						<h2
							class="font-playfair mb-6 pr-40 pl-4 text-xl font-semibold text-slate-800 sm:pr-48"
							in:fly={{ y: 20, duration: 300 }}
						>
							<span class="inline-block border-b-2 border-current pb-1 whitespace-nowrap">
								{category}
							</span>
							<span class="mt-2 block text-sm font-normal text-slate-500">
								{dishesInCategory.length} dishes
							</span>
						</h2>
					</div>

					<Carousel headerAligned={true}>
						{#each dishesInCategory as dish}
							<article
								class="w-72 shrink-0 snap-start rounded-xl bg-white shadow-md transition-all hover:shadow-xl"
								in:fly={{ y: 20, duration: 300 }}
							>
								<!-- Image Modal -->
								{#if modalImage}
									<div
										class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
										onkeydown={(e) => e.key === 'Escape' && (modalImage = null)}
										role="dialog"
										aria-modal="true"
										tabindex="-1"
									>
										<button class="absolute inset-0" aria-label="Close image preview" onclick={() => (modalImage = null)}></button>
										<div
											class="relative max-w-2xl rounded-xl bg-white p-4"
											role="document"
										>
											<button
												class="absolute top-2 right-2 rounded-full bg-slate-100 p-2 hover:bg-slate-200"
												onclick={() => (modalImage = null)}
												aria-label="Close image preview"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<path d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
											<img src={modalImage} alt="Dish" class="max-h-[80vh] rounded-lg" />
										</div>
									</div>
								{/if}

								<!-- Image Cropper Modal -->
								{#if showImageCropper}
									<div
										class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
									>
										<div class="w-full max-w-2xl rounded-2xl bg-white p-6">
											<div class="mb-4 flex items-center justify-between">
												<h3 class="text-lg font-semibold text-slate-900">Upload Dish Image</h3>
												<button
													onclick={() => (showImageCropper = false)}
													aria-label="Close image cropper"
													class="rounded-lg p-2 hover:bg-slate-100"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="h-5 w-5"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<path d="M18 6L6 18M6 6l12 12" />
													</svg>
												</button>
											</div>

											<ImageCropper
												uploadType="dish"
												initialImage={selectedDish.image}
												onCropComplete={handleDishImageCrop}
												onCancel={() => (showImageCropper = false)}
											/>
										</div>
									</div>
								{/if}

								<!-- Dish Image -->
								<figure class="relative overflow-hidden">
										<button type="button" class="block w-full" onclick={() => (modalImage = dish.image)} aria-label={`Preview ${dish.name} image`}>
											<img
												src={dish.image}
												alt={dish.name}
												class="h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
											/>
										</button>
									{#if dish.availability === 'Available'}
										<span
											class="absolute top-3 right-3 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
										>
											Available
										</span>
									{:else}
										<span
											class="absolute top-3 right-3 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
										>
											Unavailable
										</span>
									{/if}
									{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
										<span
											class="absolute top-3 left-3 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"
										>
											-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
										</span>
									{/if}
								</figure>

								<!-- Dish Details -->
								<div class="p-4">
									<h3 class="font-playfair line-clamp-2 break-words text-lg font-semibold text-slate-900">
										{dish.name}
									</h3>
									<p class="mt-1 line-clamp-2 text-sm text-slate-500">{dish.description}</p>

									<div class="mt-3 flex items-center justify-between">
										<div>
											{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
												<span class="text-lg font-bold text-slate-900"
													>₦{Number(dish.promoAmount).toLocaleString()}</span
												>
												<span class="ml-2 text-sm text-slate-400 line-through"
													>₦{Number(dish.defaultAmount).toLocaleString()}</span
												>
											{:else}
												<span class="text-lg font-bold text-slate-900"
													>₦{Number(dish.defaultAmount).toLocaleString()}</span
												>
											{/if}
										</div>
										<div class="flex gap-2">
											<button
												class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
												onclick={() => openEditDrawer(dish)}
												aria-label={`Edit ${dish.name}`}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<path d="M7 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1" />
													<path d="M20.385 6.585a2.1 2.1 0 0 0-2.97-2.97L9 12v3h3zM16 5l3 3" />
												</svg>
											</button>
											<button
												class="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
												onclick={() => {
													dishToDelete = dish;
													deleteModal.showModal();
												}}
												aria-label={`Delete ${dish.name}`}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<path
														d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
													/>
												</svg>
											</button>
										</div>
									</div>

									<!-- Featured Toggle -->
									<form
										action="?/toggleFeatured"
										method="POST"
										use:enhance={() => {
											// Toggle immediately for instant feedback
											toggleFeaturedLocal(dish.id);
											return async ({ update }) => {
												await update({ reset: false });
												await invalidateAll();
											};
										}}
										class="mt-3"
									>
										<input type="hidden" name="dishId" value={dish.id} />
										<input type="hidden" name="isFeatured" value={dish.isFeatured} />
										<button
											class="w-full rounded-lg py-2 text-sm font-medium {dish.isFeatured
												? 'bg-amber-100 text-amber-700'
												: 'bg-slate-100 text-slate-600'} hover:opacity-80"
										>
											{dish.isFeatured ? '★ Featured' : '☆ Add to Featured'}
										</button>
									</form>
								</div>
							</article>
						{/each}
					</Carousel>
				</section>
			{/each}
		{/if}
	</main>
</div>

<!-- Delete Modal -->
<dialog bind:this={deleteModal} class="modal">
	<div class="modal-box rounded-2xl">
		<h3 class="font-playfair text-lg font-semibold">Confirm Delete</h3>
		{#if dishToDelete}
			<p class="py-4 text-slate-600">
				Are you sure you want to delete <span class="font-semibold">{dishToDelete.name}</span> from the
				menu?
			</p>
		{/if}
		<div class="modal-action">
			<form method="dialog">
				<button class="btn btn-ghost">Cancel</button>
			</form>
			<button onclick={handleDeleteDish} class="btn bg-red-500 text-white hover:bg-red-600"
				>Delete</button
			>
		</div>
	</div>
</dialog>

<!-- Edit Drawer -->
{#if $isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
			<div class="min-h-full w-full max-w-md bg-white">
				<!-- Header -->
				<div
					class="border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5"
				>
					<div class="flex items-center justify-between">
						<div>
							<h2 class="font-playfair text-xl font-semibold text-white">Edit Dish</h2>
							<p class="mt-1 text-sm text-slate-300">Update menu item</p>
						</div>
						<button
							onclick={closeSideBar}
							aria-label="Close edit dish drawer"
							class="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Form -->
				<form
					action="?/editDish"
					method="POST"
					enctype="multipart/form-data"
					class="flex-1 overflow-y-auto p-6"
				>
					<input type="hidden" name="id" value={selectedDish.id} />
					<input type="hidden" name="restaurantId" value={selectedDish.restaurantId} />

					<div class="space-y-5">
						<!-- Name -->
						<div>
							<label for="edit-dish-name" class="mb-1.5 block text-sm font-medium text-slate-700">Dish Name *</label>
							<input
								id="edit-dish-name"
								type="text"
								name="name"
								bind:value={selectedDish.name}
								class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								placeholder="e.g. Grilled Salmon"
								required
							/>
						</div>

						<!-- Description -->
						<div>
							<label for="edit-dish-description" class="mb-1.5 block text-sm font-medium text-slate-700">Description *</label>
							<textarea
								id="edit-dish-description"
								name="description"
								bind:value={selectedDish.description}
								class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								rows="3"
								placeholder="Describe the dish..."
								required
							></textarea>
						</div>

						<!-- Category & Availability -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="edit-dish-category" class="mb-1.5 block text-sm font-medium text-slate-700">Category *</label>
								<select
									id="edit-dish-category"
									name="category"
									bind:value={selectedDish.category}
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
									required
								>
									<option value="Main Dish">Main Dish</option>
									<option value="Seafood">Seafood</option>
									<option value="Drinks & Sides">Drinks & Sides</option>
								</select>
							</div>
							<div>
								<label for="edit-dish-availability" class="mb-1.5 block text-sm font-medium text-slate-700">Availability *</label
								>
								<select
									id="edit-dish-availability"
									name="availability"
									bind:value={selectedDish.availability}
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
									required
								>
									<option value="Available">Available</option>
									<option value="Unavailable">Unavailable</option>
								</select>
							</div>
						</div>

						<!-- Image URL -->
						<div>
							<label for="edit-dish-image-trigger" class="mb-1.5 block text-sm font-medium text-slate-700">Dish Image</label>
							{#if selectedDish.image}
								<div class="relative mb-3">
									<img
										src={selectedDish.image}
										alt="Dish preview"
										class="h-32 w-full rounded-lg object-cover"
									/>
									<button
										type="button"
										id="edit-dish-image-trigger"
										onclick={openImageCropper}
										class="absolute right-2 bottom-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white"
									>
										Change
									</button>
								</div>
							{:else}
								<button
									type="button"
									id="edit-dish-image-trigger"
									onclick={openImageCropper}
									class="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-amber-500 hover:text-amber-500"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mr-2 h-5 w-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									Upload Image
								</button>
							{/if}
							<input type="hidden" name="imageUrl" value={selectedDish.image} />
						</div>

						<!-- Quantity -->
						<div>
							<label for="edit-dish-quantity" class="mb-1.5 block text-sm font-medium text-slate-700">Quantity *</label>
							<input
								id="edit-dish-quantity"
								type="number"
								name="quantity"
								bind:value={selectedDish.quantity}
								min="1"
								class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								required
							/>
						</div>

						<!-- Pricing -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="edit-dish-default-amount" class="mb-1.5 block text-sm font-medium text-slate-700"
									>Regular Price (₦) *</label
								>
								<input
									id="edit-dish-default-amount"
									type="number"
									name="defaultAmount"
									bind:value={selectedDish.defaultAmount}
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
									placeholder="e.g. 5500"
									required
								/>
							</div>
							<div>
								<label for="edit-dish-promo-amount" class="mb-1.5 block text-sm font-medium text-slate-700"
									>Promo Price (₦)</label
								>
								<input
									id="edit-dish-promo-amount"
									type="number"
									name="promoAmount"
									bind:value={selectedDish.promoAmount}
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
									placeholder="e.g. 2500"
								/>
							</div>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="mt-8 flex gap-3">
						<button
							type="button"
							onclick={closeSideBar}
							class="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							name="editDish"
							class="flex-1 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 font-medium text-white shadow-lg shadow-slate-800/30 hover:from-slate-700 hover:to-slate-600"
						>
							Save Changes
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{:else}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
			<div class="min-h-full w-full max-w-md bg-white">
				<!-- Header -->
				<div
					class="border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5"
				>
					<div class="flex items-center justify-between">
						<div>
							<h2 class="font-playfair text-xl font-semibold text-white">Edit Dish</h2>
							<p class="mt-1 text-sm text-slate-300">Update menu item</p>
						</div>
					<button
						onclick={closeSideBar}
						aria-label="Close edit dish drawer"
						class="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
					>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<!-- Not Logged In Message -->
				<div class="flex flex-1 items-center justify-center p-6">
					<div class="text-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mx-auto h-16 w-16 text-slate-400"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
							<polyline points="10 17 15 12 10 7" />
							<line x1="15" x2="3" y1="12" y2="12" />
						</svg>
						<h3 class="mt-4 text-lg font-medium text-slate-800">Login Required</h3>
						<p class="mt-2 text-slate-600">You must be logged in as an admin to edit dishes.</p>
						<a href="/admin/admin-login" class="btn btn-primary mt-6">Login</a>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
