<script lang="ts">
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';
	import { isAdminPage } from './menuItems.svelte';
	import { cart, clearCart, fetchCart, removeFromCart, total } from './stores/cart';
	import { onMount } from 'svelte';

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

	// Keep it reactive using subscription
	const unsubscribe = isAdminPage.subscribe((val) => {
		isAdmin = val;
	});

	// $: isLoggedIn = $page.data.user !== null;
	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	onMount(async () => {
		await fetchCart();
	});

	let imageSource = $state('file'); // 'url' or 'file'

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

			<div
				class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4 pl-6 md:min-w-1/3"
			>
				<div>
					<button
						onclick={closeSideBar}
						class="hover:text-secondary cursor-pointer items-start justify-start hover:underline"
						><span class="text-secondary">&lt&lt</span> Back</button
					>
				</div>
				<h2 class="mb-2 text-xl font-bold">Create New Dish</h2>

				<form action="/admin?/createDish" method="POST" enctype="multipart/form-data">
					<input type="hidden" name="restaurantId" value={$page.data.user.restaurantId} />

					<div class="flex flex-col">
						<label for="name" class="">Name of Dish</label>
						<input
							type="text"
							id="name"
							name="name"
							placeholder="Name of Dish"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="description" class="">Dish Description</label>
						<textarea
							id="description"
							name="description"
							placeholder="e.g. creamy and tasty"
							class="textarea focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						></textarea>
					</div>

					<select
						class="select border-secondary focus:ring-secondary mt-2 border focus:ring-2 focus:outline-none"
						name="category"
						required
					>
						<option value="" disabled selected>Select Dish Category</option>
						<option value="Main Dish">Main Dish</option>
						<option value="Seafood">Seafood</option>
						<option value="Drinks & Sides">Drinks & Sides</option>
					</select>

					<div class="mt-2 flex flex-col">
						<label for="image" class="">Image of Dish</label>
						<span class="text-gray-700">Upload dish image using:</span>
						<div class="text-secondary space-x-1 p-2">
							<label for="url" class="cursor-pointer">
								Manual URL Input
								<input
									type="radio"
									class="cursor-pointer"
									name="imageSource"
									value="url"
									id="url"
									onchange={handleImageSourceChange}
								/>
							</label>
							<span class="text-black">Or</span>
							<label for="upload" class="cursor-pointer">
								File Upload
								<input
									type="radio"
									class="cursor-pointer"
									name="imageSource"
									value="file"
									checked
									id="upload"
									onchange={handleImageSourceChange}
								/>
							</label>
						</div>
						{#if imageSource === 'url'}
							<input
								type="text"
								id="image"
								name="imageUrl"
								placeholder="e.g. https://friedricensauce.img"
								class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
								required
							/>
						{:else if imageSource === 'file'}
							<label for="upload" class="mt-2 cursor-pointer">Click here to upload dish image</label
							>
							<input
								type="file"
								name="imageFile"
								accept="image/*"
								class="border-secondary mt-2 w-fit cursor-pointer border p-2"
								required
							/>
							<small class="mt-1 text-sm text-gray-500"
								>Only JPEG or PNG files under 2MB are allowed.</small
							>
						{/if}
					</div>

					<div class="mt-2 flex flex-col">
						<label for="quantity" class="">Quantity of Dish</label>
						<input
							type="number"
							id="quantity"
							name="quantity"
							defaultValue="1"
							min="1"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="defaultAmount" class="">Dish Amount</label>
						<input
							type="text"
							name="defaultAmount"
							id="defaultAmount"
							placeholder="e.g. 5500"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="promoAmount" class="">Promo Amount(Optional)</label>
						<input
							type="text"
							id="promoAmount"
							name="promoAmount"
							placeholder="e.g. 2500"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="availability" class="">Dish Availability</label>
						<select
							id="availability"
							name="availability"
							class="select border-secondary focus:ring-secondary border focus:ring-2 focus:outline-none"
							required
						>
							<option value="" disabled selected>Select Availability</option>
							<option value="Available">Available</option>
							<option value="Unavailable">Unavailable</option>
						</select>
					</div>

					<button type="submit" name="createDish" class="btn btn-secondary mt-4">Create Dish</button
					>
				</form>
			</div>
		</div>
	</div>
{:else if $isAdminPage && !$isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

			<div
				class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4 pl-6 md:min-w-1/3"
			>
				<div>
					<button
						onclick={closeSideBar}
						class="hover:text-secondary items-start justify-start hover:underline"
						><span class="text-secondary">&lt&lt</span> Back</button
					>
				</div>
				<h2 class="mb-2 text-xl font-bold">Create New Dish</h2>

				<div role="alert" class="alert alert-info mt-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span>You must be logged as an admin to create a Dish.</span>
					<div>
						<a onclick={closeSideBar} href="/admin/admin-login">
							<button class="btn btn-sm btn-primary">Login</button>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
