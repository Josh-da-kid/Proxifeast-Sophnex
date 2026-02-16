<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';

	const restaurant = get(page).data.restaurant;
</script>

<svelte:head>
	<title>About - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-stone-50">
	<!-- Hero -->
	<section
		class="relative overflow-hidden bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 py-20 text-center text-white"
	>
		<div class="absolute inset-0 opacity-10">
			<svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
				<pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
					<path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5" />
				</pattern>
				<rect width="100" height="100" fill="url(#grid)" />
			</svg>
		</div>
		<div class="relative container mx-auto px-4">
			<div class="mx-auto max-w-3xl">
				<h1
					class="font-playfair mb-4 text-4xl font-bold md:text-5xl"
					in:fly={{ y: 30, duration: 600 }}
				>
					About Proxifeast
				</h1>
				<p class="text-lg font-medium text-amber-200" in:fade={{ duration: 600, delay: 200 }}>
					YOUR FEAST IS JUST A SCAN AWAY
				</p>
			</div>
		</div>
	</section>

	<!-- Content -->
	<section class="container mx-auto px-4 py-16">
		<div class="mx-auto max-w-4xl">
			<!-- What is Proxifeast -->
			<article
				class="mb-12 rounded-2xl bg-white p-8 shadow-lg md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 300 }}
			>
				<div class="mb-6 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-amber-600"
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
					<h2 class="font-playfair text-2xl font-semibold text-gray-900">What is Proxifeast?</h2>
				</div>
				<p class="leading-relaxed text-gray-600">
					Proxifeast is a digital hospitality platform that hosts and manages restaurants online. We
					provide seamless online menu experiences through innovative QR code scanning technology.
					Our platform enables restaurants to offer contactless, hassle-free ordering to their
					customers.
				</p>
				<p class="mt-4 leading-relaxed text-gray-600">
					We bridge the gap between traditional dining and modern technology, making it easier than
					ever for customers to browse menus, place orders, and enjoy their favorite meals—whether
					dining in or taking out.
				</p>
			</article>

			<!-- What We Do -->
			<article
				class="mb-12 rounded-2xl bg-white p-8 shadow-lg md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 400 }}
			>
				<div class="mb-6 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-amber-600"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<path d="M7 7h.01" />
							<path d="M17 7h.01" />
							<path d="M7 17h.01" />
							<path d="M17 17h.01" />
						</svg>
					</div>
					<h2 class="font-playfair text-2xl font-semibold text-gray-900">How It Works</h2>
				</div>
				<p class="leading-relaxed text-gray-600">
					Restaurants partner with Proxifeast to create digital menus accessible via QR codes.
					Customers simply scan the QR code at their table or on their receipt to instantly access
					the full menu, place orders, and make payments—all from their own device.
				</p>
				<div class="mt-6 grid gap-4 md:grid-cols-3">
					{#each [{ step: '01', title: 'Scan QR Code', desc: 'Scan the QR code at your table' }, { step: '02', title: 'Browse Menu', desc: 'Explore dishes and add to cart' }, { step: '03', title: 'Order & Pay', desc: 'Place order and pay seamlessly' }] as item}
						<div class="text-center">
							<div
								class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white"
							>
								{item.step}
							</div>
							<h3 class="font-medium text-gray-900">{item.title}</h3>
							<p class="mt-1 text-sm text-gray-500">{item.desc}</p>
						</div>
					{/each}
				</div>
			</article>

			<!-- Features Grid -->
			<div class="mb-12 grid gap-6 md:grid-cols-2">
				{#each [{ icon: 'qr', title: 'QR Code Menus', desc: 'Contactless menu access for safe and convenient dining' }, { icon: 'online', title: 'Online Ordering', desc: 'Easy ordering directly from your smartphone' }, { icon: 'payment', title: 'Digital Payments', desc: 'Secure online payments through Paystack' }, { icon: 'realtime', title: 'Real-time Orders', desc: 'Instant order notifications for restaurants' }] as feature, i}
					<article
						class="rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
						in:fly={{ y: 30, duration: 400, delay: 500 + i * 100 }}
					>
						<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
							{#if feature.icon === 'qr'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-amber-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="3" y="3" width="7" height="7" />
									<rect x="14" y="3" width="7" height="7" />
									<rect x="3" y="14" width="7" height="7" />
									<path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17v3M17 14h3" />
								</svg>
							{:else if feature.icon === 'online'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-amber-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="2" y="3" width="20" height="14" rx="2" />
									<line x1="8" x2="16" y1="21" y2="21" />
									<line x1="12" x2="12" y1="17" y2="21" />
								</svg>
							{:else if feature.icon === 'payment'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-amber-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect x="1" y="4" width="22" height="16" rx="2" />
									<line x1="1" x2="23" y1="10" y2="10" />
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-amber-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10" />
									<polyline points="12 6 12 12 16 14" />
								</svg>
							{/if}
						</div>
						<h3 class="font-playfair mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
						<p class="text-sm text-gray-600">{feature.desc}</p>
					</article>
				{/each}
			</div>

			<!-- CTA -->
			<article
				class="rounded-2xl bg-gradient-to-r from-amber-700 to-amber-600 p-8 text-center text-white md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 700 }}
			>
				<h2 class="font-playfair mb-3 text-2xl font-bold">Partner With Us</h2>
				<p class="mb-6 text-white/90">
					Bring your restaurant online with Proxifeast. Scan, order, feast!
				</p>
				<a
					href="/contact"
					class="inline-block rounded-xl bg-white px-8 py-3 font-medium text-amber-700 transition-all hover:bg-gray-100"
				>
					Get Started
				</a>
			</article>
		</div>
	</section>
</div>
