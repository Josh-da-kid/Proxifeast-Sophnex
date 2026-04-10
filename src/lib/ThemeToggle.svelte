<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let currentTheme = $state('light');
	let mounted = $state(false);

	onMount(() => {
		theme.init();
		theme.subscribe((t) => {
			currentTheme = t;
		});
		mounted = true;
	});

	function toggleTheme() {
		theme.toggle();
	}
</script>

{#if mounted}
	<button
		onclick={toggleTheme}
		class="btn btn-circle btn-ghost btn-sm swap swap-rotate"
		class:swap-active={currentTheme === 'dark'}
		aria-label="Toggle dark mode"
	>
		<!-- Sun icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 fill-current transition-transform duration-300 {currentTheme
				? 'rotate-0 scale-100'
				: '-rotate-90 scale-0'}"
			viewBox="0 0 24 24"
		>
			<path
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				fill="none"
			/>
		</svg>

		<!-- Moon icon -->
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="absolute h-5 w-5 fill-current transition-transform duration-300 {currentTheme
				? 'rotate-0 scale-100'
				: 'rotate-90 scale-0'}"
			viewBox="0 0 24 24"
		>
			<path
				d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				fill="none"
			/>
		</svg>
	</button>
{/if}