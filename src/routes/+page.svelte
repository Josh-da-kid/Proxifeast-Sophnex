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
			class="font-playfair text-primary mt-22 mb-4 text-6xl font-bold drop-shadow-md md:text-7xl"
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

		<form action="" class="flex items-center justify-center gap-2">
			<input
				type="text"
				placeholder="Search for a meal"
				class="border-secondary w-[300px] rounded-lg border p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
				required
			/>

			<button class="btn btn-secondary">Search</button>
		</form>

		<div class="right-0 mt-6 mb-6 gap-2">
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

									<div class="space-x-2">
										<label for="quantity" class=" text-lg">Quantity</label>
										<input
											type="number"
											class="h-[25px] w-[50px] border p-1"
											defaultValue="1"
											min="1"
										/>
									</div>

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
													width="28"
													height="28"
													viewBox="0 0 24 24"
													><path
														fill="currentColor"
														d="M7.308 21.116q-.633 0-1.067-.434t-.433-1.066t.433-1.067q.434-.433 1.067-.433t1.066.433t.434 1.067t-.434 1.066t-1.066.434m9.384 0q-.632 0-1.066-.434t-.434-1.066t.434-1.067q.434-.433 1.066-.433t1.067.433q.433.434.433 1.067q0 .632-.433 1.066q-.434.434-1.067.434M5.881 5.5l2.669 5.616h6.635q.173 0 .307-.087q.135-.087.231-.24l2.616-4.75q.115-.212.019-.375q-.097-.164-.327-.164zm-.489-1h13.02q.651 0 .98.532q.33.531.035 1.095l-2.858 5.208q-.217.365-.564.573t-.763.208H8.1l-1.215 2.23q-.154.231-.01.5t.433.27h10.384q.214 0 .357.143t.143.357t-.143.356t-.357.144H7.308q-.875 0-1.306-.738t-.021-1.482l1.504-2.68L3.808 3.5H2.5q-.213 0-.357-.143T2 3t.143-.357T2.5 2.5h1.433q.236 0 .429.121q.192.121.298.338zm3.158 6.616h7z"
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

						<div class="space-x-2">
							<label for="quantity" class=" text-lg">Quantity</label>
							<input type="number" class="h-[25px] w-[50px] border p-1" defaultValue="1" min="1" />
						</div>

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
										width="28"
										height="28"
										viewBox="0 0 24 24"
										><path
											fill="currentColor"
											d="M7.308 21.116q-.633 0-1.067-.434t-.433-1.066t.433-1.067q.434-.433 1.067-.433t1.066.433t.434 1.067t-.434 1.066t-1.066.434m9.384 0q-.632 0-1.066-.434t-.434-1.066t.434-1.067q.434-.433 1.066-.433t1.067.433q.433.434.433 1.067q0 .632-.433 1.066q-.434.434-1.067.434M5.881 5.5l2.669 5.616h6.635q.173 0 .307-.087q.135-.087.231-.24l2.616-4.75q.115-.212.019-.375q-.097-.164-.327-.164zm-.489-1h13.02q.651 0 .98.532q.33.531.035 1.095l-2.858 5.208q-.217.365-.564.573t-.763.208H8.1l-1.215 2.23q-.154.231-.01.5t.433.27h10.384q.214 0 .357.143t.143.357t-.143.356t-.357.144H7.308q-.875 0-1.306-.738t-.021-1.482l1.504-2.68L3.808 3.5H2.5q-.213 0-.357-.143T2 3t.143-.357T2.5 2.5h1.433q.236 0 .429.121q.192.121.298.338zm3.158 6.616h7z"
										/></svg
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
