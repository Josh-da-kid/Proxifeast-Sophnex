<script lang="ts">
	import { onMount, tick } from 'svelte';

	let {
		showArrows = true
	}: {
		showArrows?: boolean;
	} = $props();

	let containerRef: HTMLDivElement;
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);
	let itemCount = $state(0);
	let isMounted = $state(false);

	async function checkScroll() {
		await tick();
		if (!containerRef) return;

		const el = containerRef;

		// Wait for content to render
		await tick();

		const isScrollable = el.scrollWidth > el.clientWidth + 1;

		canScrollLeft = el.scrollLeft > 0;
		canScrollRight = isScrollable && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;

		// Count items
		itemCount = el.children.length;
	}

	function scroll(direction: 'left' | 'right') {
		if (!containerRef) return;
		const scrollAmount = containerRef.clientWidth * 0.85;
		if (direction === 'left') {
			containerRef.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
		} else {
			containerRef.scrollBy({ left: scrollAmount, behavior: 'smooth' });
		}
		setTimeout(checkScroll, 200);
	}

	async function initScroll() {
		isMounted = true;
		// Multiple attempts to ensure DOM is ready
		for (let i = 0; i < 3; i++) {
			await checkScroll();
			await new Promise((r) => setTimeout(r, 100));
		}
	}

	onMount(() => {
		initScroll();

		const observer = new MutationObserver(() => {
			checkScroll();
		});

		if (containerRef) {
			observer.observe(containerRef, { childList: true, subtree: true });
			containerRef.addEventListener('scroll', checkScroll);
			window.addEventListener('resize', checkScroll);
		}

		return () => {
			observer.disconnect();
			containerRef?.removeEventListener('scroll', checkScroll);
			window.removeEventListener('resize', checkScroll);
		};
	});
</script>

<div class="relative mx-auto max-w-7xl pb-4">
	{#if showArrows && itemCount > 1}
		<!-- Left Arrow -->
		<button
			onclick={() => scroll('left')}
			disabled={!canScrollLeft}
			class="carousel-ordr-btn carousel-ordr-btn-left
			{canScrollLeft ? '' : 'opacity-40'}"
			style={canScrollLeft ? '' : 'display: none;'}
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
	{/if}

	<!-- Carousel Container -->
	<div bind:this={containerRef} class="carousel-ordr-track snap-x snap-mandatory">
		<slot />
	</div>

	{#if showArrows && itemCount > 1}
		<!-- Right Arrow -->
		<button
			onclick={() => scroll('right')}
			disabled={!canScrollRight}
			class="carousel-ordr-btn carousel-ordr-btn-right
				{canScrollRight ? '' : 'opacity-40'}"
			style={canScrollRight ? '' : 'display: none;'}
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
</div>
