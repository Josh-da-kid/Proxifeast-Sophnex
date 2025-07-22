<script>
	import { fly } from 'svelte/transition';
</script>

<main>
	<h1 class="mb-4 text-center text-2xl font-bold" in:fly={{ x: 200, duration: 800 }}>
		Reservation Orders
	</h1>
</main>
