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

	async function checkScroll() {
		await tick();
		if (!containerRef) return;

		const el = containerRef;
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
		setTimeout(checkScroll, 150);
	}

	onMount(() => {
		checkScroll();
		const observer = new MutationObserver(checkScroll);
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
			class="absolute top-1/2 left-0 z-10 hidden h-10 w-10 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:border-amber-500 hover:bg-amber-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-400 sm:flex sm:h-12 sm:w-12 sm:-translate-x-6"
			aria-label="Scroll left"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 sm:h-5 sm:w-5"
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
	<div
		bind:this={containerRef}
		class="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:gap-6 sm:px-6 md:px-14"
		style="scrollbar-width: none; -ms-overflow-style: none;"
	>
		<slot />
	</div>

	{#if showArrows && itemCount > 1}
		<!-- Right Arrow -->
		<button
			onclick={() => scroll('right')}
			disabled={!canScrollRight}
			class="absolute top-1/2 right-0 z-10 hidden h-10 w-10 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:border-amber-500 hover:bg-amber-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-400 sm:flex sm:h-12 sm:w-12 sm:translate-x-6"
			aria-label="Scroll right"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 sm:h-5 sm:w-5"
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
