<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount, tick } from 'svelte';

	let {
		children,
		showArrows = true,
		showDots = true,
		showViewToggle = true,
		headerAligned = false,
		autoplay = false,
		autoplayDelay = 5000,
		scrollSpeed = 300
	}: {
		showArrows?: boolean;
		showDots?: boolean;
		showViewToggle?: boolean;
		headerAligned?: boolean;
		autoplay?: boolean;
		autoplayDelay?: number;
		scrollSpeed?: number;
		children?: () => any;
	} = $props();

	let containerRef = $state<HTMLDivElement | undefined>(undefined);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);
	let itemCount = $state(0);
	let currentIndex = $state(0);
	let isMounted = $state(false);
	let autoplayInterval: ReturnType<typeof setInterval>;
	let touchStartX = 0;
	let touchEndX = 0;
	let viewMode = $state<'carousel' | 'grid'>('carousel');
	let hasManualViewMode = false;

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
		if (viewMode === 'grid') return;
		if (e.key === 'ArrowLeft') scroll('left');
		if (e.key === 'ArrowRight') scroll('right');
	}

	async function toggleViewMode() {
		hasManualViewMode = true;
		viewMode = viewMode === 'carousel' ? 'grid' : 'carousel';
		await tick();
		await checkScroll();
	}

	function syncDesktopDefault() {
		if (hasManualViewMode || typeof window === 'undefined') return;
		viewMode = window.innerWidth >= 1024 ? 'grid' : 'carousel';
	}

	async function initScroll() {
		isMounted = true;
		for (let i = 0; i < 3; i++) {
			await checkScroll();
			await new Promise((r) => setTimeout(r, 100));
		}
	}

	onMount(() => {
		syncDesktopDefault();
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
			window.addEventListener('resize', syncDesktopDefault);
		}

		return () => {
			stopAutoplay();
			observer.disconnect();
			containerRef?.removeEventListener('scroll', checkScroll);
			containerRef?.removeEventListener('mouseenter', stopAutoplay);
			containerRef?.removeEventListener('mouseleave', startAutoplay);
			window.removeEventListener('resize', checkScroll);
			window.removeEventListener('resize', syncDesktopDefault);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative mx-auto max-w-7xl">
	{#if showViewToggle && isMounted && itemCount > 1}
		<div class:carousel-header-toggle={headerAligned} class="mb-4 flex justify-end">
			<button
				type="button"
				onclick={toggleViewMode}
				class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600"
				aria-label={viewMode === 'carousel' ? 'Switch to grid view' : 'Switch to carousel view'}
			>
				{#if viewMode === 'carousel'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="7" height="7" rx="1"></rect>
						<rect x="14" y="3" width="7" height="7" rx="1"></rect>
						<rect x="3" y="14" width="7" height="7" rx="1"></rect>
						<rect x="14" y="14" width="7" height="7" rx="1"></rect>
					</svg>
					<span>Grid View</span>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 7h18"></path>
						<path d="M3 12h18"></path>
						<path d="M3 17h18"></path>
					</svg>
					<span>Carousel View</span>
				{/if}
			</button>
		</div>
	{/if}

	{#key viewMode}
		<div transition:fade={{ duration: 220 }}>
			<!-- Carousel Container -->
			<div
				bind:this={containerRef}
				class:carousel-grid-mode={viewMode === 'grid'}
				class="carousel-ordr-track pb-4"
				class:snap-x={viewMode === 'carousel'}
				class:snap-mandatory={viewMode === 'carousel'}
				class:overflow-x-auto={viewMode === 'carousel'}
				role="region"
				aria-label={viewMode === 'carousel' ? 'Carousel' : 'Grid'}
				ontouchstart={viewMode === 'carousel' ? handleTouchStart : undefined}
				ontouchend={viewMode === 'carousel' ? handleTouchEnd : undefined}
			>
				{@render children?.()}
			</div>

			<!-- Left Arrow -->
			{#if viewMode === 'carousel' && showArrows && itemCount > 1}
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
			{#if viewMode === 'carousel' && showDots && itemCount > 1}
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
	{/key}
</div>

<style>
	.carousel-ordr-track {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.carousel-ordr-track::-webkit-scrollbar {
		display: none;
	}

	.carousel-grid-mode {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		overflow: visible;
	}

	@media (min-width: 768px) {
		.carousel-grid-mode {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1280px) {
		.carousel-grid-mode {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.carousel-grid-mode :global(> *) {
		width: 100% !important;
		min-width: 0 !important;
		max-width: none !important;
		flex-shrink: 1 !important;
		scroll-snap-align: unset !important;
	}

	.carousel-ordr-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 5;
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

	.carousel-header-toggle {
		position: absolute;
		top: -4.25rem;
		right: 0;
		margin-bottom: 0;
		z-index: 6;
	}

	@media (max-width: 640px) {
		.carousel-header-toggle {
			top: -3.75rem;
		}
	}
</style>
