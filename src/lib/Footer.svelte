<script lang="ts">
	import { page } from '$app/stores';

	let { restaurant } = $props();

	const restaurantData = $derived(restaurant ?? $page.data.restaurant);
	const isSuper = $derived($page.data.isSuper ?? false);

	let email = $state('');
	let isSubscribing = $state(false);
	let subscribeSuccess = $state(false);
	let subscribeError = $state('');

	async function handleSubscribe(e: Event) {
		e.preventDefault();
		if (!email) return;

		isSubscribing = true;
		subscribeError = '';

		try {
			const res = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			if (res.ok) {
				subscribeSuccess = true;
				email = '';
			} else {
				subscribeError = 'Failed to subscribe. Please try again.';
			}
		} catch (err) {
			subscribeError = 'An error occurred. Please try again.';
		} finally {
			isSubscribing = false;
		}
	}

	const currentYear = new Date().getFullYear();
</script>

<footer class="mt-12 bg-[#0f172a] text-white">
	<div class="mx-auto max-w-7xl px-6 py-16">
		<div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
			<!-- Brand Column -->
			<div class="lg:col-span-2">
				<div class="mb-5 flex items-center gap-3">
					{#if restaurantData?.faviconUrl}
						<img
							src={restaurantData.faviconUrl}
							alt={restaurantData.name}
							class="h-10 w-10 rounded-lg bg-white object-contain"
						/>
					{:else}
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600"
						>
							<span class="text-lg font-bold text-white">P</span>
						</div>
					{/if}
					<span class="font-heading text-xl font-bold">{restaurantData?.name || 'Proxifeast'}</span>
				</div>
				<p class="mb-6 max-w-sm text-sm leading-relaxed text-slate-400">
					{restaurantData?.description ||
						"Nigeria's premier hospitality experience platform. Transform your restaurant, bar, café, or hotel with modern QR-powered technology."}
				</p>
				<!-- Contact Info -->
				<div class="space-y-2 text-sm">
					<a
						href="tel:+2347068346403"
						class="flex items-center gap-2 text-slate-300 transition-colors hover:text-orange-400"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
							/>
						</svg>
						+234 706 834 6403
					</a>
					<a
						href="mailto:support@proxifeast.com"
						class="flex items-center gap-2 text-slate-300 transition-colors hover:text-orange-400"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
							/>
							<polyline points="22,6 12,13 2,6" />
						</svg>
						support@proxifeast.com
					</a>
				</div>
			</div>

			<!-- Products -->
			<div>
				<h4 class="font-heading mb-4 text-sm font-semibold tracking-wide text-slate-200 uppercase">
					Products
				</h4>
				<ul class="space-y-2.5">
					<li>
						<a
							href="/subscriptions"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							Pricing
						</a>
					</li>
					<li>
						<a
							href="/business/restaurants"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							For Restaurants & Bars
						</a>
					</li>
					<li>
						<a
							href="/business/hotels"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							For Hotels
						</a>
					</li>
					<li>
						<a
							href="/business/cafes"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							For Cafés
						</a>
					</li>
					<li>
						<a
							href="/business/chefs"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							For Chefs
						</a>
					</li>
				</ul>
			</div>

			<!-- Company -->
			<div>
				<h4 class="font-heading mb-4 text-sm font-semibold tracking-wide text-slate-200 uppercase">
					Company
				</h4>
				<ul class="space-y-2.5">
					<li>
						<a href="/about" class="text-sm text-slate-400 transition-colors hover:text-orange-400">
							About Us
						</a>
					</li>
					<li>
						<a
							href="/contact"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							Contact
						</a>
					</li>
					<li>
						<a
							href="/careers"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							Careers
						</a>
					</li>
					<li>
						<a href="/blog" class="text-sm text-slate-400 transition-colors hover:text-orange-400">
							Blog
						</a>
					</li>
				</ul>
			</div>

			<!-- Support -->
			<div>
				<h4 class="font-heading mb-4 text-sm font-semibold tracking-wide text-slate-200 uppercase">
					Support
				</h4>
				<ul class="space-y-2.5">
					<li>
						<a href="/faq" class="text-sm text-slate-400 transition-colors hover:text-orange-400">
							FAQ
						</a>
					</li>
					<li>
						<a
							href="/privacy"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							Privacy Policy
						</a>
					</li>
					<li>
						<a href="/terms" class="text-sm text-slate-400 transition-colors hover:text-orange-400">
							Terms of Service
						</a>
					</li>
					<li>
						<a
							href="/install-guide"
							class="text-sm text-slate-400 transition-colors hover:text-orange-400"
						>
							Install App
						</a>
					</li>
				</ul>
			</div>
		</div>

		<!-- Newsletter Section -->
		<div class="mt-12 border-t border-slate-800 pt-8">
			<div class="flex flex-col items-center justify-between gap-6 lg:flex-row">
				<div class="text-center lg:text-left">
					<h4 class="font-heading text-lg font-semibold">Stay Updated</h4>
					<p class="mt-1 text-sm text-slate-400">
						Subscribe to our newsletter for updates and exclusive offers.
					</p>
				</div>
				{#if subscribeSuccess}
					<div
						class="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400"
					>
						✓ Thanks for subscribing!
					</div>
				{:else}
					<form onsubmit={handleSubscribe} class="flex w-full gap-2 lg:w-auto">
						<input
							type="email"
							bind:value={email}
							placeholder="Enter your email"
							class="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-all focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none lg:w-64"
							required
						/>
						<button
							type="submit"
							disabled={isSubscribing}
							class="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:opacity-50"
						>
							{#if isSubscribing}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								Subscribe
							{/if}
						</button>
					</form>
				{/if}
			</div>
			{#if subscribeError}
				<p class="mt-2 text-sm text-red-400">{subscribeError}</p>
			{/if}
		</div>

		<!-- Bottom Bar -->
		<div class="mt-10 border-t border-slate-800 pt-6">
			<div
				class="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row"
			>
				<p>
					© {currentYear}
					{restaurantData?.name || 'Proxifeast'}. All rights reserved.
				</p>
				<div class="flex items-center gap-6">
					<!-- Social Links -->
					<div class="flex gap-4">
						<a
							href="https://instagram.com/proxifeast"
							target="_blank"
							rel="noopener noreferrer"
							class="text-slate-500 transition-colors hover:text-orange-400"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
								<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
								<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
							</svg>
						</a>
						<a
							href="https://twitter.com/proxifeast"
							target="_blank"
							rel="noopener noreferrer"
							class="text-slate-500 transition-colors hover:text-orange-400"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
								/>
							</svg>
						</a>
						<a
							href="https://wa.me/2347068346403"
							target="_blank"
							rel="noopener noreferrer"
							class="text-slate-500 transition-colors hover:text-orange-400"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path
									d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
								/>
							</svg>
						</a>
						<a
							href="https://linkedin.com/company/proxifeast"
							target="_blank"
							rel="noopener noreferrer"
							class="text-slate-500 transition-colors hover:text-orange-400"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
								/>
								<rect x="2" y="9" width="4" height="12" />
								<circle cx="4" cy="4" r="2" />
							</svg>
						</a>
					</div>
					<span>|</span>
					<div class="flex gap-4">
						<a href="/privacy" class="transition-colors hover:text-orange-400">Privacy</a>
						<a href="/terms" class="transition-colors hover:text-orange-400">Terms</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>
