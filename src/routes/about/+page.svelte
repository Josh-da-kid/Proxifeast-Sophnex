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
		<div class="mx-auto max-w-5xl">
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
					Proxifeast is a complete digital hospitality platform that hosts and manages restaurants
					online. We provide seamless online menu experiences through innovative QR code scanning
					technology, enabling restaurants to offer contactless, hassle-free ordering to their
					customers.
				</p>
				<p class="mt-4 leading-relaxed text-slate-600">
					We bridge the gap between traditional dining and modern technology, making it easier than
					ever for customers to browse menus, place orders, and enjoy their favorite meals—whether
					dining in, taking out, or ordering for delivery.
				</p>
			</article>

			<!-- How It Works -->
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

			<!-- All Features Section -->
			<article
				class="mb-12 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-8 text-white shadow-2xl md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 450 }}
			>
				<div class="mb-10 text-center">
					<div class="mb-4 flex items-center justify-center gap-3">
						<div class="h-px w-12 bg-amber-500"></div>
						<h2 class="font-playfair text-3xl font-semibold">Powerful Features</h2>
						<div class="h-px w-12 bg-amber-500"></div>
					</div>
					<p class="text-slate-300">Everything you need to modernize your restaurant</p>
				</div>

				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<!-- QR Code Per Table -->
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
								<rect x="3" y="3" width="7" height="7" /><rect
									x="14"
									y="3"
									width="7"
									height="7"
								/><rect x="3" y="14" width="7" height="7" /><path
									d="M14 14h3v3h-3zM17 17h3v3h-3zM14 17v3M17 14h3"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">QR Code Per Table</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Each table gets its own unique QR code. Customers scan to access their personalized
							menu—no app download required.
						</p>
					</div>

					<!-- Custom Digital Menu -->
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
								<rect x="2" y="3" width="20" height="14" rx="2" /><line
									x1="8"
									y1="21"
									x2="16"
									y2="21"
								/><line x1="12" y1="17" x2="12" y2="21" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Custom Digital Menu</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Get your own branded website with your restaurant name, logo, colors, and custom
							domain.
						</p>
					</div>

					<!-- Real-time Orders -->
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
								<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Real-time Orders</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Receive orders instantly as they come in. Track order status in real-time with live
							updates.
						</p>
					</div>

					<!-- Analytics Dashboard -->
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
								<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line
									x1="6"
									y1="20"
									x2="6"
									y2="14"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Analytics & Insights</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Track popular dishes, peak hours, revenue trends, top customers, and more with
							beautiful charts.
						</p>
					</div>

					<!-- Digital Payments -->
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
								<rect x="1" y="4" width="22" height="16" rx="2" /><line
									x1="1"
									y1="10"
									x2="23"
									y2="10"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Digital Payments</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Accept secure online payments via Paystack—card, USSD, mobile money, and bank
							transfers.
						</p>
					</div>

					<!-- Reservations -->
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
								<path d="M8 2v4" /><path d="M16 2v4" /><rect
									width="18"
									height="18"
									x="3"
									y="4"
									rx="2"
								/><path d="M3 10h18" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Table Reservations</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Let customers book tables directly from their phones. Manage reservations
							effortlessly.
						</p>
					</div>

					<!-- Order History -->
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
								<path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Order History</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Complete order tracking for both customers and restaurants. Never lose track of an
							order.
						</p>
					</div>

					<!-- Favorites -->
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
								<path
									d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Favorites</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Save favorite restaurants and dishes for quick access on your next visit.
						</p>
					</div>

					<!-- Delivery Options -->
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
								<rect x="1" y="3" width="15" height="13" /><polygon
									points="16 8 20 8 23 11 23 16 16 16 16 8"
								/><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Multiple Delivery Options</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Dine-in, pickup, or home delivery—customers choose what works best for them.
						</p>
					</div>

					<!-- Push Notifications -->
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
								<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path
									d="M13.73 21a2 2 0 0 1-3.46 0"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Push Notifications</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Real-time browser notifications for order updates—no app installation needed.
						</p>
					</div>

					<!-- PWA / Installable -->
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
								<rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line
									x1="12"
									y1="18"
									x2="12.01"
									y2="18"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Installable App (PWA)</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Add to home screen on any device. Works offline with smart caching.
						</p>
					</div>

					<!-- Multi-Restaurant -->
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
								<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
									points="9 22 9 12 15 12 15 22"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Multi-Restaurant Platform</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Host multiple restaurants on one platform. Browse all restaurants or switch between
							them.
						</p>
					</div>

					<!-- Menu Management -->
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
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline
									points="14 2 14 8 20 8"
								/><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Easy Menu Management</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Add, edit, and organize dishes with categories, pricing, images, and promotional
							prices.
						</p>
					</div>

					<!-- Today's Specials -->
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
								<polygon
									points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Today's Specials</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Showcase daily specials and featured items to highlight on your menu.
						</p>
					</div>

					<!-- User Accounts -->
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
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle
									cx="12"
									cy="7"
									r="4"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">User Accounts</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Customer accounts with order history, favorites, and saved addresses.
						</p>
					</div>

					<!-- OAuth Login -->
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
								<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline
									points="10 17 15 12 10 7"
								/><line x1="15" y1="12" x2="3" y2="12" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Social Login</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Quick sign-up and login with Google or Facebook via OAuth.
						</p>
					</div>

					<!-- Address Autocomplete -->
					<!-- <div
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
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle
									cx="12"
									cy="10"
									r="3"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Address Autocomplete</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Smart address suggestions for delivery orders—accurate addresses every time.
						</p>
					</div> -->

					<!-- Email Notifications -->
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
								<path
									d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
								/><polyline points="22,6 12,13 2,6" />
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Email Notifications</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Automatic email confirmations for orders sent to customers and restaurants.
						</p>
					</div>

					<!-- Subscription Billing -->
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
								<rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line
									x1="1"
									y1="10"
									x2="23"
									y2="10"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">Subscription Plans</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Flexible subscription plans for restaurants with test periods and easy renewals.
						</p>
					</div>
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

				<div class="mx-auto max-w-lg">
					<div
						class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-md transition-all hover:shadow-xl"
					>
						<div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-slate-900/5"></div>
						<div class="relative p-8">
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
											d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
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

			<!-- Why Proxifeast Section -->
			<article
				class="mb-12 rounded-2xl bg-white p-8 shadow-lg md:p-12"
				in:fly={{ y: 30, duration: 600, delay: 600 }}
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
									Physical contact required (COVID risk)
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

				<div>
					<h3 class="font-playfair mb-6 text-xl font-semibold text-slate-900">
						vs. Other Platforms
					</h3>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="rounded-xl bg-slate-100 p-5">
							<h4 class="mb-3 font-semibold text-slate-500">Other Platforms</h4>
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
				in:fly={{ y: 30, duration: 600, delay: 700 }}
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
