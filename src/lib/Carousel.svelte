<script lang="ts">
	import { onMount, tick } from 'svelte';

	let {
		showArrows = true,
		showDots = true,
		autoplay = false,
		autoplayDelay = 5000,
		scrollSpeed = 300
	}: {
		showArrows?: boolean;
		showDots?: boolean;
		autoplay?: boolean;
		autoplayDelay?: number;
		scrollSpeed?: number;
	} = $props();

	let containerRef: HTMLDivElement;
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);
	let itemCount = $state(0);
	let currentIndex = $state(0);
	let isMounted = $state(false);
	let autoplayInterval: ReturnType<typeof setInterval>;
	let touchStartX = 0;
	let touchEndX = 0;

	const itemWidth = $derived(() => {
		if (!containerRef) return 0;
		const firstChild = containerRef.firstElementChild as HTMLElement;
		return firstChild ? firstChild.offsetWidth + 16 : 0;
	});

	const maxIndex = $derived(() => {
		if (!containerRef) return 0;
		return Math.max(
			0,
			Math.ceil(containerRef.scrollWidth / itemWidth()) -
				Math.floor(containerRef.clientWidth / itemWidth())
		);
	});

	async function checkScroll() {
		await tick();
		if (!containerRef) return;

		const el = containerRef;
		const isScrollable = el.scrollWidth > el.clientWidth + 1;

		canScrollLeft = el.scrollLeft > 0;
		canScrollRight = isScrollable && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;

		itemCount = el.children.length;

		// Calculate current index
		const newIndex = Math.round(el.scrollLeft / itemWidth());
		currentIndex = Math.min(newIndex, maxIndex());
	}

	function scroll(direction: 'left' | 'right') {
		if (!containerRef) return;
		const scrollAmount = containerRef.clientWidth * 0.85;
		if (direction === 'left') {
			containerRef.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
		} else {
			containerRef.scrollBy({ left: scrollAmount, behavior: 'smooth' });
		}
		setTimeout(checkScroll, scrollSpeed);
	}

	function goToIndex(index: number) {
		if (!containerRef || index < 0 || index > maxIndex()) return;
		containerRef.scrollTo({
			left: index * itemWidth(),
			behavior: 'smooth'
		});
		currentIndex = index;
		setTimeout(checkScroll, scrollSpeed);
	}

	function startAutoplay() {
		if (autoplay && itemCount > 1) {
			autoplayInterval = setInterval(() => {
				if (currentIndex >= maxIndex()) {
					goToIndex(0);
				} else {
					goToIndex(currentIndex + 1);
				}
			}, autoplayDelay);
		}
	}

	function stopAutoplay() {
		if (autoplayInterval) {
			clearInterval(autoplayInterval);
		}
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
		stopAutoplay();
	}

	function handleTouchEnd(e: TouchEvent) {
		touchEndX = e.changedTouches[0].screenX;
		handleSwipe();
		startAutoplay();
	}

	function handleSwipe() {
		const diff = touchStartX - touchEndX;
		if (Math.abs(diff) > 50) {
			if (diff > 0) {
				scroll('right');
			} else {
				scroll('left');
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') scroll('left');
		if (e.key === 'ArrowRight') scroll('right');
	}

	async function initScroll() {
		isMounted = true;
		for (let i = 0; i < 3; i++) {
			await checkScroll();
			await new Promise((r) => setTimeout(r, 100));
		}
	}

	onMount(() => {
		initScroll();
		startAutoplay();

		const observer = new MutationObserver(() => {
			checkScroll();
		});

		if (containerRef) {
			observer.observe(containerRef, { childList: true, subtree: true });
			containerRef.addEventListener('scroll', checkScroll);
			containerRef.addEventListener('mouseenter', stopAutoplay);
			containerRef.addEventListener('mouseleave', startAutoplay);
			window.addEventListener('resize', checkScroll);
		}

		return () => {
			stopAutoplay();
			observer.disconnect();
			containerRef?.removeEventListener('scroll', checkScroll);
			containerRef?.removeEventListener('mouseenter', stopAutoplay);
			containerRef?.removeEventListener('mouseleave', startAutoplay);
			window.removeEventListener('resize', checkScroll);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative mx-auto max-w-7xl">
	<!-- Carousel Container -->
	<div
		bind:this={containerRef}
		class="carousel-ordr-track snap-x snap-mandatory overflow-x-auto pb-4"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		role="region"
		aria-label="Carousel"
	>
		<slot />
	</div>

	<!-- Left Arrow -->
	{#if showArrows && itemCount > 1}
		<button
			onclick={() => scroll('left')}
			disabled={!canScrollLeft}
			class="carousel-ordr-btn carousel-ordr-btn-left
			{canScrollLeft ? 'opacity-100' : 'pointer-events-none opacity-0'}"
			aria-label="Scroll left"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<!-- Right Arrow -->
		<button
			onclick={() => scroll('right')}
			disabled={!canScrollRight}
			class="carousel-ordr-btn carousel-ordr-btn-right
				{canScrollRight ? 'opacity-100' : 'pointer-events-none opacity-0'}"
			aria-label="Scroll right"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	{/if}

	<!-- Pagination Dots -->
	{#if showDots && itemCount > 1}
		<div class="flex justify-center gap-2 pt-2" role="tablist" aria-label="Slide navigation">
			{#each Array(maxIndex() + 1) as _, i}
				<button
					onclick={() => goToIndex(i)}
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
	.carousel-ordr-track {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.carousel-ordr-track::-webkit-scrollbar {
		display: none;
	}

	.carousel-ordr-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 20;
		display: flex;
		width: 40px;
		height: 40px;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: white;
		color: #334155;
		transition: all 0.3s ease;
		cursor: pointer;
		border: 1px solid #e5e7eb;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.carousel-ordr-btn:hover:not(:disabled) {
		background: #f97316;
		color: white;
		border-color: #f97316;
		transform: translateY(-50%) scale(1.1);
	}

	.carousel-ordr-btn:focus {
		outline: 2px solid #f97316;
		outline-offset: 2px;
	}

	.carousel-ordr-btn:disabled {
		cursor: not-allowed;
	}

	.carousel-ordr-btn-left {
		left: -20px;
	}

	.carousel-ordr-btn-right {
		right: -20px;
	}

	@media (max-width: 768px) {
		.carousel-ordr-btn {
			display: none;
		}
	}

	.carousel-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #cbd5e1;
		transition: all 0.3s ease;
		cursor: pointer;
		border: none;
		padding: 0;
	}

	.carousel-dot:hover {
		background: #94a3b8;
	}

	.carousel-dot:focus {
		outline: 2px solid #f97316;
		outline-offset: 2px;
	}

	.carousel-dot-active {
		background: #f97316;
		transform: scale(1.3);
		width: 24px;
		border-radius: 4px;
	}
</style>
