<script>
	import { onMount } from "svelte";

	let restaurants = [];

	onMount(async () => {
		try {
			const res = await fetch("https://playgzero.pb.itcass.net/api/collections/restaurants/records"); 
			// 👆 Replace with your PocketBase API endpoint
			const data = await res.json();
			restaurants = data.items;
		} catch (err) {
			console.error("Failed to fetch restaurants:", err);
		}
	});
</script>

<div class="min-h-screen bg-gray-50 py-12 px-6 md:px-12">
	<h1 class="text-3xl md:text-4xl font-bold text-center mb-10">
		🍽 Featured Restaurants on <span class="text-yellow-500">Proxifeast</span>
	</h1>

	<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
		{#each restaurants as r}
			<div class="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 flex flex-col">
				<div class="flex items-center space-x-4 mb-4">
					<img src={r.faviconUrl || r.logoUrl} alt={r.name} class="w-16 h-16 object-contain rounded-full border" />
					<div>
						<h2 class="text-xl font-semibold">{r.name}</h2>
						<p class="text-sm text-gray-500">{r.motto}</p>
					</div>
				</div>
				
				<p class="text-gray-600 mb-4 line-clamp-3">{r.description}</p>
				
				<div class="text-sm text-gray-500 mb-6">
					📍 {r.restaurantAddress}
				</div>

				<a href={r.domain} target="_blank" rel="noopener noreferrer"
					class="mt-auto inline-block bg-yellow-500 text-white text-center px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition">
					Visit & Order
				</a>
			</div>
		{/each}
	</div>
</div>
