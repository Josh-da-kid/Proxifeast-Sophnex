<script>
	import { fade, fly } from 'svelte/transition';
</script>

<!-- About Section -->
<section id="about" class="bg-base-200 rounded-t-xl px-6 py-16 text-center md:px-20">
	<h2
		class="font-playfair text-primary mt-10 mb-8 text-5xl font-semibold"
		in:fly={{ x: 200, duration: 800 }}
	>
		About Chef Zhanga Foods
	</h2>
	<p
		class="text-base-content mx-auto max-w-4xl text-lg leading-relaxed md:text-xl"
		in:fade={{ duration: 900, delay: 400 }}
	>
		At Chef Zhanga Foods, we celebrate Nigerian culinary heritage with a modern twist. Our dishes
		are crafted from fresh, locally sourced ingredients with passion and care. Join us for an
		unforgettable dining experience filled with tradition, flavor, and warmth.
	</p>
</section>
