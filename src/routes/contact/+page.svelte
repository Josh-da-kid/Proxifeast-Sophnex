<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { fade, fly, scale } from 'svelte/transition';

	const restaurant = get(page).data.restaurant;

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');
	let isSubmitting = $state(false);
	let submitted = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;

		await new Promise((resolve) => setTimeout(resolve, 1500));

		submitted = true;
		isSubmitting = false;
	}
</script>

<svelte:head>
	<title>Contact Us - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-12 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1 class="font-playfair mb-2 text-3xl font-bold md:text-4xl">Contact Us</h1>
			<p class="text-white/80">We'd love to hear from you</p>
		</div>
	</section>

	<!-- Content -->
	<main class="page-shell px-4 py-12">
		<div class="mx-auto max-w-6xl 2xl:max-w-7xl">
			<!-- Contact Info Cards -->
			<div class="mb-12 grid gap-6 md:grid-cols-2">
				{#each [{ icon: 'phone', title: 'Phone', content: '+234 123 456 7890', desc: 'Mon-Sat: 9AM - 9PM' }, { icon: 'mail', title: 'Email', content: 'info@proxifeast.com', desc: 'We reply within 24 hours' }] as info, i}
					<article
						class="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-md"
						in:fly={{ y: 20, duration: 400, delay: i * 100 }}
					>
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100"
						>
							{#if info.icon === 'phone'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-slate-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6 text-slate-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<rect width="20" height="16" x="2" y="4" rx="2" />
									<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
								</svg>
							{/if}
						</div>
						<div>
							<h3 class="font-playfair text-lg font-semibold text-slate-900">{info.title}</h3>
							<p class="font-medium text-slate-700">{info.content}</p>
							<p class="mt-1 text-sm text-slate-500">{info.desc}</p>
						</div>
					</article>
				{/each}
			</div>

			<!-- Contact Form & Map -->
			<div class="grid gap-8 lg:grid-cols-2">
				<!-- Form -->
				{#if submitted}
					<div class="rounded-2xl bg-white p-8 shadow-lg" in:scale>
						<div class="text-center">
							<div class="mb-4 flex justify-center">
								<div class="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-10 w-10 text-emerald-600"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M20 6L9 17l-5-5" />
									</svg>
								</div>
							</div>
							<h2 class="font-playfair mb-2 text-2xl font-bold text-slate-900">Message Sent!</h2>
							<p class="text-slate-600">
								Thank you for contacting us. We'll get back to you shortly.
							</p>
							<button onclick={() => (submitted = false)} class="btn btn-primary mt-6"
								>Send Another Message</button
							>
						</div>
					</div>
				{:else}
					<form
						onsubmit={handleSubmit}
						class="rounded-2xl bg-white p-8 shadow-lg"
						in:fly={{ x: -20, duration: 400 }}
					>
						<h2 class="font-playfair mb-6 text-xl font-semibold text-slate-900">
							Send us a Message
						</h2>

						<div class="space-y-4">
							<div class="space-y-2">
								<label for="name" class="text-sm font-medium text-slate-700">Your Name</label>
								<input
									id="name"
									type="text"
									bind:value={name}
									class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
									placeholder="John Doe"
									required
								/>
							</div>

							<div class="space-y-2">
								<label for="email" class="text-sm font-medium text-slate-700">Email Address</label>
								<input
									id="email"
									type="email"
									bind:value={email}
									class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
									placeholder="john@example.com"
									required
								/>
							</div>

							<div class="space-y-2">
								<label for="subject" class="text-sm font-medium text-slate-700">Subject</label>
								<input
									id="subject"
									type="text"
									bind:value={subject}
									class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
									placeholder="How can we help?"
									required
								/>
							</div>

							<div class="space-y-2">
								<label for="message" class="text-sm font-medium text-slate-700">Message</label>
								<textarea
									id="message"
									bind:value={message}
									rows="4"
									class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
									placeholder="Your message here..."
									required
								></textarea>
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								class="btn btn-primary w-full rounded-xl py-3 font-medium"
							>
								{#if isSubmitting}
									<span class="loading loading-spinner loading-sm"></span>
									Sending...
								{:else}
									Send Message
								{/if}
							</button>
						</div>
					</form>
				{/if}

				<!-- Map -->
				<div
					class="h-fit overflow-hidden rounded-2xl shadow-lg"
					in:fly={{ x: 20, duration: 400, delay: 200 }}
				>
					<iframe
						title="Restaurant Location"
						class="h-[400px] w-full"
						src="https://maps.google.com/maps?q=Calabar&t=&z=13&ie=UTF8&iwloc=&output=embed"
						loading="lazy"
						frameborder="0"
					></iframe>

					<!-- Address Card -->
					<div class="bg-white p-6">
						<div class="flex items-start gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-slate-600"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
							</div>
							<div>
								<h3 class="font-medium text-slate-900">Visit Us</h3>
								<p class="mt-1 text-slate-600">
									{restaurant?.restaurantAddress || '123 Food Street, Calabar'}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>
