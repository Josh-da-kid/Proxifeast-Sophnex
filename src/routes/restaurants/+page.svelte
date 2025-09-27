<script>
	import { onMount } from 'svelte';

	let restaurants = [];

	onMount(async () => {
		try {
			const res = await fetch(
				'https://playgzero.pb.itcass.net/api/collections/restaurants/records'
			);
			// 👆 Replace with your PocketBase API endpoint
			const data = await res.json();
			restaurants = data.items;
		} catch (err) {
			console.error('Failed to fetch restaurants:', err);
		}
	});
</script>

<div class="min-h-screen bg-gray-50 px-6 py-12 md:px-12">
	<h1 class="mb-10 text-center text-3xl font-bold md:text-4xl">
		🍽 Featured Restaurants on <span class="text-yellow-500">Proxifeast</span>
	</h1>

	<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
		{#each restaurants as r}
			<div class="flex flex-col rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
				<div class="mb-4 flex items-center space-x-4">
					<img
						src={r.faviconUrl || r.logoUrl}
						alt={r.name}
						class="h-16 w-16 rounded-full border object-contain"
					/>
					<div>
						<h2 class="text-xl font-semibold">{r.name}</h2>
						<p class="text-sm text-gray-500">{r.motto}</p>
					</div>
				</div>

				<p class="mb-4 line-clamp-3 text-gray-600">{r.description}</p>

				<div class="mb-6 text-sm text-gray-500">
					📍 {r.restaurantAddress}
				</div>

				<a
					href={`https://${r.domain}/#menu`}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-auto inline-block rounded-lg bg-yellow-500 px-4 py-2 text-center font-medium text-white transition hover:bg-yellow-600"
				>
					Visit & Order
				</a>
			</div>
		{/each}
	</div>
</div>
