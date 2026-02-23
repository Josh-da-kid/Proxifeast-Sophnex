<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';

	const restaurant = get(page).data.restaurant;
</script>

<svelte:head>
	<title>About - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Hero -->
	<section
		class="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-20 text-center text-white"
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
				<p class="text-lg font-medium text-slate-300" in:fade={{ duration: 600, delay: 200 }}>
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
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-slate-600"
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
					<h2 class="font-playfair text-2xl font-semibold text-slate-900">What is Proxifeast?</h2>
				</div>
				<p class="leading-relaxed text-slate-600">
					Proxifeast is a digital hospitality platform that hosts and manages restaurants online. We
					provide seamless online menu experiences through innovative QR code scanning technology.
					Our platform enables restaurants to offer contactless, hassle-free ordering to their
					customers.
				</p>
				<p class="mt-4 leading-relaxed text-slate-600">
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
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-slate-600"
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
					<h2 class="font-playfair text-2xl font-semibold text-slate-900">How It Works</h2>
				</div>
				<p class="leading-relaxed text-slate-600">
					Restaurants partner with Proxifeast to create digital menus accessible via QR codes.
					Customers simply scan the QR code at their table or on their receipt to instantly access
					the full menu, place orders, and make payments—all from their own device.
				</p>
				<div class="mt-6 grid gap-4 md:grid-cols-3">
					{#each [{ step: '01', title: 'Scan QR Code', desc: 'Scan the QR code at your table' }, { step: '02', title: 'Browse Menu', desc: 'Explore dishes and add to cart' }, { step: '03', title: 'Order & Pay', desc: 'Place order and pay seamlessly' }] as item}
						<div class="text-center">
							<div
								class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white"
							>
								{item.step}
							</div>
							<h3 class="font-medium text-slate-900">{item.title}</h3>
							<p class="mt-1 text-sm text-slate-500">{item.desc}</p>
						</div>
					{/each}
				</div>
			</article>

			<!-- Team Section -->
			<article
				class="mb-12 rounded-2xl bg-white p-8 shadow-lg md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 500 }}
			>
				<div class="mb-8 text-center">
					<div class="mb-4 flex items-center justify-center gap-3">
						<div class="h-px w-12 bg-amber-500"></div>
						<h2 class="font-playfair text-3xl font-semibold text-slate-900">Meet The Team</h2>
						<div class="h-px w-12 bg-amber-500"></div>
					</div>
					<p class="text-slate-500">The minds behind Proxifeast</p>
				</div>

				<!-- CEO Card -->
				<div class="mx-auto max-w-lg">
					<div
						class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-md transition-all hover:shadow-xl"
					>
						<!-- Decorative background -->
						<div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-slate-900/5"></div>

						<div class="relative p-8">
							<!-- Avatar -->
							<div class="mb-6 flex justify-center">
								<div class="relative">
									<div
										class="h-32 w-32 overflow-hidden rounded-full border-4 border-amber-500 shadow-lg"
									>
										<img
											src="/founder.jpeg"
											alt="Josiah Andrew Ubana"
											class="h-full w-full object-cover"
										/>
									</div>
									<div
										class="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 shadow"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4 text-white"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path
												d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
											/>
										</svg>
									</div>
								</div>
							</div>

							<!-- Info -->
							<div class="text-center">
								<h3 class="font-playfair text-2xl font-bold text-slate-900">Josiah Andrew Ubana</h3>
								<p class="mt-1 text-sm font-medium tracking-widest text-amber-600 uppercase">
									Founder & Chief Executive Officer
								</p>
								<div class="mx-auto mt-4 h-px w-16 bg-slate-200"></div>
								<p class="mt-4 leading-relaxed text-slate-600">
									A visionary leader with a passion for transforming the hospitality industry
									through technology. Josiah founded Proxifeast with a mission to revolutionize how
									restaurants connect with their customers, bringing convenience and efficiency to
									dining experiences worldwide.
								</p>
								<p class="mt-3 leading-relaxed text-slate-600">
									With strategic oversight and innovative thinking, he continues to drive Proxifeast
									toward becoming the premier digital solution for restaurants across Africa and
									beyond.
								</p>
							</div>

							<!-- Social Links -->
							<div class="mt-6 flex justify-center gap-4">
								<a
									href="#"
									class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-amber-500 hover:text-white"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
										/>
									</svg>
								</a>
								<a
									href="#"
									class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-amber-500 hover:text-white"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z 0M22.225H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
										/>
									</svg>
								</a>
								<a
									href="#"
									class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-amber-500 hover:text-white"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
										/>
									</svg>
								</a>
							</div>
						</div>
					</div>
				</div>
			</article>

			<!-- WHAT YOU GET Section -->
			<article
				class="mb-12 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-8 text-white shadow-2xl md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 550 }}
			>
				<div class="mb-10 text-center">
					<div class="mb-4 flex items-center justify-center gap-3">
						<div class="h-px w-12 bg-amber-500"></div>
						<h2 class="font-playfair text-3xl font-semibold">What You Get as a Restaurant</h2>
						<div class="h-px w-12 bg-amber-500"></div>
					</div>
					<p class="text-slate-300">Everything you need to modernize your restaurant</p>
				</div>

				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<!-- Feature 1: QR Code for Each Table -->
					<div
						class="group relative overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
					>
						<div
							class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 shadow-lg"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-7 w-7 text-white"
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
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">QR Code Per Table</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Each table gets its own unique QR code. Customers simply scan to access your
							personalized menu and order instantly—no app download required.
						</p>
					</div>

					<!-- Feature 2: Custom Digital Menu -->
					<div
						class="group relative overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
					>
						<div
							class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 shadow-lg"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-7 w-7 text-white"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="2" y="3" width="20" height="14" rx="2" />
								<line x1="8" y1="21" x2="16" y2="21" />
								<line x1="12" y1="17" x2="12" y2="21" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Custom Digital Menu</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Get your own branded website with your restaurant name, logo, colors, and custom
							domain. Make a lasting impression on every customer.
						</p>
					</div>

					<!-- Feature 3: Real-time Order Management -->
					<div
						class="group relative overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
					>
						<div
							class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 shadow-lg"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-7 w-7 text-white"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="10" />
								<polyline points="12 6 12 12 16 14" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Real-time Orders</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Receive orders instantly as they come in. Track order status in real-time and reduce
							waiting times significantly.
						</p>
					</div>

					<!-- Feature 4: Analytics Dashboard -->
					<div
						class="group relative overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
					>
						<div
							class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 shadow-lg"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-7 w-7 text-white"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<line x1="18" y1="20" x2="18" y2="10" />
								<line x1="12" y1="20" x2="12" y2="4" />
								<line x1="6" y1="20" x2="6" y2="14" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Analytics & Insights</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Understand your customers better with detailed analytics. Track popular dishes, peak
							hours, revenue trends, and more.
						</p>
					</div>

					<!-- Feature 5: Digital Payments -->
					<div
						class="group relative overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
					>
						<div
							class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 shadow-lg"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-7 w-7 text-white"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="1" y="4" width="22" height="16" rx="2" />
								<line x1="1" y1="10" x2="23" y2="10" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Digital Payments</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Accept secure online payments through Paystack. Multiple payment options including
							card, USSD, and mobile money.
						</p>
					</div>

					<!-- Feature 6: Reservations -->
					<div
						class="group relative overflow-hidden rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
					>
						<div
							class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500 shadow-lg"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-7 w-7 text-white"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M8 2v4" />
								<path d="M16 2v4" />
								<rect width="18" height="18" x="3" y="4" rx="2" />
								<path d="M3 10h18" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Table Reservations</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Let customers book tables directly from their phones. Manage reservations
							-effortlessly and maximize your seating capacity.
						</p>
					</div>
				</div>
			</article>

			<!-- Why Proxifeast Section -->
			<article
				class="mb-12 rounded-2xl bg-white p-8 shadow-lg md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 650 }}
			>
				<div class="mb-10 text-center">
					<div class="mb-4 flex items-center justify-center gap-3">
						<div class="h-px w-12 bg-amber-500"></div>
						<h2 class="font-playfair text-3xl font-semibold text-slate-900">
							Why Choose Proxifeast?
						</h2>
						<div class="h-px w-12 bg-amber-500"></div>
					</div>
					<p class="text-slate-500">The smarter choice for modern restaurants</p>
				</div>

				<!-- Comparison: Traditional vs Proxifeast -->
				<div class="mb-10">
					<h3 class="font-playfair mb-6 text-xl font-semibold text-slate-900">
						vs. Traditional Paper Menus
					</h3>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="rounded-xl bg-slate-100 p-5">
							<h4 class="mb-3 font-semibold text-slate-500">Traditional Paper Menu</h4>
							<ul class="space-y-2 text-sm text-slate-600">
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									Requires printing & regular updates
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									No real-time availability tracking
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									Hard to track popular dishes
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									No customer data collection
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									Physical contact required (post-COVID risk)
								</li>
							</ul>
						</div>
						<div class="rounded-xl bg-amber-50 p-5 ring-2 ring-amber-500">
							<h4 class="mb-3 font-semibold text-amber-700">Proxifeast</h4>
							<ul class="space-y-2 text-sm text-slate-700">
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Update menu instantly from dashboard
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Real-time dish availability updates
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Comprehensive analytics dashboard
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Build your customer database
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									100% contactless - scan & order
								</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Comparison: Orderrave vs Proxifeast -->
				<div>
					<h3 class="font-playfair mb-6 text-xl font-semibold text-slate-900">
						vs. Orderrave & Other Competitors
					</h3>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="rounded-xl bg-slate-100 p-5">
							<h4 class="mb-3 font-semibold text-slate-500">Orderrave & Others</h4>
							<ul class="space-y-2 text-sm text-slate-600">
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									Generic platform - no brand control
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									Limited customization options
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									High transaction fees
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
									No reservation system
								</li>
							</ul>
						</div>
						<div class="rounded-xl bg-amber-50 p-5 ring-2 ring-amber-500">
							<h4 class="mb-3 font-semibold text-amber-700">Proxifeast</h4>
							<ul class="space-y-2 text-sm text-slate-700">
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Your own branded website & domain
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Full customization - colors, logo, layout
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Competitive pricing - no hidden fees
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Unique QR code per table
								</li>
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/></svg
									>
									Built-in table reservation system
								</li>
							</ul>
						</div>
					</div>
				</div>
			</article>

			<!-- CTA -->
			<article
				class="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 p-8 text-center text-white md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 800 }}
			>
				<h2 class="font-playfair mb-3 text-2xl font-bold">Partner With Us</h2>
				<p class="mb-6 text-slate-300">
					Bring your restaurant online with Proxifeast. Scan, order, feast!
				</p>
				<a
					href="/contact"
					class="inline-block rounded-xl bg-white px-8 py-3 font-medium text-slate-800 transition-all hover:bg-slate-100"
				>
					Get Started
				</a>
			</article>
		</div>
	</section>
</div>
