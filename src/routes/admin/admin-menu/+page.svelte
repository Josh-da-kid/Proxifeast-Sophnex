<script lang="ts">
	import { enhance } from '$app/forms';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import pb from '$lib/pb';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { fly } from 'svelte/transition';

	const dishes = $page.form?.dishes ?? $page.data.dishes;

	const categories = $page.data.categories ?? [];

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

	const groupedDishes: Record<string, typeof dishes> = {};

	for (const dish of dishes) {
		if (dish.category) {
			if (!groupedDishes[dish.category]) {
				groupedDishes[dish.category] = [];
			}
			groupedDishes[dish.category].push(dish);
		}
	}

	function openEditDrawer(dish: any) {
		const isFileUpload = dish.image?.startsWith('https://playgzero.pb.itcass.net/api/files/');
		selectedDish = {
			...dish,
			imageSource: 'url' // ✅ Always set to 'url' on drawer open
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
	if ($page.form?.success) {
		successAlert = true;
	} else if ($page.form?.error) {
		errorAlert = true;
	}

	const searchSubmitted = derived(page, ($page) => {
		return ($page.url.searchParams.get('search')?.trim() ?? '') !== '';
	});

	let searchInput = $state('');
	let selectedCategoryInput = $state('All');

	onMount(() => {
		const url = get(page).url;

		searchInput = $page.url.searchParams.get('search') ?? '';
		selectedCategoryInput = $page.url.searchParams.get('category') ?? 'All';

		if (successAlert) {
			setTimeout(() => {
				successAlert = false;
			}, 2000);
		}
		if (errorAlert) {
			setTimeout(() => {
				errorAlert = false;
			}, 2000);
		}
	});

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	async function clearSearch() {
		await goto('/admin/admin-menu'); // navigate
		window.location.reload(); // force full browser reload after navigation
	}

	async function handleSearchSubmit(e: Event) {
		e.preventDefault();

		if (!searchInput.trim() && selectedCategoryInput === 'All') {
			// Do nothing if no filters
			return;
		}

		const query = new URLSearchParams();
		if (searchInput.trim()) query.set('search', searchInput.trim());
		if (selectedCategoryInput && selectedCategoryInput !== 'All')
			query.set('category', selectedCategoryInput);

		const target = `/admin/admin-menu?${query.toString()}`;

		await goto(target); // navigate
		window.location.reload(); // force full page reload
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
			if (deleteSuccessful) {
				setTimeout(() => {
					deleteSuccessful = false;
				}, 2000);
			}

			window.location.reload();
		} catch (error) {
			console.error('Failed to delete dish:', error);
			deleteUnsuccessful = true;
			if (deleteUnsuccessful) {
				setTimeout(() => {
					deleteUnsuccessful = false;
				}, 2000);
			}
		}
	}

	function handleImageSourceChange(e: any) {
		selectedDish.imageSource = e.target.value;
	}

	let modalImage: string | null = $state(null);

	export const user = derived(page, ($page) => $page.data.user);
</script>

{#if successAlert}
	<div
		role="alert"
		class="alert alert-success fixed top-1/2 z-20 mb-4 ml-2 px-6"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Dish edited successfully!</span>
	</div>
{/if}

{#if errorAlert}
	<div
		role="alert"
		class="alert alert-error fixed top-1/2 z-20 mb-4"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
			/>
		</svg>
		<span>{$page.form.error}</span>
	</div>
{/if}

{#if deleteSuccessful}
	<div
		role="alert"
		class="alert alert-success fixed top-1/2 z-20 mb-4 ml-2 px-6"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Dish deleted successfully!</span>
	</div>
{/if}

{#if deleteUnsuccessful}
	<div
		role="alert"
		class="alert alert-error fixed top-1/2 z-20 mb-4"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
			/>
		</svg>
		<span>Error Deleting Dish</span>
	</div>
{/if}

<h2 class="mb-4 ml-4 text-center text-4xl font-bold md:mt-8" in:fly={{ x: 200, duration: 800 }}>
	All Dishes
</h2>

<!-- Search Input -->
<section class="items-center justify-center gap-2 sm:flex">
	<form method="GET" onsubmit={handleSearchSubmit} class="gap-2 sm:flex">
		<div class="flex items-center justify-center gap-2 p-2">
			<input
				type="text"
				name="search"
				placeholder="Search dishes..."
				bind:value={searchInput}
				class="input input-bordered border-secondary focus:ring-secondary w-full max-w-xs border focus:ring-2 focus:outline-none md:w-[400px]"
			/>

			{#if searchInput.trim() && $searchSubmitted}
				<!-- svelte-ignore a11y_consider_explicit_label -->

				<button type="button" onclick={clearSearch} class="btn btn-secondary">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
						<path
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243"
						/>
					</svg>
				</button>
			{/if}
			{#if searchInput.length > 0 && !$searchSubmitted}
				<button type="submit" class="btn btn-secondary">Search</button>
			{/if}
		</div>

		<div class="ml-4 px-2 sm:ml-0 sm:p-3">
			<select
				name="category"
				bind:value={selectedCategoryInput}
				class="select select-bordered border-secondary focus:ring-secondary w-fit"
				onchange={(e) => {
					// auto submit when category changes
					const form = e.currentTarget?.form;
					if (form) form.requestSubmit();
				}}
			>
				<option value="All">All Categories</option>
				{#each categories as category}
					<option value={category}>{category}</option>
				{/each}
			</select>
		</div>
	</form>
</section>

{#if dishes.length > 0 && $searchSubmitted}
	<p class="mt-6 text-center text-gray-500">Showing results for "{searchInput}".</p>
{/if}

{#if dishes.length === 0}
	<p class="mt-6 text-center text-gray-500">
		No dishes found in {selectedCategoryInput ? `${selectedCategoryInput}` : 'all'} category
		{searchInput ? ` for "${searchInput}"` : ''}.
	</p>
{/if}

{#each Object.entries(groupedDishes).sort( (a, b) => a[0].localeCompare(b[0]) ) as [category, dishesInCategory]}
	<section class="mb-10 p-6">
		<div class="text-secondary mb-6 ml-4 w-fit text-3xl">
			<h3 class="font-semibold">{category}</h3>
			<div class="border-2 underline"></div>
		</div>

		<div class="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each dishesInCategory as dish}
				<article
					class="card card-compact bg-base-200 transform overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
					in:fly={{ y: 50, duration: 600 }}
				>
					<!-- Modal -->
					{#if modalImage}
						<div class="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center bg-black">
							<div class="relative w-full max-w-2xl rounded-xl bg-white p-4">
								<button
									class="btn btn-lg btn-circle bg-secondary absolute top-2 right-2 text-white"
									onclick={() => (modalImage = null)}>✕</button
								>
								<img
									src={modalImage}
									alt="Dish"
									class="h-auto max-h-[80vh] w-full rounded-lg object-contain"
								/>
							</div>
						</div>
					{/if}
					<!-- Dish Figure -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<figure onclick={() => (modalImage = dish.image)} class="cursor-pointer">
						<img
							src={dish.image}
							alt={dish.name}
							class="h-48 w-full rounded-lg object-cover transition-transform duration-200 hover:scale-105"
						/>
					</figure>

					<div class="card-body">
						<h4 class="card-title text-primary font-playfair">{dish.name}</h4>

						<p class="text-base-content">{dish.description}</p>

						<div class="">
							{#if dish.availability === 'Available'}
								<span class="badge badge-success">Available</span>
							{:else if dish.availability === 'Unavailable'}
								<span class="badge badge-error">Unavailable</span>
							{/if}
						</div>

						<div class="mr-3 flex justify-between">
							<div class="flexx items-baseline gap-2">
								{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
									<div class="flex gap-2">
										<p class="text-secondary font-bold">
											₦{Number(dish.promoAmount).toLocaleString()}
										</p>
										<p class="text-gray-400 line-through">
											₦{Number(dish.defaultAmount).toLocaleString()}
										</p>
									</div>
									<span class="badge badge-accent mt-1">
										-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
									</span>
								{:else}
									<p class="text-secondary font-bold">
										₦{Number(dish.defaultAmount).toLocaleString()}
									</p>
								{/if}
							</div>

							<!-- Icons -->
							<div class="flex gap-3">
								<!-- View, Edit, etc. -->

								<div class="tooltip" data-tip="edit dish">
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<svg
										class="cursor-pointer"
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										onclick={() => openEditDrawer(dish)}
										><g
											fill="none"
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											><path d="M7 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1" /><path
												d="M20.385 6.585a2.1 2.1 0 0 0-2.97-2.97L9 12v3h3zM16 5l3 3"
											/></g
										></svg
									>
								</div>
								<div class="tooltip" data-tip="delete dish">
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<!-- svelte-ignore a11y_consider_explicit_label -->
									<button
										class=""
										onclick={() => {
											if (!$isLoggedIn) {
												alert('You must be logged in as an admin to delete dish');
											} else {
												dishToDelete = dish;
												deleteModal.showModal();
											}
										}}
										><svg
											class="cursor-pointer text-red-500"
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											><path
												fill="currentColor"
												fill-rule="evenodd"
												d="m6.774 6.4l.812 13.648a.8.8 0 0 0 .798.752h7.232a.8.8 0 0 0 .798-.752L17.226 6.4zm11.655 0l-.817 13.719A2 2 0 0 1 15.616 22H8.384a2 2 0 0 1-1.996-1.881L5.571 6.4H3.5v-.7a.5.5 0 0 1 .5-.5h16a.5.5 0 0 1 .5.5v.7zM14 3a.5.5 0 0 1 .5.5v.7h-5v-.7A.5.5 0 0 1 10 3zM9.5 9h1.2l.5 9H10zm3.8 0h1.2l-.5 9h-1.2z"
											/></svg
										>
									</button>

									<!-- Open the modal using ID.showModal() method -->

									<dialog id="my_modal_2" bind:this={deleteModal} class="modal">
										<div class="modal-box">
											<h3 class="text-lg font-bold">
												Hey <span class="text-secondary">{$user?.name}!</span>
											</h3>
											{#if dishToDelete}
												<p class="py-4">
													Are you sure you want to delete <span class="font-bold"
														>{dishToDelete.name}</span
													> from the menu?
												</p>
											{:else}
												<p class="py-4">Loading dish info...</p>
											{/if}
											<div class="modal-action">
												<form method="dialog">
													<!-- if there is a button in form, it will close the modal -->
													<button class="btn">Cancel</button>
												</form>
												<button onclick={handleDeleteDish} class="btn bg-red-500 text-white"
													>Delete</button
												>
											</div>
										</div>
									</dialog>
								</div>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>
{/each}

{#if $isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>

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
				<h2 class="mb-2 text-xl font-bold">Edit Your Dish</h2>

				<form action="?/editDish" method="POST" enctype="multipart/form-data">
					<input type="hidden" name="id" value={selectedDish.id} />
					<input type="hidden" name="restaurantId" value={selectedDish.restaurantId} />
					<div class="flex flex-col">
						<label for="name" class="">Name of Dish</label>
						<input
							type="text"
							id="name"
							name="name"
							placeholder="Name of Dish"
							bind:value={selectedDish.name}
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="description" class="">Dish Description</label>
						<textarea
							id="description"
							name="description"
							bind:value={selectedDish.description}
							placeholder="e.g. creamy and tasty"
							class="textarea focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						></textarea>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="category" class="">Dish Category</label>
						<select
							class="select border-secondary focus:ring-secondary border focus:ring-2 focus:outline-none"
							name="category"
							bind:value={selectedDish.category}
							required
						>
							<option value="" disabled selected>Select Dish Category</option>
							<option value="Main Dish">Main Dish</option>
							<option value="Seafood">Seafood</option>
							<option value="Drinks & Sides">Drinks & Sides</option>
						</select>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="availability" class="">Dish Availability</label>
						<select
							name="availability"
							bind:value={selectedDish.availability}
							class="select border-secondary focus:ring-secondary border focus:ring-2 focus:outline-none"
							required
						>
							<option value="" disabled selected>Select Availability</option>
							<option value="Available">Available</option>
							<option value="Unavailable">Unavailable</option>
						</select>
					</div>

					<div class="mt-4 flex flex-col">
						<label for="image" class="">Image of Dish</label>
						<span class="text-gray-700">Edit dish image using:</span>

						<div class="text-secondary space-x-1 p-1">
							<label for="imageUrl" class="cursor-pointer">
								Manual URL Input
								<input
									type="radio"
									name="imageSource"
									class="cursor-pointer"
									value="url"
									id="imageUrl"
									checked={selectedDish.imageSource === 'url'}
									onchange={handleImageSourceChange}
								/>
							</label>
							<span class="text-black">Or</span>
							<label for="imageUpload" class="cursor-pointer">
								File Upload
								<input
									type="radio"
									name="imageSource"
									value="file"
									class="cursor-pointer"
									checked={selectedDish.imageSource === 'file'}
									id="imageUpload"
									onchange={handleImageSourceChange}
								/>
							</label>
						</div>
						{#if selectedDish.imageSource === 'url'}
							<input
								type="text"
								id="image"
								name="imageUrl"
								bind:value={selectedDish.image}
								placeholder="e.g. https://friedricensauce.img"
								class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
								required
							/>
							<button
								onclick={() => {
									selectedDish.image = '';
								}}
								class="btn bg-secondary mt-2 w-fit rounded-lg border p-2 text-white"
								>Clear Input</button
							>
						{:else if selectedDish.imageSource === 'file'}
							<label for="upload" class="mt-2 cursor-pointer">Click here to upload dish image</label
							>
							<input
								type="file"
								id="upload"
								required
								name="imageFile"
								accept="image/*"
								class="border-secondary w-fit cursor-pointer border p-2"
							/>
							<!-- bind:value={selectedDish.image} -->
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
							bind:value={selectedDish.quantity}
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
							bind:value={selectedDish.defaultAmount}
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
							bind:value={selectedDish.promoAmount}
							placeholder="e.g. 2500"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
						/>
					</div>

					<button type="submit" name="editDish" class="btn btn-secondary mt-4">Save Edit</button>
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
				<h2 class="mb-2 text-xl font-bold">Edit Your Dish</h2>
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
					<span>You must be logged as an admin to edit a Dish.</span>
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
