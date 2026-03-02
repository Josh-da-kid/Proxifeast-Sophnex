<script lang="ts">
	import { page } from '$app/stores';
	import { derived, get } from 'svelte/store';
	import { isAdminPage } from './menuItems.svelte';
	import { cart, clearCart, fetchCart, removeFromCart, total } from './stores/cart';
	import { onMount } from 'svelte';
	import ImageCropper from './ImageCropper.svelte';

	let { restaurants = [], isSuper: propIsSuper, restaurantId: propRestaurantId } = $props();

	// Get isSuper from page data or props
	const isSuper = derived(page, ($page) => propIsSuper ?? $page.data.isSuper ?? false);
	const currentRestaurantId = derived(
		page,
		($page) => propRestaurantId ?? $page.data.restaurantId ?? ''
	);

	// Find the super restaurant from the restaurants list
	const superRestaurantId = $derived(
		restaurants.find((r: any) => r.isSuper === true || r.isSuper === 'true')?.id || ''
	);

	// Sort restaurants - put super restaurant first
	const sortedRestaurants = $derived(
		[...restaurants].sort((a: any, b: any) => {
			const aIsSuper = a.isSuper === true || a.isSuper === 'true';
			const bIsSuper = b.isSuper === true || b.isSuper === 'true';
			if (aIsSuper && !bIsSuper) return -1;
			if (!aIsSuper && bIsSuper) return 1;
			return 0;
		})
	);

	// Default to super restaurant if isSuper, otherwise use current restaurant
	const defaultRestaurantId = $derived(
		$isSuper && superRestaurantId ? superRestaurantId : $currentRestaurantId
	);

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer-5');
		if (drawerToggle instanceof HTMLInputElement) {
			drawerToggle.checked = false;
		}
	}

	function getNumericPrice(price: string): number {
		return parseInt(price.replace(/[₦,]/g, ''), 10);
	}

	let isAdmin = false;

	const unsubscribe = isAdminPage.subscribe((val) => {
		isAdmin = val;
	});

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	onMount(async () => {
		const restaurantId = $currentRestaurantId;
		const superStatus = $isSuper;
		await fetchCart(superStatus ? undefined : restaurantId);
	});

	let imageSource = $state('file');
	let showImageCropper = $state(false);
	let dishImageBase64 = $state('');

	function handleImageCrop(blob: Blob, base64: string) {
		dishImageBase64 = base64;
		showImageCropper = false;
	}

	function handleImageSourceChange(e: any) {
		imageSource = e.target.value;
	}
</script>

{#if $isAdminPage && $isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

			<div class="min-h-full w-full max-w-md bg-white">
				<!-- Header -->
				<div
					class="border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5"
				>
					<div class="flex items-center justify-between">
						<div>
							<h2 class="font-playfair text-xl font-semibold text-white">Add New Dish</h2>
							<p class="mt-1 text-sm text-slate-300">Create a new menu item</p>
						</div>
						<button
							onclick={closeSideBar}
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
					action="/admin?/createDish"
					method="POST"
					enctype="multipart/form-data"
					class="flex-1 overflow-y-auto p-6"
				>
					<div class="space-y-5">
						<!-- Restaurant Selection - Only for super restaurants -->
						{#if $isSuper}
							<div>
								<label for="restaurantId" class="mb-1.5 block text-sm font-medium text-slate-700"
									>Restaurant *</label
								>
								<select
									id="restaurantId"
									name="restaurantId"
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
									required
								>
									{#if $isSuper}
										<option value={defaultRestaurantId} selected>
											{restaurants.find((r: any) => r.id === defaultRestaurantId)?.name ||
												'Select Restaurant'}
										</option>
									{:else}
										<option value="" disabled>Select Restaurant</option>
									{/if}
									{#each restaurants as restaurant}
										{#if !$isSuper || restaurant.id !== defaultRestaurantId}
											<option value={restaurant.id}>{restaurant.name}</option>
										{/if}
									{/each}
								</select>
								<p class="mt-1 text-xs text-slate-500">
									Choose which restaurant this dish belongs to
								</p>
							</div>
						{:else}
							<!-- Hidden field for non-super restaurants - auto-selects their restaurant -->
							<input type="hidden" name="restaurantId" value={$currentRestaurantId} />
						{/if}

						<!-- Name -->
						<div>
							<label for="name" class="mb-1.5 block text-sm font-medium text-slate-700"
								>Dish Name *</label
							>
							<input
								type="text"
								id="name"
								name="name"
								placeholder="e.g. Grilled Salmon"
								class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								required
							/>
						</div>

						<!-- Description -->
						<div>
							<label for="description" class="mb-1.5 block text-sm font-medium text-slate-700"
								>Description *</label
							>
							<textarea
								id="description"
								name="description"
								placeholder="Describe the dish..."
								class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								rows="3"
								required
							></textarea>
						</div>

						<!-- Category -->
						<div>
							<label class="mb-1.5 block text-sm font-medium text-slate-700">Category *</label>
							<select
								class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								name="category"
								required
							>
								<option value="" disabled selected>Select Category</option>
								<option value="Main Dish">Main Dish</option>
								<option value="Seafood">Seafood</option>
								<option value="Drinks & Sides">Drinks & Sides</option>
							</select>
						</div>

						<!-- Image Source Toggle -->
						<div class="flex gap-4">
							<label class="flex cursor-pointer items-center gap-2">
								<input
									type="radio"
									class="cursor-pointer"
									name="imageSource"
									value="crop"
									checked={imageSource === 'crop'}
									onchange={handleImageSourceChange}
								/>
								<span class="text-sm text-slate-700">Crop Image</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2">
								<input
									type="radio"
									class="cursor-pointer"
									name="imageSource"
									value="url"
									checked={imageSource === 'url'}
									onchange={handleImageSourceChange}
								/>
								<span class="text-sm text-slate-700">Image URL</span>
							</label>
							<label class="flex cursor-pointer items-center gap-2">
								<input
									type="radio"
									class="cursor-pointer"
									name="imageSource"
									value="file"
									checked={imageSource === 'file'}
									onchange={handleImageSourceChange}
								/>
								<span class="text-sm text-slate-700">Upload File</span>
							</label>
						</div>

						<!-- Image Cropper -->
						{#if imageSource === 'crop'}
							<div>
								{#if dishImageBase64}
									<div class="relative mt-1 mb-2">
										<img
											src={dishImageBase64}
											alt="Dish preview"
											class="h-32 w-full rounded-lg object-cover"
										/>
										<button
											type="button"
											onclick={() => (showImageCropper = true)}
											class="absolute right-2 bottom-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white"
										>
											Change
										</button>
									</div>
								{:else}
									<button
										type="button"
										onclick={() => (showImageCropper = true)}
										class="mt-1 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-amber-500 hover:text-amber-500"
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
										Crop Image
									</button>
								{/if}
								<input type="hidden" name="imageUrl" value={dishImageBase64} />
							</div>
						{:else if imageSource === 'url'}
							<div>
								<label for="imageUrl" class="mb-1.5 block text-sm font-medium text-slate-700"
									>Image URL</label
								>
								<input
									type="url"
									id="imageUrl"
									name="imageUrl"
									placeholder="https://example.com/image.jpg"
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								/>
							</div>
						{:else if imageSource === 'file'}
							<div>
								<label class="mb-1.5 block text-sm font-medium text-slate-700">Upload Image</label>
								<input
									type="file"
									name="imageFile"
									accept="image/*"
									class="w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-700 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-300"
								/>
								<p class="mt-1 text-xs text-slate-500">JPEG or PNG under 2MB</p>
							</div>
						{/if}

						<!-- Quantity -->
						<div>
							<label for="quantity" class="mb-1.5 block text-sm font-medium text-slate-700"
								>Quantity *</label
							>
							<input
								type="number"
								id="quantity"
								name="quantity"
								value="1"
								min="1"
								class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								required
							/>
						</div>

						<!-- Pricing -->
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="defaultAmount" class="mb-1.5 block text-sm font-medium text-slate-700"
									>Regular Price (₦) *</label
								>
								<input
									type="number"
									name="defaultAmount"
									id="defaultAmount"
									placeholder="e.g. 5500"
									min="0"
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
									required
								/>
							</div>
							<div>
								<label for="promoAmount" class="mb-1.5 block text-sm font-medium text-slate-700"
									>Promo Price (₦)</label
								>
								<input
									type="number"
									id="promoAmount"
									name="promoAmount"
									placeholder="e.g. 2500"
									min="0"
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								/>
							</div>
						</div>

						<!-- Restaurant Selection (for super users) -->
						<!-- {#if $isSuper}
							<div>
								<label for="restaurantIdSelect" class="mb-1.5 block text-sm font-medium text-slate-700"
									>Restaurant *</label
								>
								<select
									id="restaurantIdSelect"
									name="restaurantId"
									class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
									required
								>
									{#each restaurants as restaurant}
										<option value={restaurant.id}>{restaurant.name}</option>
									{/each}
								</select>
							</div>
						{/if} -->

						<!-- Availability -->
						<div>
							<label for="availability" class="mb-1.5 block text-sm font-medium text-slate-700"
								>Availability *</label
							>
							<select
								id="availability"
								name="availability"
								class="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
								required
							>
								<option value="Available">Available</option>
								<option value="Unavailable">Unavailable</option>
							</select>
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
							name="createDish"
							class="flex-1 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 font-medium text-white shadow-lg shadow-slate-800/30 hover:from-slate-700 hover:to-slate-600"
						>
							Create Dish
						</button>
					</div>
				</form>

				<!-- Image Cropper Modal -->
				{#if showImageCropper}
					<div
						class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
					>
						<div class="w-full max-w-2xl rounded-2xl bg-white p-6">
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-lg font-semibold text-slate-900">Crop Dish Image</h3>
								<button
									onclick={() => (showImageCropper = false)}
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
								initialImage={dishImageBase64}
								onCropComplete={handleImageCrop}
								onCancel={() => (showImageCropper = false)}
							/>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else if $isAdminPage && !$isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

			<div class="min-h-full w-full max-w-md bg-white">
				<!-- Header -->
				<div
					class="border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5"
				>
					<div class="flex items-center justify-between">
						<div>
							<h2 class="font-playfair text-xl font-semibold text-white">Add New Dish</h2>
							<p class="mt-1 text-sm text-slate-300">Create a new menu item</p>
						</div>
						<button
							onclick={closeSideBar}
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
						<p class="mt-2 text-slate-600">You must be logged in as an admin to add dishes.</p>
						<a onclick={closeSideBar} href="/admin/admin-login" class="btn btn-primary mt-6"
							>Login</a
						>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
