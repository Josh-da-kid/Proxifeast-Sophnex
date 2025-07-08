<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Nav from '$lib/Nav.svelte';
	import { cart, fetchCart, total } from '$lib/stores/cart';
	import { derived } from 'svelte/store';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import pb from '$lib/pb';

	// src/routes/admin/+page.svelte
	const dishes = $page.form?.dishes ?? $page.data.dishes;

	const categories = $page.data.categories ?? [];

	const searchTerm = derived(page, ($page) => $page.url.searchParams.get('search') ?? '');
	const selectedCategory = derived(
		page,
		($page) => $page.url.searchParams.get('category') ?? 'All'
	);

	const searchSubmitted = derived(page, ($page) => {
		return ($page.url.searchParams.get('search')?.trim() ?? '') !== '';
	});

	// let dishQuantities: Record<string, string> = {};
	// let dishQuantities = {};
	let dishQuantities: Record<string, number> = {};



	const groupedDishes: Record<string, typeof dishes> = {};

	for (const dish of dishes) {
		dish.quantity = 1;
		if (dish.category) {
			if (!groupedDishes[dish.category]) {
				groupedDishes[dish.category] = [];
			}
			groupedDishes[dish.category].push(dish);
		}
	}

	console.log('Grouped dishes:', groupedDishes);

	async function addToCart(dish: any) {
		const quantity = dishQuantities[dish.id] ?? 1;
		try {
			const formData = new FormData();
			formData.append('name', dish.name);
			formData.append('description', dish.description);
			formData.append('category', dish.category);
			formData.append('image', dish.image);
			formData.append('quantity', quantity.toString());
			formData.append('defaultAmount', dish.defaultAmount.toString());
			if (dish.promoAmount) {
				formData.append('promoAmount', dish.promoAmount.toString());
			}

			await fetch('/add-to-cart', {
				method: 'POST',
				body: formData
			});

			alert('Dish added to cart!');
		} catch (err) {
			console.error('Error adding to cart:', err);
		}
	}

	function closeSideBar() {
		const drawer = document.getElementById('my-drawer-4') as HTMLInputElement;
		if (drawer) drawer.checked = false;
	}

	// let dishQuantity = $state('1');
	let successAlert = false;
	let errorAlert = false;
	if ($page.form?.success) {
		successAlert = true;
	} else if ($page.form?.error) {
		errorAlert = true;
	}

	let searchInput = $state('');
	let selectedCategoryInput = $state('All');

	onMount(() => {

		if (dishes?.length) {
		for (const dish of dishes) {
			if (!(dish.id in dishQuantities)) {
				dishQuantities[dish.id] = 1;
			}
		}
	}

	
		searchInput = $page.url.searchParams.get('search') ?? '';
		selectedCategoryInput = $page.url.searchParams.get('category') ?? 'All';
		if (successAlert) {
			setTimeout(() => {
				successAlert = false;
			}, 2000); // Hide after 4 seconds
		}
		if (errorAlert) {
			setTimeout(() => {
				errorAlert = false;
			}, 2000); // Hide after 4 seconds
		}
	});

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);
	let alert = $state(false);

	const user = derived(page, ($page) => $page.data.user);
</script>

<div class="text-base-content flex min-h-screen flex-col">
	<h3 class="text-secondary mt-4 ml-4 animate-bounce font-bold">Hi {$user?.name || 'there'}!!</h3>
	<section
		id="home"
		class="hero md:px-20l flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-6 text-center md:px-0"
	>
		<h1
			class="font-playfair text-primary mt-22 mb-4 text-6xl font-bold drop-shadow-md md:text-7xl"
			in:fly={{ y: -100, duration: 800 }}
		>
			Your Best Life Now
		</h1>
		<p
			class="text-base-content mb-8 max-w-xl text-lg md:text-xl"
			in:fade={{ delay: 600, duration: 900 }}
		>
			Authentic Nigerian flavors crafted with love and passion. Fresh, local ingredients in every
			bite.
		</p>
		<img
			src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80"
			alt="Delicious Nigerian dish"
			class="flex max-w-xl items-center justify-center rounded-xl text-center shadow-lg transition-transform duration-700 ease-in-out hover:scale-105 md:h-[450px] md:w-screen md:max-w-full"
			in:scale={{ duration: 1000, easing: cubicOut }}
		/>
	</section>

	<h2
		class="font-playfair text-primary mt-15 mb-8 text-center text-5xl font-semibold"
		in:fly={{ x: -200, duration: 800 }}
	>
		Our Menu
	</h2>

	<!-- Search Input -->
	<section id="menu" class="items-center justify-center gap-2 sm:flex">
		<form
			method="GET"
			onsubmit={(e) => {
				if (!searchInput.trim() && selectedCategoryInput === 'All') {
					e.preventDefault();
				}
			}}
			use:enhance
			class="gap-2 sm:flex"
		>
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

					<a href="/#menu" class="btn btn-secondary">
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
					</a>
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
						<figure>
							<img src={dish.image} alt={dish.name} class="h-48 w-full object-cover" />
						</figure>

						<div class="card-body">
							<h4 class="card-title text-primary font-playfair">{dish.name}</h4>
							<p class="text-base-content">{dish.description}</p>

							<div>
								<span class="font-semibold">Quantity </span>
								<input
									type="number"
									bind:value={dishQuantities[dish.id]}
									class="border-secondary focus:ring-secondary w-[80px] border p-1 focus:ring-2 focus:outline-none"
									min="1"
								/>
							</div>
							<p class="text-xs text-gray-500">Debug: qty = {dishQuantities[dish.id]}</p>


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

								<!-- Icons or actions -->
								<div class="flex gap-3">
									<!-- View, Edit, etc. -->

									<div class="tooltip" data-tip="add to cart">
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<svg
											class="text-secondary cursor-pointer"
											onclick={() => addToCart(dish)}
											xmlns="http://www.w3.org/2000/svg"
											width="28"
											height="28"
											viewBox="0 0 24 24"
											><path
												fill="none"
												stroke="currentColor"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4m8 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4m-8.5-3h9.25L19 7H7.312"
											/></svg
										>
									</div>
								</div>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>

<label for="my-drawer-4">
	<div
		class="drawer-button bg-secondary text-primary-content fixed right-4 bottom-4 rounded-lg p-4 shadow-lg"
	>
		<p class="text-xl font-semibold">Cart Total: ₦{$total.toLocaleString('en-NG')}</p>
		<p>Items in cart: {$cart.length}</p>
	</div>
</label>

{#if alert}
	<div
		role="alert"
		class="alert alert-success fixed top-1/2 left-2 z-10"
		in:fly={{ x: -200, duration: 800 }}
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
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Your purchase has been confirmed!</span>
	</div>
{/if}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&family=Roboto&display=swap');

	:global(html, body) {
		font-family: 'Roboto', sans-serif;
	}

	:global(h1, h2, h3) {
		font-family: 'Playfair Display', serif;
	}

	/* Smooth scrolling for anchor links */
	* {
		scroll-behavior: smooth;
	}

	/* Animate nav links on hover */
	.nav-link:hover {
		transition: color 0.3s ease;
	}
</style>
