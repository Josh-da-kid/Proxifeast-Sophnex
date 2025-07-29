<script>
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	const restaurantName = get(page).data.restaurant.name;
</script>

<!-- About Section -->
<section id="about" class="rounded-t-xl px-6 py-16 text-center md:px-20">
	<h2
		class="font-playfair text-primary mb-8 text-5xl font-semibold"
		in:fly={{ x: 200, duration: 800 }}
	>
		About {restaurantName}
	</h2>
	<p
		class="text-base-content mx-auto max-w-4xl text-lg leading-relaxed md:text-xl"
		in:fade={{ duration: 900, delay: 400 }}
	>
		At {restaurantName}, we celebrate Nigerian culinary heritage with a modern twist. Our dishes are
		crafted from fresh, locally sourced ingredients with passion and care. Join us for an
		unforgettable dining experience filled with tradition, flavor, and warmth.
	</p>
</section>
