<script lang="ts">
	import { page } from '$app/stores';
	import { addToCart } from '$lib/stores/cart';
	import { fly } from 'svelte/transition';

	// Optional: rename for clarity
	const dishes = $page.data.dishes;
</script>

<h2 class="mb-4 ml-4 text-xl font-bold">All Dishes</h2>
{#if dishes.length > 0}
	<div class="grid grid-cols-1 space-y-4 space-x-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
		{#each dishes as dish}
			<article
				class="card card-compact bg-base-200 transform cursor-pointer overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:scale-105"
				in:fly={{ y: 50, duration: 600 }}
			>
				<figure>
					<img src={dish.image} alt={dish.name} class="h-48 w-full object-cover" />
				</figure>

				<div class="card-body">
					<h4 class="card-title text-primary font-playfair">{dish.name}</h4>
					<p class="text-base-content">{dish.description}</p>

					<div class="mr-3 flex justify-between">
						<div class="flex items-baseline gap-2">
							{#if dish.promoAmount && dish.promoAmount < dish.defaultAmount}
								<p class="text-secondary font-bold">
									₦{Number(dish.promoAmount).toLocaleString()}
								</p>
								<p class="text-gray-400 line-through">
									₦{Number(dish.defaultAmount).toLocaleString()}
								</p>

								<span class="badge badge-accent">
									-{Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100)}% OFF
								</span>
							{:else}
								<p class="font-bold text-neutral-700">
									₦{Number(dish.defaultAmount).toLocaleString()}
								</p>
							{/if}
						</div>

						<div class="flex gap-3">
							<div class="tooltip" data-tip="view"></div>

							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="tooltip" data-tip="edit dish">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
									><g
										fill="none"
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										><path
											d="M19.09 14.441v4.44a2.37 2.37 0 0 1-2.369 2.369H5.12a2.37 2.37 0 0 1-2.369-2.383V7.279a2.356 2.356 0 0 1 2.37-2.37H9.56"
										/><path
											d="M6.835 15.803v-2.165c.002-.357.144-.7.395-.953l9.532-9.532a1.36 1.36 0 0 1 1.934 0l2.151 2.151a1.36 1.36 0 0 1 0 1.934l-9.532 9.532a1.36 1.36 0 0 1-.953.395H8.197a1.36 1.36 0 0 1-1.362-1.362M19.09 8.995l-4.085-4.086"
										/></g
									></svg
								>
							</div>
						</div>
					</div>
				</div>
			</article>
		{/each}
	</div>
{:else}
	<p>No orders yet.</p>
{/if}
