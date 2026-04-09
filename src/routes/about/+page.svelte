<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly } from 'svelte/transition';
	import Carousel from '$lib/Carousel.svelte';

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
					HOSPITALITY — JUST A SCAN AWAY
				</p>
			</div>
		</div>
	</section>

	<!-- Content -->
	<section class="page-shell px-4 py-16">
		<div class="mx-auto max-w-6xl 2xl:max-w-7xl">
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
					Proxifeast is a complete QR-powered hospitality experience and management platform that
					hosts and manages restaurants, bars, cafés, and hotels online. We provide seamless digital
					experiences through innovative QR code scanning technology, enabling venues to offer
					contactless, hassle-free ordering and reservations to their guests.
				</p>
				<p class="mt-4 leading-relaxed text-slate-600">
					We bridge the gap between traditional hospitality and modern technology, making it easier
					than ever for guests to browse menus, place orders, make reservations, and enjoy
					extraordinary experiences—whether dining in, taking out, ordering delivery, or booking
					rooms.
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
					<p class="text-slate-300">Everything you need to modernize your hospitality store</p>
				</div>

				<Carousel>
					<!-- QR Code Per Table -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
							Get your own branded website with your store name, logo, colors, and custom domain.
						</p>
					</div>

					<!-- Real-time Orders -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 transition-all hover:bg-white/20"
						backdrop-blur-sm
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
							Complete order tracking for both customers and venues. Never lose track of an order.
						</p>
					</div>

					<!-- Favorites -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
							Save favorite venues and dishes for quick access on your next visit.
						</p>
					</div>

					<!-- Delivery Options -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						<h3 class="font-playfair mb-2 text-xl font-semibold">Multi-Venue Platform</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Host multiple venues on one platform. Browse all venues or switch between them.
						</p>
					</div>

					<!-- Menu Management -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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

					<!-- Social Login -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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

					<!-- Email Notifications -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
							Automatic email confirmations for orders sent to customers and venues.
						</p>
					</div>

					<!-- Subscription Billing -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
							Flexible subscription plans for venues with test periods and easy renewals.
						</p>
					</div>

					<!-- User Analysis -->
					<div
						class="w-72 shrink-0 snap-start rounded-2xl bg-white/10 p-6 backdrop-blur-sm transition-all hover:bg-white/20"
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
								<path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /><circle
									cx="18.7"
									cy="8"
									r="2"
								/>
							</svg>
						</div>
						<h3 class="font-playfair mb-2 text-xl font-semibold">User Analysis</h3>
						<p class="text-sm leading-relaxed text-slate-300">
							Track user behavior, spending patterns, and customer tiers with detailed analytics.
						</p>
					</div>
				</Carousel>
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
					<p class="text-slate-500">The smarter choice for modern hospitality venues</p>
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
					Bring your store online with Proxifeast. Scan, order, reserve, experience!
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
