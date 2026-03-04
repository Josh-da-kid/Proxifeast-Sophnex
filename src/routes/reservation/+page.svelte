<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { page } from '$app/stores';

	let store = $derived($page.data.store);

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
	let error = $state('');
	let reservationData = $state<any>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;
		error = '';

		if (!store) {
			error = 'No store selected. Please access this page from a store.';
			isSubmitting = false;
			return;
		}

		try {
			const formData = new FormData();
			formData.append('storeId', store.id);
			formData.append('type', 'table');
			formData.append('reservationDate', date);
			formData.append('checkInTime', time);
			formData.append('guestName', name);
			formData.append('guestEmail', email);
			formData.append('guestPhone', phone);
			formData.append('partySize', guests.toString());

			const response = await fetch('/api/reservations', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.success) {
				reservationData = result.reservation;
				submitted = true;
			} else {
				error = result.error || 'Failed to create reservation';
			}
		} catch (err) {
			console.error('Reservation error:', err);
			error = 'An error occurred. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Book a Reservation - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-12 text-center text-white"
	>
		<div class="container mx-auto px-4">
			<h1 class="font-playfair mb-2 text-3xl font-bold md:text-4xl">Book a Reservation</h1>
			<p class="text-white/80">Reserve your table for an unforgettable dining experience</p>
		</div>
	</section>

	<!-- Form -->
	<main class="container mx-auto max-w-3xl px-4 py-8">
		{#if !store}
			<div class="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-12 w-12 text-amber-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<h2 class="mt-4 text-xl font-semibold text-amber-900">No Store Selected</h2>
				<p class="mt-2 text-amber-700">
					Please select a store to make a reservation.
					<a href="/stores" class="font-medium underline">Browse stores</a>
				</p>
			</div>
		{:else if error}
			<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
				{error}
			</div>
		{:else if submitted}
			<div class="rounded-2xl bg-white p-8 text-center shadow-lg" in:fade>
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
				<h2 class="font-playfair mb-2 text-2xl font-bold text-slate-900">Reservation Confirmed!</h2>
				<p class="mb-6 text-slate-600">
					Your reservation has been confirmed. A QR pass has been generated for check-in.
				</p>

				{#if reservationData}
					<div class="mb-6 rounded-lg bg-slate-50 p-4 text-left">
						<p class="mb-2 text-sm text-slate-500">Reservation Details:</p>
						<p class="font-semibold">{store?.name}</p>
						<p class="text-sm text-slate-600">
							Date: {new Date(reservationData.reservationDate).toLocaleDateString()}
						</p>
						<p class="text-sm text-slate-600">Time: {reservationData.checkInTime}</p>
						<p class="text-sm text-slate-600">Guests: {reservationData.partySize}</p>
						<p class="mt-2 text-sm text-slate-600">Confirmation ID: {reservationData.id}</p>
					</div>
				{/if}

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
						class="font-playfair mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-slate-600"
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
							<label for="name" class="text-sm font-medium text-slate-700">Full Name</label>
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
						<div class="space-y-2 md:col-span-2">
							<label for="phone" class="text-sm font-medium text-slate-700">Phone Number</label>
							<input
								id="phone"
								type="tel"
								bind:value={phone}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
								placeholder="+234 800 123 4567"
								required
							/>
						</div>
					</div>
				</section>

				<!-- Reservation Details -->
				<section class="mb-8 border-t border-slate-100 pt-6">
					<h2
						class="font-playfair mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-slate-600"
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
							<label for="date" class="text-sm font-medium text-slate-700">Date</label>
							<input
								id="date"
								type="date"
								bind:value={date}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="time" class="text-sm font-medium text-slate-700">Time</label>
							<input
								id="time"
								type="time"
								bind:value={time}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="guests" class="text-sm font-medium text-slate-700">Number of Guests</label
							>
							<input
								id="guests"
								type="number"
								bind:value={guests}
								min="1"
								max="20"
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
								required
							/>
						</div>
						<div class="space-y-2">
							<label for="occasion" class="text-sm font-medium text-slate-700"
								>Occasion (Optional)</label
							>
							<input
								id="occasion"
								type="text"
								bind:value={occasion}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
								placeholder="Birthday, Anniversary..."
							/>
						</div>
					</div>
				</section>

				<!-- Special Requests -->
				<section class="mb-8 border-t border-slate-100 pt-6">
					<h2
						class="font-playfair mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-slate-600"
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
							<label for="dietary" class="text-sm font-medium text-slate-700"
								>Dietary Restrictions</label
							>
							<input
								id="dietary"
								type="text"
								bind:value={dietaryRestrictions}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
								placeholder="Vegetarian, Gluten-free..."
							/>
						</div>
						<div class="space-y-2">
							<label for="sitting" class="text-sm font-medium text-slate-700"
								>Sitting Preference</label
							>
							<input
								id="sitting"
								type="text"
								bind:value={sittingPreference}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
								placeholder="Window seat, Private room..."
							/>
						</div>
						<div class="space-y-2 md:col-span-2">
							<label for="accessibility" class="text-sm font-medium text-slate-700"
								>Accessibility Needs</label
							>
							<input
								id="accessibility"
								type="text"
								bind:value={accessibility}
								class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:border-slate-500 focus:bg-white focus:ring-2 focus:ring-slate-500/20 focus:outline-none"
								placeholder="Wheelchair access..."
							/>
						</div>
					</div>
				</section>

				<!-- Confirmation Preference -->
				<section class="mb-8 border-t border-slate-100 pt-6">
					<h2 class="font-playfair mb-4 text-xl font-semibold text-slate-900">
						Confirmation Preference
					</h2>
					<div class="flex gap-4">
						{#each ['email', 'sms', 'phone'] as pref}
							<label
								class="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 transition-all hover:border-slate-500 {preference ===
								pref
									? 'border-slate-500 bg-slate-50'
									: ''}"
							>
								<input type="radio" bind:group={preference} value={pref} class="hidden" />
								<span class="text-sm font-medium text-slate-700 capitalize">{pref}</span>
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
