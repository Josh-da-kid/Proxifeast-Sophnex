<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Nav from '$lib/Nav.svelte';
	// Import cart and total stores
	import { addToCart, cart, total } from '$lib/stores/cart';
	import { derived } from 'svelte/store';
	import { page } from '$app/stores';

	// 1. Define the interface for a single dish item
	interface DishItem {
		name: string;
		description: string;
		image: string;
		price: string; // Price as a string (e.g., '₦2,500')
	}

	// 2. Define the interface for a category
	interface DishCategory {
		category: string;
		items: DishItem[];
	}

	// ✅ Use $state for reactive variables
	let isMenuOpen = $state(false);
	let selectedCategory = $state('');
	let searchInput = $state('');
	let searchQuery = $state('');
	let alert = $state(false);

	// ✅ Explicitly type the dishes array
	const dishes: DishCategory[] = [
		{
			category: 'Main Dishes',
			items: [
				{
					name: 'Smoked Turkey and Chips',
					description: 'Spicy, flavorful, and a customer favorite.',
					image: '/photo_2025-06-18_12-13-36.jpg',
					price: '₦15,000',
					cancelled: '₦25,000'
				},
				{
					name: 'Pounded Yam & Egusi Soup',
					description: 'Traditional and hearty, a local delight.',
					image:
						'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
					price: '₦20,000',
					cancelled: '₦35,000'
				},
				{
					name: 'Zhanga Sauce Rice with Smoked Beef and Fish',
					description: 'Freshly caught and perfectly grilled with spices.',
					image:
						'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
					price: '₦35,000',
					cancelled: '₦45,000'
				}
			]
		},
		{
			category: 'Seafood',
			items: [
				{
					name: 'Grilled Fish',
					description: 'Freshly caught and perfectly grilled with spices.',
					image:
						'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
					price: '₦25,000',
					cancelled: '₦40,000'
				},
				{
					name: 'Mixed Seafood Rice with Plantains',
					description: 'Freshly caught and perfectly grilled with spices.',
					image:
						'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
					price: '₦45,000',
					cancelled: '₦55,000'
				},
				{
					name: 'Snails and King prawns Sauce with Ofada Rice or Basmatic with Plantains',
					description: 'Tender snails cooked in spicy sauce.',
					image: 'https://i.pinimg.com/736x/20/3c/1f/203c1f0d3cbece307cdb0ae9055fa574.jpg',
					price: '₦35,000',
					cancelled: '₦5,000'
				}
			]
		},
		{
			category: 'Drinks & Sides',
			items: [
				{
					name: 'Zobo Drink',
					description: 'Refreshing hibiscus flower drink.',
					image: 'https://i.pinimg.com/736x/96/85/f8/9685f801957a8b6a08dbca3dc70d0da5.jpg',
					price: '₦2,000',
					cancelled: '₦4,500'
				},
				{
					name: 'Fried Plantain',
					description: 'Sweet and crispy, perfect side.',
					image: 'https://i.pinimg.com/736x/5d/c4/6c/5dc46c5c92f95c74ba268e78d3e80c66.jpg',
					price: '₦13,000',
					cancelled: '₦22,000'
				},
				{
					name: 'Fanta',
					description: 'Sweet beverage for fun moments.',
					image: 'https://i.pinimg.com/736x/3b/4e/8a/3b4e8a0da4a5fefa30739f578343411b.jpg',
					price: '₦1,500',
					cancelled: '₦2,500'
				}
			]
		}
	];

	// ✅ Explicitly type allDishes
	let allDishes: any = $derived(dishes.flatMap((category) => category.items));

	// ✅ Explicitly type filteredItems
	let filteredItems: any = $derived(() => {
		let itemsToFilter: DishItem[] = allDishes;

		console.log('--- Filtered Items Recalculating ---');
		console.log('Initial itemsToFilter (allDishes.length):', itemsToFilter.length);
		console.log('selectedCategory:', selectedCategory); // Check this value
		console.log('searchQuery:', searchQuery); // Check this value

		if (selectedCategory) {
			itemsToFilter = dishes.find((d) => d.category === selectedCategory)?.items ?? [];
		}

		if (searchQuery) {
			const lowerSearch = searchQuery.toLowerCase();
			itemsToFilter = itemsToFilter.filter((dish) => dish.name.toLowerCase().includes(lowerSearch));
		}

		return itemsToFilter;
	});

	function handleSearch(e: Event) {
		e.preventDefault();
		searchQuery = searchInput.trim();
		selectedCategory = '';
	}

	function clearSearch() {
		searchInput = '';
		searchQuery = '';
		selectedCategory = ''; // Reset category filter too
	}

	// ✅ CORRECT: quantities as a reactive plain JavaScript object
	let quantities: Record<string, number> = $state({});

	// Function to get quantity for an item, defaulting to 1
	function getQty(name: string): number {
		// Return the quantity from the reactive 'quantities' object, or 1 if not set
		return quantities[name] ?? 1;
	}

	// Function to set quantity for an item
	function setQty(name: string, qty: number) {
		// Ensure quantity is at least 1 and update the reactive 'quantities' object
		quantities[name] = Math.max(1, qty);
		// console.log(`Set ${name} quantity to ${quantities[name]}`); // For debugging
	}

	// Debugging: Watch cart and total changes
	cart.subscribe((c) => console.log('Cart updated:', c));
	total.subscribe((t) => console.log('Total updated:', t));

	function myAlert() {
		alert = true;
		setTimeout(() => {
			alert = false;
		}, 2500);
	}
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

	<section id="menu" class="bg-base-100 px-6 pt-16 md:px-20">
		<h2
			class="font-playfair text-primary mb-8 text-center text-5xl font-semibold"
			in:fly={{ x: -200, duration: 800 }}
		>
			Our Menu
		</h2>

		<form onsubmit={handleSearch} class="flex flex-wrap items-center justify-center gap-2">
			<input
				bind:value={searchInput}
				type="text"
				placeholder="Search for a meal"
				class="border-secondary w-[300px] rounded-lg border p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
				required
			/>

			{#if searchQuery}
				<div class="tooltip" data-tip="clear search">
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button
						type="button"
						onclick={clearSearch}
						class="cursor-pointer rounded-full bg-gray-500/50 p-1 text-white transition-transform duration-300 hover:scale-105"
						><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
							><path
								fill="none"
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243"
							/></svg
						></button
					>
				</div>
			{/if}

			<button type="submit" class="btn btn-secondary">Search</button>
		</form>

		{#if searchQuery}
			<p class="mt-2 text-gray-500" transition:fade>
				Showing results for: <strong>{searchQuery}</strong>
			</p>
		{/if}

		<div class="right-0 mt-6 mb-6 gap-2">
			<h3 class="mb-2 font-semibold">Filter by:</h3>
			<form class="mb-4 space-y-2 filter">
				<input
					class="btn btn-square"
					type="reset"
					value="×"
					onclick={() => {
						selectedCategory = '';
						clearSearch();
					}}
				/>

				<input
					class="btn btn-primary"
					type="radio"
					name="category"
					bind:group={selectedCategory}
					value="Main Dishes"
					aria-label="Main Dishes"
				/>
				<input
					class="btn btn-primary"
					type="radio"
					name="category"
					bind:group={selectedCategory}
					value="Seafood"
					aria-label="Seafood"
				/>
				<input
					class="btn btn-primary"
					type="radio"
					name="category"
					bind:group={selectedCategory}
					value="Drinks & Sides"
					aria-label="Drinks & Sides"
				/>
			</form>
		</div>
		<div>
			{#if searchQuery || selectedCategory}
				{#if filteredItems.length > 0}
					<div class="grid grid-cols-1 gap-8 p-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each filteredItems as item (item.name)}
							<article
								class="card card-compact bg-base-200 transform cursor-pointer overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
								in:fly={{ y: 50, duration: 600 }}
							>
								<figure>
									<img src={item.image} alt={item.name} class="h-48 w-full object-cover" />
								</figure>
								<div class="card-body">
									<h4 class="card-title text-primary font-playfair">{item.name}</h4>
									<p class="text-base-content">{item.description}</p>
									<div class="space-x-2">
										<label for="quantity-{item.name}" class="text-lg">Quantity</label>
										<input
											id="quantity-{item.name}"
											type="number"
											class="h-[25px] w-[50px] border p-1"
											bind:value={quantities[item.name]}
											min="1"
											defaultValue="1"
											oninput={(e) => setQty(item.name, +e.target.value)}
										/>
									</div>
									<div class="mr-3 flex justify-between">
										<p class="text-secondary mt-2 font-semibold">{item.price}</p>
										<div class="flex gap-3">
											<div class="tooltip" data-tip="view"></div>

											<!-- svelte-ignore a11y_click_events_have_key_events -->
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div class="tooltip" data-tip="add to cart">
												<svg
													onclick={() => {
														addToCart({
															name: item.name,
															price: item.price,
															image: item.image,
															quantity: getQty(item.name) // Use the quantity from our reactive state
														});
														// alert = true;
														myAlert();
													}}
													xmlns="http://www.w3.org/2000/svg"
													width="24"
													height="24"
													viewBox="0 0 24 24"
													><path
														fill="currentColor"
														d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1m-9-1a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M18 6H4.27l2.55 6H15c.33 0 .62-.16.8-.4l3-4c.13-.17.2-.38.2-.6a1 1 0 0 0-1-1m-3 7H6.87l-.77 1.56L6 15a1 1 0 0 0 1 1h11v1H7a2 2 0 0 1-2-2a2 2 0 0 1 .25-.97l.72-1.47L2.34 4H1V3h2l.85 2H18a2 2 0 0 1 2 2c0 .5-.17.92-.45 1.26l-2.91 3.89c-.36.51-.96.85-1.64.85"
													/></svg
												>
											</div>
										</div>
									</div>
								</div>
							</article>
						{/each}
					</div>
				{:else}
					<p class="mb-12 text-gray-500">No items found for "{searchQuery || selectedCategory}".</p>
				{/if}
			{:else}
				{#each dishes as category (category.category)}
					<div class="mb-12" in:fade={{ duration: 700 }}>
						<h3
							class="text-secondary border-secondary mb-6 ml-5 w-max border-b-4 pb-1 text-3xl font-semibold"
						>
							{category.category}
						</h3>
						<div class="grid grid-cols-1 gap-8 p-6 sm:grid-cols-2 lg:grid-cols-3">
							{#each category.items as item (item.name)}
								<article
									class="card card-compact bg-base-200 transform cursor-pointer overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
									in:fly={{ y: 50, duration: 600 }}
								>
									<figure>
										<img src={item.image} alt={item.name} class="h-48 w-full object-cover" />
									</figure>
									<div class="card-body">
										<h4 class="card-title text-primary font-playfair">{item.name}</h4>
										<p class="text-base-content">{item.description}</p>
										<div class="space-x-2">
											<label for="quantity-{item.name}" class="text-lg">Quantity</label>
											<input
												id="quantity-{item.name}"
												type="number"
												class="h-[25px] w-[50px] border p-1"
												bind:value={quantities[item.name]}
												min="1"
												defaultValue="1"
												oninput={(e) => setQty(item.name, +e.target.value)}
											/>
										</div>
										<div class="mr-3 flex justify-between">
											<div class="flex gap-2">
												<p class="text-secondary mt-2 font-semibold">{item.price}</p>
												<p class="mt-2 font-semibold text-gray-400 line-through">
													{item.cancelled}
												</p>
											</div>
											<div class="flex gap-3">
												<div class="tooltip" data-tip="view"></div>
												<div class="tooltip" data-tip="add to cart">
													<!-- svelte-ignore a11y_click_events_have_key_events -->
													<!-- svelte-ignore a11y_no_static_element_interactions -->
													<svg
														onclick={() => {
															addToCart({
																name: item.name,
																price: item.price,
																image: item.image,
																quantity: getQty(item.name) // Use the quantity from our reactive state
															});
															// alert = true;

															myAlert();
														}}
														xmlns="http://www.w3.org/2000/svg"
														width="24"
														height="24"
														viewBox="0 0 24 24"
														><path
															fill="currentColor"
															d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1m-9-1a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1a1 1 0 0 0 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M18 6H4.27l2.55 6H15c.33 0 .62-.16.8-.4l3-4c.13-.17.2-.38.2-.6a1 1 0 0 0-1-1m-3 7H6.87l-.77 1.56L6 15a1 1 0 0 0 1 1h11v1H7a2 2 0 0 1-2-2a2 2 0 0 1 .25-.97l.72-1.47L2.34 4H1V3h2l.85 2H18a2 2 0 0 1 2 2c0 .5-.17.92-.45 1.26l-2.91 3.89c-.36.51-.96.85-1.64.85"
														/></svg
													>
												</div>
											</div>
										</div>
									</div>
								</article>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</section>
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
