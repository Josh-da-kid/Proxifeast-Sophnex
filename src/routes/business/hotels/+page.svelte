<script context="module" lang="ts">
	const tips = [
		{
			icon: '🔗',
			title: 'Integrate Room Service',
			description:
				'Enable guests to order directly from their rooms using QR codes linked to your digital menu.'
		},
		{
			icon: '📦',
			title: 'Create Exclusive Packages',
			description:
				'Offer special packages for guests including breakfast, dinner, or event combinations.'
		},
		{
			icon: '🍽️',
			title: 'Highlight Local Cuisine',
			description:
				'Showcase local specialties and regional dishes to give guests an authentic experience.'
		},
		{
			icon: '📱',
			title: 'Train Staff on Digital Systems',
			description:
				'Ensure your team is proficient with the digital ordering system for smooth operations.'
		},
		{
			icon: '🌙',
			title: 'Offer Late-Night Dining',
			description:
				'Keep kitchen operations running late for guests with odd schedules or late arrivals.'
		},
		{
			icon: '📊',
			title: 'Track Performance',
			description: 'Use analytics to understand guest preferences and optimize your menu offerings.'
		}
	];

	const features = [
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3V3z"/><path d="M12 8v8M8 12h8"/></svg>`,
			title: 'Room Service QR Codes',
			description: 'Generate unique QR codes for each room that links to your digital menu.'
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>`,
			title: 'Real-time Orders',
			description: 'Receive and manage orders instantly from the kitchen display system.'
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
			title: 'Staff Management',
			description: 'Assign roles and track performance for kitchen and service staff.'
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
			title: 'Bill to Room',
			description: 'Automatically charge orders to guest rooms for seamless checkout.'
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
			title: 'Guest Communication',
			description: 'Send order updates and confirmations via WhatsApp and email.'
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
			title: 'Analytics Dashboard',
			description: 'Track revenue, popular items, and guest preferences with detailed reports.'
		}
	];
</script>

<script lang="ts">
	import { fade, fly } from 'svelte/transition';
</script>

<svelte:head>
	<title>Hotel Success Guide | Proxifeast</title>
	<meta
		name="description"
		content="Enhancing your hotel's food and beverage services with room service integration"
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Hero Section -->
	<section
		class="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-20 text-center text-white"
	>
		<!-- Background Pattern -->
		<div class="absolute inset-0 opacity-10">
			<svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
				<defs>
					<pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
						<path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" stroke-width="0.5" />
					</pattern>
				</defs>
				<rect width="100" height="100" fill="url(#grid)" />
			</svg>
		</div>

		<div class="relative container mx-auto px-4">
			<div class="mx-auto max-w-3xl">
				<h1
					class="font-playfair mb-4 text-4xl font-bold md:text-5xl"
					in:fly={{ y: 30, duration: 600 }}
				>
					Hotel Success Guide
				</h1>
				<p class="text-lg text-slate-300 md:text-xl" in:fade={{ duration: 600, delay: 200 }}>
					Enhancing your hotel's food and beverage services
				</p>
			</div>
		</div>
	</section>

	<!-- Success Tips -->
	<section class="container mx-auto px-4 py-16">
		<h2
			class="mb-12 text-center text-2xl font-bold text-slate-800"
			in:fly={{ y: 20, duration: 400 }}
		>
			Success Tips for Hotels
		</h2>
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each tips as tip, i}
				<div
					class="rounded-2xl bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
					in:fly={{ y: 20, duration: 400, delay: 100 * i }}
				>
					<div class="mb-4 text-4xl">{tip.icon}</div>
					<h3 class="mb-2 text-lg font-semibold text-slate-800">{tip.title}</h3>
					<p class="text-slate-600">{tip.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Room Service Feature -->
	<section class="bg-white py-16">
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-4xl">
				<h2
					class="mb-8 text-center text-2xl font-bold text-slate-800"
					in:fly={{ y: 20, duration: 400 }}
				>
					Room Service Integration
				</h2>
				<div class="grid gap-8 md:grid-cols-2">
					<div
						class="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-6"
						in:fly={{ y: 20, duration: 400, delay: 200 }}
					>
						<h3 class="mb-4 text-xl font-semibold text-slate-800">For Guests</h3>
						<ul class="space-y-3">
							<li class="flex items-start gap-3">
								<svg class="mt-1 h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"
									><path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
								<span class="text-slate-700">Order from their room using QR code</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-1 h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"
									><path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
								<span class="text-slate-700">View menu and prices on their phone</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-1 h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"
									><path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
								<span class="text-slate-700">Track order status in real-time</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-1 h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"
									><path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
								<span class="text-slate-700">Charge to room bill seamlessly</span>
							</li>
						</ul>
					</div>
					<div
						class="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6"
						in:fly={{ y: 20, duration: 400, delay: 300 }}
					>
						<h3 class="mb-4 text-xl font-semibold text-slate-800">For Hotel</h3>
						<ul class="space-y-3">
							<li class="flex items-start gap-3">
								<svg class="mt-1 h-5 w-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20"
									><path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
								<span class="text-slate-700">Manage orders from central dashboard</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-1 h-5 w-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20"
									><path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
								<span class="text-slate-700">Kitchen display integration</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-1 h-5 w-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20"
									><path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
								<span class="text-slate-700">Staff assignment and tracking</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-1 h-5 w-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20"
									><path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/></svg
								>
								<span class="text-slate-700">Revenue and analytics reporting</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="container mx-auto px-4 py-16">
		<h2
			class="mb-12 text-center text-2xl font-bold text-slate-800"
			in:fly={{ y: 20, duration: 400 }}
		>
			Everything You Need
		</h2>
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each features as feature, i}
				<div
					class="rounded-2xl bg-white p-6 shadow-lg"
					in:fly={{ y: 20, duration: 400, delay: 100 * i }}
				>
					<div class="mb-4 text-amber-500">{@html feature.icon}</div>
					<h3 class="mb-2 text-lg font-semibold text-slate-800">{feature.title}</h3>
					<p class="text-slate-600">{feature.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- CTA Section -->
	<section class="bg-slate-900 py-16 text-center text-white">
		<div class="container mx-auto px-4">
			<h2 class="mb-4 text-2xl font-bold md:text-3xl" in:fly={{ y: 20, duration: 400 }}>
				Ready to Grow Your Business?
			</h2>
			<p class="mx-auto mb-8 max-w-xl text-slate-300" in:fade={{ duration: 400, delay: 200 }}>
				Join successful hotels using our platform to increase revenue and streamline operations.
			</p>
			<div class="flex flex-wrap justify-center gap-4">
				<a
					href="/signup"
					class="rounded-full bg-amber-500 px-8 py-3 font-semibold text-white transition-all hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30"
				>
					Get Started Now
				</a>
				<a
					href="/pricing"
					class="rounded-full border border-slate-600 px-8 py-3 font-semibold text-white transition-all hover:bg-slate-800"
				>
					View Pricing
				</a>
			</div>
		</div>
	</section>
</div>
