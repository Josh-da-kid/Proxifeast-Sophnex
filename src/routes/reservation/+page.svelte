<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let date = $state('');
	let time = $state('');
	let guests = $state(2);
	let occasion = $state('');
	let dietaryRestrictions = $state('');
	let sittingPreference = $state('');
	let accessibility = $state('');
	let paymentMethod = $state('card');
	let preference = $state('email');
	let isSubmitting = $state(false);
	let submitted = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;

		// Simulate submission
		await new Promise((resolve) => setTimeout(resolve, 1500));

		submitted = true;
		isSubmitting = false;
	}
</script>

<svelte:head>
	<title>Book a Reservation - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-stone-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 py-12 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1 class="font-playfair mb-2 text-3xl font-bold md:text-4xl">Book a Reservation</h1>
			<p class="text-white/80">Reserve your table for an unforgettable dining experience</p>
		</div>
	</section>

	<!-- Form -->
	<main class="container mx-auto max-w-3xl px-4 py-8">
		{#if submitted}
			<div class="rounded-2xl bg-white p-8 text-center shadow-lg" in:fade>
				<div class="mb-4 flex justify-center">
					<div class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-10 w-10 text-green-600"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M20 6L9 17l-5-5" />
						</svg>
					</div>
				</div>
				<h2 class="font-playfair mb-2 text-2xl font-bold text-gray-900">Reservation Submitted!</h2>
				<p class="mb-6 text-gray-600">
					Thank you for your reservation. We'll send a confirmation to your email shortly.
				</p>
				<a href="/" class="btn btn-primary">Return Home</a>
			</div>
		{:else}
			<form
				onsubmit={handleSubmit}
				class="rounded-2xl bg-white p-8 shadow-lg"
				in:fly={{ y: 20, duration: 400 }}
			>
				<!-- Guest Details -->
				<section class="mb-8">
					<h2
						class="font-playfair mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-amber-600"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						Guest Details
					</h2>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<label for="name" class="text-sm font-medium text-gray-700">Full Name</label>
							<input
								id="name"
								type="text"
								bind:value={name}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								placeholder="John Doe"
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="email" class="text-sm font-medium text-gray-700">Email Address</label>
							<input
								id="email"
								type="email"
								bind:value={email}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								placeholder="john@example.com"
								required
							/>
						</div>
						<div class="space-y-2 md:col-span-2">
							<label for="phone" class="text-sm font-medium text-gray-700">Phone Number</label>
							<input
								id="phone"
								type="tel"
								bind:value={phone}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								placeholder="+234 800 123 4567"
								required
							/>
						</div>
					</div>
				</section>

				<!-- Reservation Details -->
				<section class="mb-8 border-t border-gray-100 pt-6">
					<h2
						class="font-playfair mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-amber-600"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" />
							<line x1="16" x2="16" y1="2" y2="6" />
							<line x1="8" x2="8" y1="2" y2="6" />
							<line x1="3" x2="21" y1="10" y2="10" />
						</svg>
						Reservation Details
					</h2>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<label for="date" class="text-sm font-medium text-gray-700">Date</label>
							<input
								id="date"
								type="date"
								bind:value={date}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="time" class="text-sm font-medium text-gray-700">Time</label>
							<input
								id="time"
								type="time"
								bind:value={time}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="guests" class="text-sm font-medium text-gray-700">Number of Guests</label>
							<input
								id="guests"
								type="number"
								bind:value={guests}
								min="1"
								max="20"
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="occasion" class="text-sm font-medium text-gray-700"
								>Occasion (Optional)</label
							>
							<input
								id="occasion"
								type="text"
								bind:value={occasion}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								placeholder="Birthday, Anniversary..."
							/>
						</div>
					</div>
				</section>

				<!-- Special Requests -->
				<section class="mb-8 border-t border-gray-100 pt-6">
					<h2
						class="font-playfair mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-amber-600"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
						</svg>
						Special Requests
					</h2>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<label for="dietary" class="text-sm font-medium text-gray-700"
								>Dietary Restrictions</label
							>
							<input
								id="dietary"
								type="text"
								bind:value={dietaryRestrictions}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								placeholder="Vegetarian, Gluten-free..."
							/>
						</div>
						<div class="space-y-2">
							<label for="sitting" class="text-sm font-medium text-gray-700"
								>Sitting Preference</label
							>
							<input
								id="sitting"
								type="text"
								bind:value={sittingPreference}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								placeholder="Window seat, Private room..."
							/>
						</div>
						<div class="space-y-2 md:col-span-2">
							<label for="accessibility" class="text-sm font-medium text-gray-700"
								>Accessibility Needs</label
							>
							<input
								id="accessibility"
								type="text"
								bind:value={accessibility}
								class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
								placeholder="Wheelchair access..."
							/>
						</div>
					</div>
				</section>

				<!-- Confirmation Preference -->
				<section class="mb-8 border-t border-gray-100 pt-6">
					<h2 class="font-playfair mb-4 text-xl font-semibold text-gray-900">
						Confirmation Preference
					</h2>
					<div class="flex gap-4">
						{#each ['email', 'sms', 'phone'] as pref}
							<label
								class="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 p-3 transition-all hover:border-amber-500 {preference ===
								pref
									? 'border-amber-500 bg-amber-50'
									: ''}"
							>
								<input type="radio" bind:group={preference} value={pref} class="hidden" />
								<span class="text-sm font-medium text-gray-700 capitalize">{pref}</span>
							</label>
						{/each}
					</div>
				</section>

				<!-- Submit -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="btn btn-primary w-full rounded-xl py-4 text-lg font-medium"
				>
					{#if isSubmitting}
						<span class="loading loading-spinner loading-sm"></span>
						Submitting...
					{:else}
						Confirm Reservation
					{/if}
				</button>
			</form>
		{/if}
	</main>
</div>
