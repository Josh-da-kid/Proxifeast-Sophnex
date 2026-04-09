<script lang="ts">
	import { onMount } from 'svelte';

	interface Slide {
		id: number;
		image: string;
		imageMobile?: string;
		title: string;
		description: string;
		primaryBtn: {
			text: string;
			href: string;
		};
		secondaryBtn?: {
			text: string;
			href: string;
		};
	}

	let {
		slides = [],
		autoplay = true,
		autoplayDelay = 5000,
		navigation = true,
		pagination = true
	}: {
		slides: Slide[];
		autoplay?: boolean;
		autoplayDelay?: number;
		navigation?: boolean;
		pagination?: boolean;
	} = $props();

	let currentIndex = $state(0);
	let isLargeScreen = $state(true);
	let autoplayInterval: ReturnType<typeof setInterval>;
	let isTransitioning = $state(false);
	let touchStartX = 0;
	let touchEndX = 0;

	function nextSlide() {
		if (isTransitioning) return;
		isTransitioning = true;
		currentIndex = (currentIndex + 1) % slides.length;
		setTimeout(() => (isTransitioning = false), 800);
	}

	function prevSlide() {
		if (isTransitioning) return;
		isTransitioning = true;
		currentIndex = (currentIndex - 1 + slides.length) % slides.length;
		setTimeout(() => (isTransitioning = false), 800);
	}

	function goToSlide(index: number) {
		if (isTransitioning || index === currentIndex) return;
		isTransitioning = true;
		currentIndex = index;
		setTimeout(() => (isTransitioning = false), 800);
	}

	function startAutoplay() {
		if (autoplay && slides.length > 1) {
			autoplayInterval = setInterval(nextSlide, autoplayDelay);
		}
	}

	function stopAutoplay() {
		if (autoplayInterval) {
			clearInterval(autoplayInterval);
		}
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
	}

	function handleTouchEnd(e: TouchEvent) {
		touchEndX = e.changedTouches[0].screenX;
		handleSwipe();
	}

	function handleSwipe() {
		const diff = touchStartX - touchEndX;
		if (Math.abs(diff) > 50) {
			if (diff > 0) {
				nextSlide();
			} else {
				prevSlide();
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') prevSlide();
		if (e.key === 'ArrowRight') nextSlide();
	}

	onMount(() => {
		const checkScreen = () => {
			isLargeScreen = window.innerWidth >= 768;
		};
		checkScreen();
		window.addEventListener('resize', checkScreen);
		startAutoplay();

		return () => {
			window.removeEventListener('resize', checkScreen);
			stopAutoplay();
		};
	});
</script>

<svelte:window
	onkeydown={handleKeydown}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
/>

<div class="relative w-full overflow-hidden bg-white" role="region" aria-label="Hero carousel">
	<!-- Slides Container -->
	<div class="relative h-[60vh] md:h-[75vh] lg:h-[85vh]">
		{#each slides as slide, i (slide.id)}
			<div
				class="absolute inset-0 transition-all duration-700 ease-in-out"
				class:opacity-100={i === currentIndex}
				class:opacity-0={i !== currentIndex}
				class:translate-x-0={i === currentIndex}
				class:translate-x-full={i > currentIndex}
				class:-translate-x-full={i < currentIndex}
				aria-hidden={i !== currentIndex}
			>
				<!-- Background Image -->
				<div class="absolute inset-0">
					<img
						src={isLargeScreen ? slide.image : slide.imageMobile || slide.image}
						alt={slide.title}
						class="h-full w-full object-cover"
						loading={i === 0 ? 'eager' : 'lazy'}
					/>
					<!-- Gradient Overlay -->
					<div
						class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30 md:from-black/70 md:via-black/40"
					></div>
				</div>

				<!-- Content -->
				<div class="relative flex h-full items-center px-6 py-16 md:px-12 lg:px-20">
					<div class="mx-auto max-w-3xl text-center md:mx-0 md:text-left">
						<!-- Title -->
						<div class="mb-4 overflow-hidden md:mb-6">
							<h1
								class="text-3xl leading-tight font-bold sm:text-4xl md:text-5xl lg:text-6xl"
								style="color: #ffffff; {i === currentIndex
									? 'transform: translateY(0); opacity: 1;'
									: 'transform: translateY(32px); opacity: 0;'} transition: all 700ms ease; transition-delay: {i ===
								currentIndex
									? '100ms'
									: '0ms'}"
							>
								{slide.title}
							</h1>
						</div>

						<!-- Description -->
						<p
							class="mx-auto mb-8 max-w-xl text-base md:mx-0 md:text-lg lg:text-xl"
							style="color: rgba(255, 255, 255, 0.8); {i === currentIndex
								? 'transform: translateY(0); opacity: 1;'
								: 'transform: translateY(32px); opacity: 0;'} transition: all 700ms ease; transition-delay: {i ===
							currentIndex
								? '200ms'
								: '0ms'}"
						>
							{slide.description}
						</p>

						<!-- Buttons -->
						<div
							class="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start"
							style="{i === currentIndex
								? 'transform: translateY(0); opacity: 1;'
								: 'transform: translateY(32px); opacity: 0;'} transition-delay: {i === currentIndex
								? '300ms'
								: '0ms'}"
						>
							<a
								href={slide.primaryBtn.href}
								class="inline-flex items-center justify-center rounded-lg bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
							>
								{slide.primaryBtn.text}
							</a>
							{#if slide.secondaryBtn}
								<a
									href={slide.secondaryBtn.href}
									class="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
								>
									{slide.secondaryBtn.text}
								</a>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Navigation Arrows -->
	{#if navigation && slides.length > 1}
		<button
			onclick={prevSlide}
			class="carousel-nav-btn carousel-nav-prev"
			aria-label="Previous slide"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</button>
		<button onclick={nextSlide} class="carousel-nav-btn carousel-nav-next" aria-label="Next slide">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	{/if}

	<!-- Pagination Dots -->
	{#if pagination && slides.length > 1}
		<div
			class="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2"
			role="tablist"
			aria-label="Slide navigation"
		>
			{#each slides as _, i}
				<button
					onclick={() => goToSlide(i)}
					class="carousel-dot {i === currentIndex ? 'carousel-dot-active' : ''}"
					aria-label="Go to slide {i + 1}"
					aria-selected={i === currentIndex}
					role="tab"
				></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.carousel-nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 5;
		display: flex;
		width: 48px;
		height: 48px;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		color: white;
		transition: all 0.3s ease;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.carousel-nav-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: translateY(-50%) scale(1.1);
	}

	.carousel-nav-btn:focus {
		outline: 2px solid #f97316;
		outline-offset: 2px;
	}

	.carousel-nav-prev {
		left: 16px;
	}

	.carousel-nav-next {
		right: 16px;
	}

	@media (max-width: 768px) {
		.carousel-nav-btn {
			width: 40px;
			height: 40px;
		}
		.carousel-nav-prev {
			left: 12px;
		}
		.carousel-nav-next {
			right: 12px;
		}
	}

	.carousel-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.5);
		transition: all 0.3s ease;
		cursor: pointer;
		border: none;
		padding: 0;
	}

	.carousel-dot:hover {
		background: rgba(255, 255, 255, 0.8);
	}

	.carousel-dot:focus {
		outline: 2px solid #f97316;
		outline-offset: 2px;
	}

	.carousel-dot-active {
		background: #f97316;
		transform: scale(1.2);
	}
</style>
