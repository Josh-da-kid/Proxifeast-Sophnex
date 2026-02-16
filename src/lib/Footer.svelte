<script lang="ts">
	import { page } from '$app/stores';

	let { restaurant = $page.data.restaurant } = $props();
</script>

<footer class="bg-base-200 text-base-content">
	<div class="container mx-auto px-6 py-12">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			<!-- Brand Section -->
			<div class="space-y-4">
				<div class="flex items-center gap-3">
					{#if restaurant?.faviconUrl}
						<img
							src={restaurant.faviconUrl}
							alt={restaurant.name}
							class="h-10 w-10 rounded-lg object-contain"
						/>
					{:else}
						<div
							class="bg-primary text-primary-content flex h-10 w-10 items-center justify-center rounded-lg"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
								<path d="M7 2v20" />
								<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
							</svg>
						</div>
					{/if}
					<span class="font-playfair text-xl font-bold">{restaurant?.name || 'Restaurant'}</span>
				</div>
				<p class="text-base-content/70 text-sm">
					{restaurant?.description || 'Delicious food delivered fast to your doorstep.'}
				</p>
				{#if restaurant?.restaurantAddress}
					<p class="text-base-content/60 flex items-start gap-2 text-sm">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="mt-0.5 shrink-0"
						>
							<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
							<circle cx="12" cy="10" r="3" />
						</svg>
						{restaurant.restaurantAddress}
					</p>
				{/if}
			</div>

			<!-- Company Links -->
			<div>
				<h6 class="footer-title text-base-content">Company</h6>
				<ul class="space-y-2 text-sm">
					<li>
						<a href="/about" class="link link-hover text-base-content/70 hover:text-primary"
							>About Us</a
						>
					</li>
					<li>
						<a href="/restaurants" class="link link-hover text-base-content/70 hover:text-primary"
							>Our Menu</a
						>
					</li>
					<li>
						<a href="/about" class="link link-hover text-base-content/70 hover:text-primary"
							>Careers</a
						>
					</li>
					<li>
						<a href="/about" class="link link-hover text-base-content/70 hover:text-primary">Blog</a
						>
					</li>
				</ul>
			</div>

			<!-- Support Links -->
			<div>
				<h6 class="footer-title text-base-content">Support</h6>
				<ul class="space-y-2 text-sm">
					<li>
						<a href="/contact" class="link link-hover text-base-content/70 hover:text-primary"
							>Contact Us</a
						>
					</li>
					<li>
						<a href="/about" class="link link-hover text-base-content/70 hover:text-primary">FAQ</a>
					</li>
					<li>
						<a href="/about" class="link link-hover text-base-content/70 hover:text-primary"
							>Shipping Info</a
						>
					</li>
					<li>
						<a href="/about" class="link link-hover text-base-content/70 hover:text-primary"
							>Help Center</a
						>
					</li>
				</ul>
			</div>

			<!-- Social & Newsletter -->
			<div>
				<h6 class="footer-title text-base-content">Connect With Us</h6>
				<div class="flex gap-4">
					<a
						href="https://instagram.com"
						target="_blank"
						rel="noopener noreferrer"
						class="btn btn-circle btn-ghost btn-sm"
						aria-label="Follow us on Instagram"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
							<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
							<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
						</svg>
					</a>
					<a
						href="https://facebook.com"
						target="_blank"
						rel="noopener noreferrer"
						class="btn btn-circle btn-ghost btn-sm"
						aria-label="Follow us on Facebook"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
						</svg>
					</a>
					<a
						href="https://twitter.com"
						target="_blank"
						rel="noopener noreferrer"
						class="btn btn-circle btn-ghost btn-sm"
						aria-label="Follow us on X (Twitter)"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
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
						href="https://youtube.com"
						target="_blank"
						rel="noopener noreferrer"
						class="btn btn-circle btn-ghost btn-sm"
						aria-label="Subscribe on YouTube"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"
							/>
							<path d="m10 15 5-3-5-3z" />
						</svg>
					</a>
				</div>
				<div class="mt-6">
					<p class="text-base-content/70 mb-3 text-sm">Subscribe to our newsletter</p>
					<div class="flex gap-2">
						<input
							type="email"
							placeholder="your@email.com"
							class="input input-bordered input-sm w-full max-w-xs"
						/>
						<button class="btn btn-primary btn-sm">Subscribe</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom Bar -->
		<div
			class="border-base-content/10 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row"
		>
			<p class="text-base-content/60 text-sm">
				&copy; {new Date().getFullYear()}
				{restaurant?.name || 'Restaurant'}. All rights reserved.
			</p>
			<div class="flex gap-4 text-sm">
				<a href="/about" class="text-base-content/60 hover:text-primary">Privacy Policy</a>
				<a href="/about" class="text-base-content/60 hover:text-primary">Terms of Service</a>
				<a href="/about" class="text-base-content/60 hover:text-primary">Cookie Policy</a>
			</div>
		</div>
	</div>
</footer>
