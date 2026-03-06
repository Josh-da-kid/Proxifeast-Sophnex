<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';
	import Carousel from '$lib/Carousel.svelte';
	import pb from '$lib/pb';
	import { addToCartPB } from '$lib/addToCart';
	import { cart, fetchCart } from '$lib/stores/cart';

	const restaurant = $derived($page.data.restaurant);
	const featuredDishes = $derived($page.data.featuredDishes ?? []);
	const categories = $derived($page.data.categories ?? []);
	const menuByCategory = $derived($page.data.menuByCategory ?? {});
	const user = $derived($page.data.user);
	const allRestaurants = $derived($page.data.allRestaurants ?? []);

	let currentTime = $state(new Date());
	let timeInterval: ReturnType<typeof setInterval>;
	let isAddingToCart = $state<string | null>(null);
	let addToCartAlert = $state(false);
	let locationMismatchAlert = $state(false);
	let locationMismatchMessage = $state('');

	onMount(() => {
		timeInterval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		if (user) {
			fetchCart();
		}

		return () => {
			if (timeInterval) clearInterval(timeInterval);
		};
	});

	function isRestaurantOpen(): boolean {
		if (!restaurant?.openingTime || !restaurant?.closingTime) return true;
		const now = currentTime;
		const currentMinutes = now.getHours() * 60 + now.getMinutes();
		const [openHour, openMin] = restaurant.openingTime.split(':').map(Number);
		const [closeHour, closeMin] = restaurant.closingTime.split(':').map(Number);
		const openTime = openHour * 60 + openMin;
		const closeTime = closeHour * 60 + closeMin;
		return currentMinutes >= openTime && currentMinutes <= closeTime;
	}

	function formatTime(time: string): string {
		if (!time) return '';
		const [hours, minutes] = time.split(':');
		const h = parseInt(hours);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const h12 = h % 12 || 12;
		return `${h12}:${minutes} ${ampm}`;
	}

	async function handleAddToCart(dish: any) {
		if (!user) {
			window.location.href = '/login';
			return;
		}

		if (dish.availability !== 'Available') return;

		// Check for location mismatch with cart items
		const currentCart = $cart;
		if (currentCart.length > 0) {
			const cartRestaurantIds = [
				...new Set(currentCart.map((item: any) => item.restaurantId || item.restaurant))
			];

			for (const cartRestaurantId of cartRestaurantIds) {
				const cartRestaurant = allRestaurants.find((r: any) => r.id === cartRestaurantId);
				if (cartRestaurant && restaurant) {
					const newState = restaurant.state?.toLowerCase().trim();
					const cartState = cartRestaurant.state?.toLowerCase().trim();
					const newLGA = restaurant.localGovernment?.toLowerCase().trim();
					const cartLGA = cartRestaurant.localGovernment?.toLowerCase().trim();

					if (newState && cartState && newState !== cartState) {
						locationMismatchMessage = `${restaurant.name} (${restaurant.state}) is in a different state from ${cartRestaurant.name} (${cartRestaurant.state}). Remove ${cartRestaurant.name} from cart to add ${restaurant.name}.`;
						locationMismatchAlert = true;
						setTimeout(() => {
							locationMismatchAlert = false;
						}, 6000);
						return;
					}

					if (newLGA && cartLGA && newLGA !== cartLGA) {
						locationMismatchMessage = `${restaurant.name} (${restaurant.localGovernment} LGA) is in a different LGA from ${cartRestaurant.name} (${cartRestaurant.localGovernment} LGA). Remove ${cartRestaurant.name} from cart to add ${restaurant.name}.`;
						locationMismatchAlert = true;
						setTimeout(() => {
							locationMismatchAlert = false;
						}, 6000);
						return;
					}
				}
			}
		}

		isAddingToCart = dish.id;

		try {
			await addToCartPB(
				pb,
				dish.id,
				1,
				user.id,
				dish.defaultAmount,
				dish.promoAmount,
				restaurant.id,
				restaurant.name
			);

			addToCartAlert = true;
			setTimeout(() => {
				addToCartAlert = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to add to cart:', err);
		} finally {
			isAddingToCart = null;
		}
	}

	const carouselImages = $derived.by(() => {
		const images = [];
		if (restaurant?.bannerUrl) images.push({ src: restaurant.bannerUrl, alt: restaurant.name });
		if (restaurant?.imageUrl) images.push({ src: restaurant.imageUrl, alt: restaurant.name });
		if (restaurant?.logoUrl) images.push({ src: restaurant.logoUrl, alt: restaurant.name });
		if (restaurant?.galleryImages && restaurant.galleryImages.length > 0) {
			restaurant.galleryImages.forEach((img: string, idx: number) => {
				images.push({ src: img, alt: `${restaurant.name} Gallery ${idx + 1}` });
			});
		}
		if (featuredDishes.length > 0) {
			featuredDishes.slice(0, 5).forEach((dish: any) => {
				if (dish.image) images.push({ src: dish.image, alt: dish.name });
			});
		}
		if (images.length === 0) {
			images.push({
				src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
				alt: restaurant?.name || 'Store'
			});
		}
		return images;
	});

	const isOpen = $derived(isRestaurantOpen());
</script>

<svelte:head>
	<title>{restaurant?.name || 'Store'} - Proxifeast</title>
</svelte:head>

<!-- Add to Cart Toast -->
{#if addToCartAlert}
	<div
		class="toast toast-top toast-center z-50"
		in:fly={{ y: -50, duration: 300 }}
		out:fly={{ y: -50, duration: 300 }}
	>
		<div class="alert gap-3 rounded-2xl border-0 bg-gray-900 px-5 py-3 text-white shadow-2xl">
			<div class="rounded-full bg-green-500/20 p-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-green-400"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div>
				<p class="text-sm font-semibold">Added to cart</p>
				<p class="text-xs text-gray-400">Item has been added successfully</p>
			</div>
		</div>
	</div>
{/if}

<!-- Location Mismatch Alert -->
{#if locationMismatchAlert}
	<div
		class="toast toast-top toast-center z-50"
		in:fly={{ y: -50, duration: 300 }}
		out:fly={{ y: -50, duration: 300 }}
	>
		<div
			class="alert max-w-md gap-3 rounded-2xl border-0 bg-gray-900 px-5 py-3 text-white shadow-2xl"
		>
			<div class="rounded-full bg-amber-500/20 p-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-amber-400"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div>
				<p class="text-sm font-semibold">Location Mismatch</p>
				<p class="text-xs text-gray-400">{locationMismatchMessage}</p>
			</div>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-slate-50">
	<!-- Restaurant Header Section -->
	<header class="relative">
		<!-- Banner Image -->
		<div class="relative h-56 overflow-hidden md:h-72 lg:h-80">
			{#if restaurant?.bannerUrl}
				<img src={restaurant.bannerUrl} alt={restaurant.name} class="h-full w-full object-cover" />
			{:else if restaurant?.imageUrl}
				<img src={restaurant.imageUrl} alt={restaurant.name} class="h-full w-full object-cover" />
			{:else}
				<div class="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900"></div>
			{/if}
			<div
				class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"
			></div>
		</div>

		<!-- Restaurant Info Card -->
		<div class="relative mx-auto -mt-20 max-w-5xl px-4">
			<div class="rounded-2xl bg-white p-6 shadow-xl" in:fly={{ y: 20, duration: 400 }}>
				<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<!-- Logo & Basic Info -->
					<div class="flex items-start gap-4">
						<div class="shrink-0">
							{#if restaurant?.logoUrl}
								<img
									src={restaurant.logoUrl}
									alt={restaurant.name}
									class="h-20 w-20 rounded-xl border-2 border-slate-100 object-cover shadow-md md:h-24 md:w-24"
								/>
							{:else}
								<div
									class="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-slate-100 bg-slate-100 shadow-md md:h-24 md:w-24"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-8 w-8 text-slate-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="1.5"
											d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"
										/>
									</svg>
								</div>
							{/if}
						</div>
						<div class="min-w-0">
							<h1 class="font-playfair text-2xl font-bold text-slate-900 md:text-3xl">
								{restaurant?.name || 'Store'}
							</h1>
							{#if restaurant?.motto}
								<p class="mt-1 text-sm text-slate-500">{restaurant.motto}</p>
							{/if}
							<div class="mt-2 flex flex-wrap gap-2">
								<!-- Store Type Badge -->
								{#if restaurant?.type}
									{@const typeColors = {
										restaurant: 'bg-orange-100 text-orange-700',
										bar: 'bg-purple-100 text-purple-700',
										cafe: 'bg-amber-100 text-amber-700',
										hotel: 'bg-blue-100 text-blue-700'
									}}
									{@const typeLabels = {
										restaurant: 'Restaurant',
										bar: 'Bar',
										cafe: 'Café',
										hotel: 'Hotel'
									}}
									<span
										class="rounded-full px-3 py-1 text-xs font-medium {typeColors[
											restaurant.type
										] || 'bg-gray-100 text-gray-700'}"
									>
										{typeLabels[restaurant.type] || restaurant.type}
									</span>
								{/if}
								{#if restaurant?.category}
									<span
										class="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
									>
										{restaurant.category}
									</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Quick Actions -->
					<div class="flex flex-col gap-3 sm:flex-row md:items-center">
						<!-- Open/Closed Status -->
						<div
							class="flex items-center gap-2 rounded-full px-4 py-2 {isOpen
								? 'bg-green-100'
								: 'bg-red-100'}"
						>
							<span
								class="h-2.5 w-2.5 rounded-full {isOpen
									? 'bg-green-500'
									: 'bg-red-500'} animate-pulse"
							></span>
							<span class="text-sm font-medium {isOpen ? 'text-green-700' : 'text-red-700'}">
								{isOpen ? 'Open Now' : 'Closed'}
							</span>
						</div>

						<!-- Dynamic CTAs based on store features -->
						{#if restaurant?.features?.hasMenu}
							<a
								href="#menu"
								class="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:shadow-xl"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/>
								</svg>
								{restaurant?.type === 'hotel' ? 'Order to Room' : 'Browse Menu'}
							</a>
						{/if}

						{#if restaurant?.features?.hasReservation}
							<a
								href="/reservation?store={restaurant?.id}"
								class="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 hover:shadow-xl"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								{restaurant?.type === 'hotel' ? 'Book Room' : 'Reserve Table'}
							</a>
						{/if}

						{#if restaurant?.features?.hasRoomService && restaurant?.type === 'hotel'}
							<a
								href="#menu"
								class="flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:bg-purple-600 hover:shadow-xl"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
									/>
								</svg>
								Room Service
							</a>
						{/if}

						{#if restaurant?.features?.hasBar && !restaurant?.features?.hasMenu}
							<a
								href="#menu"
								class="flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:bg-purple-600 hover:shadow-xl"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
								View Drinks
							</a>
						{/if}
					</div>
				</div>

				<!-- Quick Info Grid -->
				<div
					class="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4"
				>
					<!-- Opening Hours -->
					<div class="flex items-start gap-3">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-slate-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
						</div>
						<div>
							<p class="text-xs font-medium text-slate-500">Opening Hours</p>
							<p class="text-sm font-semibold text-slate-900">
								{restaurant?.openingTime ? formatTime(restaurant.openingTime) : '24/7'} - {restaurant?.closingTime
									? formatTime(restaurant.closingTime)
									: '24/7'}
							</p>
						</div>
					</div>

					<!-- Address -->
					{#if restaurant?.restaurantAddress}
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-slate-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M21 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
							</div>
							<div>
								<p class="text-xs font-medium text-slate-500">Address</p>
								<p class="line-clamp-2 text-sm font-semibold text-slate-900">
									{restaurant.restaurantAddress}
								</p>
							</div>
						</div>
					{/if}

					<!-- State/LGA -->
					{#if restaurant?.state || restaurant?.localGovernment}
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-slate-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							</div>
							<div>
								<p class="text-xs font-medium text-slate-500">Location</p>
								<p class="text-sm font-semibold text-slate-900">
									{restaurant.localGovernment
										? `${restaurant.localGovernment}, `
										: ''}{restaurant.state || ''}
								</p>
							</div>
						</div>
					{/if}

					<!-- Estimated Wait -->
					<div class="flex items-start gap-3">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-slate-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div>
							<p class="text-xs font-medium text-slate-500">Estimated Wait</p>
							<p class="text-sm font-semibold text-slate-900">15-30 mins</p>
						</div>
					</div>

					<!-- Order Services -->
					{#if restaurant?.orderServices}
						{@const orderServices = restaurant.orderServices}
						{#if orderServices.tableService || orderServices.pickup || orderServices.homeDelivery}
							<div class="flex items-start gap-3">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5 text-emerald-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
										/>
									</svg>
								</div>
								<div>
									<p class="text-xs font-medium text-slate-500">Order Services</p>
									<div class="mt-1 flex flex-wrap gap-1">
										{#if orderServices.tableService}
											<span
												class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
											>
												Table Service
											</span>
										{/if}
										{#if orderServices.pickup}
											<span
												class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
											>
												Pickup
											</span>
										{/if}
										{#if orderServices.homeDelivery}
											<span
												class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
											>
												Delivery
											</span>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Description -->
				{#if restaurant?.description}
					<div class="mt-6 border-t border-slate-100 pt-6">
						<p class="text-sm leading-relaxed text-slate-600">{restaurant.description}</p>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Carousel Section -->
	<section class="py-8">
		<div class="mx-auto max-w-5xl px-4">
			<h2 class="font-playfair mb-6 text-xl font-semibold text-slate-900">Gallery</h2>
			<Carousel showArrows={true} showDots={true} autoplay={true} autoplayDelay={5000}>
				{#each carouselImages as image, i}
					<div class="relative w-full shrink-0 snap-start md:w-full">
						<div class="aspect-[16/7] overflow-hidden rounded-xl bg-slate-200">
							<img src={image.src} alt={image.alt} class="h-full w-full object-cover" />
							<div
								class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity hover:opacity-100"
							>
								<div class="absolute bottom-4 left-4">
									<span
										class="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
									>
										{i + 1} of {carouselImages.length}
									</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</Carousel>
		</div>
	</section>

	<!-- Today's Specials Section -->
	{#if featuredDishes.length > 0}
		<section class="bg-white py-10">
			<div class="mx-auto max-w-5xl px-4">
				<div class="mb-8 flex items-center justify-between">
					<div>
						<span
							class="mb-2 inline-block rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/30"
						>
							Today's Specials
						</span>
						<h2 class="font-playfair text-2xl font-bold text-slate-900 md:text-3xl">
							Chef's Picks
						</h2>
					</div>
				</div>

				<!-- Specials Carousel -->
				<Carousel showArrows={true} showDots={true}>
					{#each featuredDishes as dish}
						<article class="w-72 shrink-0 snap-start">
							<div
								class="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
							>
								<!-- Image -->
								<div class="relative aspect-[4/3] overflow-hidden">
									{#if dish.image}
										<img
											src={dish.image}
											alt={dish.name}
											class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
											loading="lazy"
										/>
									{:else}
										<div class="flex h-full w-full items-center justify-center bg-slate-100">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-12 w-12 text-slate-300"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="1.5"
													d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
												/>
											</svg>
										</div>
									{/if}
									<!-- Gradient overlay -->
									<div
										class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
									></div>
									<!-- Discount Badge -->
									{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
										<div class="absolute top-3 right-3">
											<span
												class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg"
											>
												-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
											</span>
										</div>
									{/if}
									<!-- Dish Name Overlay -->
									<div class="absolute right-0 bottom-0 left-0 p-4">
										<h3 class="font-semibold !text-white">{dish.name}</h3>
									</div>
								</div>

								<!-- Content -->
								<div class="p-4">
									{#if dish.description}
										<p class="mb-3 line-clamp-2 text-xs text-slate-500">{dish.description}</p>
									{/if}
									<div class="flex items-baseline justify-between">
										{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
											<div>
												<span class="text-lg font-bold text-amber-600"
													>₦{Number(dish.promoAmount).toLocaleString()}</span
												>
												<span class="ml-2 text-sm text-slate-400 line-through"
													>₦{Number(dish.defaultAmount).toLocaleString()}</span
												>
											</div>
										{:else}
											<span class="text-lg font-bold text-slate-900"
												>₦{Number(dish.defaultAmount).toLocaleString()}</span
											>
										{/if}
									</div>
									<button
										onclick={() => handleAddToCart(dish)}
										disabled={isAddingToCart === dish.id || dish.availability !== 'Available'}
										class="mt-3 w-full rounded-xl bg-amber-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{#if isAddingToCart === dish.id}
											<span class="loading loading-spinner loading-sm"></span>
										{:else if dish.availability !== 'Available'}
											Sold Out
										{:else}
											Add to Cart
										{/if}
									</button>
								</div>
							</div>
						</article>
					{/each}
				</Carousel>
			</div>
		</section>
	{/if}

	<!-- Menu Preview Section -->
	<section id="menu" class="py-10">
		<div class="mx-auto max-w-5xl px-4">
			<div class="mb-8 text-center">
				<span
					class="mb-2 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700"
				>
					Menu Preview
				</span>
				<h2 class="font-playfair text-2xl font-bold text-slate-900 md:text-3xl">
					Explore Our Menu
				</h2>
			</div>

			{#if categories.length > 0}
				<div class="space-y-10">
					{#each categories as category, catIndex}
						{@const categoryDishes = menuByCategory[category] || []}
						{@const previewDishes = categoryDishes.slice(0, 6)}
						{#if previewDishes.length > 0}
							<div in:fly={{ y: 20, duration: 300, delay: catIndex * 100 }}>
								<!-- Category Header -->
								<div class="mb-4 flex items-center justify-between">
									<h3 class="font-playfair text-xl font-semibold text-slate-900">{category}</h3>
									{#if categoryDishes.length > 6}
										<button class="text-sm font-medium text-amber-600 hover:text-amber-700">
											View All ({categoryDishes.length})
										</button>
									{/if}
								</div>

								<!-- Dishes Carousel -->
								<Carousel showArrows={true} showDots={false}>
									{#each previewDishes as dish, dishIndex}
										<article
											class="group w-72 shrink-0 snap-start"
											in:fly={{ y: 10, duration: 200, delay: catIndex * 100 + dishIndex * 50 }}
										>
											<div
												class="flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md"
											>
												<!-- Dish Image -->
												<div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
													{#if dish.image}
														<img
															src={dish.image}
															alt={dish.name}
															class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
															loading="lazy"
														/>
													{:else}
														<div class="flex h-full w-full items-center justify-center">
															<svg
																xmlns="http://www.w3.org/2000/svg"
																class="h-8 w-8 text-slate-300"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="1.5"
																	d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
																/>
															</svg>
														</div>
													{/if}
													{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
														<div class="absolute top-2 left-2">
															<span
																class="rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white"
															>
																-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}%
															</span>
														</div>
													{/if}
												</div>

												<!-- Dish Info -->
												<div class="flex flex-1 flex-col p-4">
													<h4
														class="text-sm font-semibold text-slate-900 group-hover:text-amber-600"
													>
														{dish.name}
													</h4>
													{#if dish.description}
														<p class="mt-1 line-clamp-2 text-xs text-slate-500">
															{dish.description}
														</p>
													{/if}
													<div class="mt-auto flex items-baseline justify-between pt-3">
														{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
															<div>
																<span class="text-base font-bold text-amber-600"
																	>₦{Number(dish.promoAmount).toLocaleString()}</span
																>
																<span class="ml-1 text-xs text-slate-400 line-through"
																	>₦{Number(dish.defaultAmount).toLocaleString()}</span
																>
															</div>
														{:else}
															<span class="text-base font-bold text-slate-900"
																>₦{Number(dish.defaultAmount).toLocaleString()}</span
															>
														{/if}
														<button
															onclick={() => handleAddToCart(dish)}
															disabled={isAddingToCart === dish.id ||
																dish.availability !== 'Available'}
															class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
														>
															{#if isAddingToCart === dish.id}
																<span class="loading loading-spinner loading-xs"></span>
															{:else}
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	class="h-4 w-4"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																	stroke-width="2"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M12 4v16m8-8H4"
																	/>
																</svg>
															{/if}
														</button>
													</div>
												</div>
											</div>
										</article>
									{/each}
								</Carousel>
							</div>
						{/if}
					{/each}
				</div>

				<!-- View Full Menu CTA -->
				<div class="mt-12 text-center">
					<a
						href="/?restaurant={restaurant?.id}#menu"
						class="inline-flex items-center gap-2 rounded-full border-2 border-slate-800 px-8 py-3 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-800 hover:text-white"
					>
						View Full Menu
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
						</svg>
					</a>
				</div>
			{:else}
				<!-- Empty Menu State -->
				<div class="py-16 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto h-16 w-16 text-slate-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
					<h3 class="mt-4 text-lg font-medium text-slate-700">Menu Coming Soon</h3>
					<p class="text-slate-500">Check back later for our full menu</p>
				</div>
			{/if}
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-slate-200 bg-white py-8">
		<div class="mx-auto max-w-5xl px-4 text-center">
			<p class="text-sm text-slate-500">
				Powered by <span class="font-medium text-slate-700">Proxifeast</span> • Quality Dining Experience
			</p>
		</div>
	</footer>
</div>
