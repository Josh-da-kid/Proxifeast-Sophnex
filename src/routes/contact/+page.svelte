<script>
	import { cubicOut } from 'svelte/easing';
	import { fly, scale } from 'svelte/transition';
</script>

<!-- Contact Section -->
<section id="contact" class="px-6 py-16 text-center md:px-20">
	<h2
		class="font-playfair text-primary mb-8 text-5xl font-semibold"
		in:fly={{ y: -100, duration: 800 }}
	>
		Contact Us
	</h2>

	<div class="text-base-content mx-auto max-w-3xl space-y-6 text-lg">
		<p><strong>Phone:</strong> +234 123 456 7890</p>
		<p><strong>Address:</strong> 123 Food Street, Abuja</p>

		<div
			class="border-base-300 overflow-hidden rounded-lg border shadow-lg"
			in:scale={{ duration: 700, easing: cubicOut }}
		>
			<iframe
				title="Proxifeast Restaurant Location"
				class="h-64 w-full md:h-96"
				src="https://maps.google.com/maps?q=Calabar&t=&z=13&ie=UTF8&iwloc=&output=embed"
				loading="lazy"
				aria-label="Google Maps location of ProxiFeast Restaurant"
				frameborder="0"
			></iframe>
		</div>
	</div>
</section>
