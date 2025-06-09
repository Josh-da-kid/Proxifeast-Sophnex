<script>
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Nav from '$lib/Nav.svelte';

	let isMenuOpen = false;
	let selectedCategory = '';

	const menuItems = [
		{ id: 'home', label: 'Home' },
		// { id: 'menu', label: 'Menu' },
		{ id: 'about', label: 'About' },
		{ id: 'contact', label: 'Contact' }
	];

	const dishes = [
		{
			category: 'Main Dishes',
			items: [
				{
					name: 'Jollof Rice',
					description: 'Spicy, flavorful, and a customer favorite.',
					image: 'https://i.pinimg.com/736x/fc/6c/cf/fc6ccf6314f207173840e9e368cc20b0.jpg',
					price: '₦2,500'
				},
				{
					name: 'Pounded Yam & Egusi Soup',
					description: 'Traditional and hearty, a local delight.',
					image:
						'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80',
					price: '₦3,000'
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
					price: '₦3,500'
				},
				{
					name: 'Peppered Snails',
					description: 'Tender snails cooked in spicy sauce.',
					image: 'https://i.pinimg.com/736x/20/3c/1f/203c1f0d3cbece307cdb0ae9055fa574.jpg',
					price: '₦2,800'
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
					price: '₦800'
				},
				{
					name: 'Fried Plantain',
					description: 'Sweet and crispy, perfect side.',
					image: 'https://i.pinimg.com/736x/5d/c4/6c/5dc46c5c92f95c74ba268e78d3e80c66.jpg',
					price: '₦700'
				},
				{
					name: 'Fanta',
					description: 'Sweet beverage for fun moments.',
					image: 'https://i.pinimg.com/736x/3b/4e/8a/3b4e8a0da4a5fefa30739f578343411b.jpg',
					price: '₦500'
				}
			]
		}
	];

	$: filteredItems = selectedCategory
		? (dishes.find((d) => d.category === selectedCategory)?.items ?? [])
		: [];
</script>

<div class="text-base-content flex min-h-screen flex-col">
	<!-- Hero Section -->
	<section
		id="home"
		class="hero bg-base-200 md:px-20l flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-6 text-center md:px-0"
	>
		<h1
			class="font-playfair text-primary mt-15 mb-4 text-6xl font-bold drop-shadow-md md:text-7xl"
			in:fly={{ y: -100, duration: 800 }}
		>
			Taste the Tradition
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

	<!-- Menu Section -->
	<section id="menu" class="bg-base-100 px-6 pt-16 md:px-20">
		<h2
			class="font-playfair text-primary mb-8 text-center text-5xl font-semibold"
			in:fly={{ x: -200, duration: 800 }}
		>
			Our Menu
		</h2>

		<div class="right-0 mb-6 gap-2">
			<!-- <input type="checkbox" checked="checked" class="checkbox checkbox-primary" /> -->
			<h3 class="mb-2 font-semibold">Filter by:</h3>
			<form class="mb-4 space-y-2 filter">
				<input
					class="btn btn-square"
					type="reset"
					value="×"
					on:click={() => (selectedCategory = '')}
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
				<!-- <input
					class="btn btn-primary"
					type="radio"
					name="category"
					bind:group={selectedCategory}
					value="Rice"
					aria-label="Rice"
				/>
				<input
					class="btn btn-primary"
					type="radio"
					name="category"
					bind:group={selectedCategory}
					value="Soup"
					aria-label="Soup"
				/> -->
			</form>
		</div>
		{#if filteredItems.length < 1}
			{#each dishes as category (category.category)}
				<div class="mb-12" in:fade={{ duration: 700 }}>
					<h3
						class="text-secondary border-secondary mb-6 w-max border-b-4 pb-1 text-3xl font-semibold"
					>
						{category.category}
					</h3>
					<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
						{#each category.items as dish (dish.name)}
							<article
								class="card card-compact bg-base-200 transform cursor-pointer overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
								in:fly={{ y: 50, duration: 600 }}
							>
								<figure>
									<img src={dish.image} alt={dish.name} class="h-48 w-full object-cover" />
								</figure>
								<div class="card-body">
									<h4 class="card-title text-primary font-playfair">{dish.name}</h4>
									<p class="text-base-content">{dish.description}</p>

									<div class="mr-3 flex justify-between">
										<p class="text-secondary mt-2 font-semibold">{dish.price}</p>

										<!-- icons -->
										<div class="flex gap-3">
											<div class="tooltip" data-tip="view">
												<svg
													class="transition-transform duration-700 hover:text-red-500"
													xmlns="http://www.w3.org/2000/svg"
													width="24"
													height="24"
													viewBox="0 0 24 24"
													><g
														fill="none"
														stroke="currentColor"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="1.5"
														color="currentColor"
														><path
															d="M21.544 11.045c.304.426.456.64.456.955c0 .316-.152.529-.456.955C20.178 14.871 16.689 19 12 19c-4.69 0-8.178-4.13-9.544-6.045C2.152 12.529 2 12.315 2 12c0-.316.152-.529.456-.955C3.822 9.129 7.311 5 12 5c4.69 0 8.178 4.13 9.544 6.045"
														/><path d="M15 12a3 3 0 1 0-6 0a3 3 0 0 0 6 0" /></g
													></svg
												>
											</div>

											<div class="tooltip" data-tip="add to cart">
												<svg
													class="transition-transform duration-700 hover:text-red-500"
													xmlns="http://www.w3.org/2000/svg"
													width="24"
													height="24"
													viewBox="0 0 24 24"
													><path
														fill="none"
														stroke="currentColor"
														stroke-dasharray="32"
														stroke-dashoffset="32"
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M12 8c0 0 0 0 -0.76 -1c-0.88 -1.16 -2.18 -2 -3.74 -2c-2.49 0 -4.5 2.01 -4.5 4.5c0 0.93 0.28 1.79 0.76 2.5c0.81 1.21 8.24 9 8.24 9M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9"
														><animate
															fill="freeze"
															attributeName="stroke-dashoffset"
															dur="0.7s"
															values="32;0"
														/></path
													></svg
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
	</section>
</div>

<div>
	{#if filteredItems.length > 0}
		<div class="grid grid-cols-1 gap-8 p-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredItems as item}
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

						<div class="mr-3 flex justify-between">
							<p class="text-secondary mt-2 font-semibold">{item.price}</p>

							<!-- icons -->
							<div class="flex gap-3">
								<div class="tooltip" data-tip="view">
									<svg
										class="transition-transform duration-700 hover:text-red-500"
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										><g
											fill="none"
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="1.5"
											color="currentColor"
											><path
												d="M21.544 11.045c.304.426.456.64.456.955c0 .316-.152.529-.456.955C20.178 14.871 16.689 19 12 19c-4.69 0-8.178-4.13-9.544-6.045C2.152 12.529 2 12.315 2 12c0-.316.152-.529.456-.955C3.822 9.129 7.311 5 12 5c4.69 0 8.178 4.13 9.544 6.045"
											/><path d="M15 12a3 3 0 1 0-6 0a3 3 0 0 0 6 0" /></g
										></svg
									>
								</div>

								<div class="tooltip" data-tip="add to cart">
									<svg
										class="transition-transform duration-700 hover:text-red-500"
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										><path
											fill="none"
											stroke="currentColor"
											stroke-dasharray="32"
											stroke-dashoffset="32"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8c0 0 0 0 -0.76 -1c-0.88 -1.16 -2.18 -2 -3.74 -2c-2.49 0 -4.5 2.01 -4.5 4.5c0 0.93 0.28 1.79 0.76 2.5c0.81 1.21 8.24 9 8.24 9M12 8c0 0 0 0 0.76 -1c0.88 -1.16 2.18 -2 3.74 -2c2.49 0 4.5 2.01 4.5 4.5c0 0.93 -0.28 1.79 -0.76 2.5c-0.81 1.21 -8.24 9 -8.24 9"
											><animate
												fill="freeze"
												attributeName="stroke-dashoffset"
												dur="0.7s"
												values="32;0"
											/></path
										></svg
									>
								</div>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	{:else if selectedCategory}
		<p class="mb-12 text-gray-500">No items found for "{selectedCategory}".</p>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&family=Roboto&display=swap');

	:global(html, body) {
		font-family: 'Roboto', sans-serif;
	}

	:global(h1, h2, h3) {
		font-family: 'Playfair Display', serif;
	}

	/* Smooth scrolling for anchor links */
	html {
		scroll-behavior: smooth;
	}

	/* Animate nav links on hover */
	.nav-link:hover {
		transition: color 0.3s ease;
	}
</style>
