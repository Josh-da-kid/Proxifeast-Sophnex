<script lang="ts">
	import Footer from '$lib/Footer.svelte';
	import Nav from '$lib/Nav.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
	<!-- Fixed Navbar (not part of flow) -->
	<Nav class="fixed top-0 z-20 w-full" />

	<!-- Main content (takes up remaining space) -->
	<main class="flex-grow">
		<!-- add padding top to avoid nav overlap -->
		{@render children()}
	</main>

	<!-- Footer always at bottom -->
	<Footer />
</div>
