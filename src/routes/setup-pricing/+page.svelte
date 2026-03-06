<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import pb from '$lib/pb';

	let { data } = $props();

	let activeTab = $state('basic');
	let submitting = $state(false);
	let submitSuccess = $state(false);
	let submitError = $state('');

	const packages = [
		{
			id: 'basic',
			name: 'Basic Setup',
			price: 149000,
			description: 'Perfect for small stores wanting to go digital',
			features: [
				'Full website with your branding',
				'QR codes for each table',
				'Offline mode enabled',
				'Remote admin training (1 hour)',
				'Workflow setup assistance',
				'Email support'
			],
			image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'
		},
		{
			id: 'standard',
			name: 'Standard Setup',
			description: 'Ideal for growing stores with multiple staff',
			price: 349000,
			features: [
				'Everything in Basic',
				'1 Kitchen display tablet',
				'Staff workflow training',
				'Priority support',
				'Multi-table management',
				'Order status automation'
			],
			image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80'
		},
		{
			id: 'pro',
			name: 'Pro Setup',
			description: 'Complete solution for busy stores',
			price: 499000,
			features: [
				'Everything in Standard',
				'2 Tablets (Kitchen + Waiter)',
				'On-site installation',
				'Full staff onboarding',
				'Branded QR table cards',
				'24/7 Premium support'
			],
			image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80',
			isPopular: true
		}
	];

	let formData = $state({
		storeName: '',
		contactName: '',
		phone: '',
		email: '',
		location: '',
		package: 'basic',
		notes: ''
	});

	async function submitInquiry(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		submitError = '';

		try {
			await pb.collection('setupInquiries').create({
				storeName: formData.storeName,
				contactName: formData.contactName,
				phone: formData.phone,
				email: formData.email,
				location: formData.location,
				package: formData.package,
				notes: formData.notes,
				status: 'pending'
			});

			submitSuccess = true;
			formData = {
				storeName: '',
				contactName: '',
				phone: '',
				email: '',
				location: '',
				package: 'basic',
				notes: ''
			};
		} catch (err) {
			console.error('Failed to submit inquiry:', err);
			submitError = 'Failed to submit inquiry. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function selectPackage(packageId: string) {
		activeTab = packageId;
		formData.package = packageId;
	}
</script>

<svelte:head>
	<title>Setup Packages - Proxifeast</title>
	<meta
		name="description"
		content="Choose your Proxifeast hardware setup package. From basic QR codes to full tablet deployment."
	/>
</svelte:head>

<div class="min-h-screen bg-white">
	<!-- Hero -->
	<section
		class="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-16 text-center text-white md:py-24"
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
					class="font-playfair mb-4 text-3xl font-bold md:text-5xl"
					in:fly={{ y: 30, duration: 600 }}
				>
					Choose Your Physical Deployment Level
				</h1>
				<p class="text-lg text-slate-300 md:text-xl" in:fade={{ duration: 600, delay: 200 }}>
					Same powerful software. Different hardware depth.
				</p>
			</div>
		</div>
	</section>

	<!-- Package Cards -->
	<section class="container mx-auto px-4 py-12">
		<div class="mx-auto max-w-6xl">
			<!-- Package Tabs -->
			<div class="mb-8 flex flex-wrap justify-center gap-4">
				{#each packages as pkg}
					<button
						onclick={() => selectPackage(pkg.id)}
						class="rounded-full px-6 py-3 font-medium transition-all {activeTab === pkg.id
							? 'bg-amber-500 text-white shadow-lg'
							: 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
					>
						{pkg.name}
					</button>
				{/each}
			</div>

			<!-- Package Details -->
			{#each packages as pkg}
				{#if activeTab === pkg.id}
					<div class="rounded-3xl bg-slate-50 p-8 md:p-12" in:fly={{ y: 20, duration: 400 }}>
						<div class="grid gap-8 lg:grid-cols-2 lg:items-center">
							<!-- Image -->
							<div class="relative">
								<img
									src={pkg.image}
									alt={pkg.name}
									class="aspect-[4/3] w-full rounded-2xl object-cover shadow-2xl"
								/>
								{#if pkg.isPopular}
									<div class="absolute top-4 -right-4">
										<span
											class="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-sm font-bold text-white shadow-lg"
										>
											Most Popular
										</span>
									</div>
								{/if}
							</div>

							<!-- Details -->
							<div>
								<h2 class="font-playfair text-3xl font-bold text-slate-900">{pkg.name}</h2>
								<p class="mt-2 text-lg text-slate-600">{pkg.description}</p>

								<div class="mt-6">
									<span class="text-4xl font-bold text-slate-900"
										>₦{pkg.price.toLocaleString()}</span
									>
									<span class="text-slate-500"> one-time</span>
								</div>

								<ul class="mt-6 space-y-3">
									{#each pkg.features as feature}
										<li class="flex items-center gap-3 text-slate-700">
											<svg
												class="h-5 w-5 flex-shrink-0 text-emerald-500"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 13l4 4L19 7"
												/>
											</svg>
											{feature}
										</li>
									{/each}
								</ul>

								<button
									onclick={() => {
										formData.package = pkg.id;
										document
											.getElementBy4lement('inquiry-form')
											?.scrollIntoView({ behavior: 'smooth' });
									}}
									class="mt-8 w-full rounded-xl bg-amber-500 py-4 text-lg font-semibold text-white transition-all hover:bg-amber-600 hover:shadow-lg"
								>
									Request {pkg.name}
								</button>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</section>

	<!-- Inquiry Form -->
	<section id="inquiry-form" class="bg-slate-50 py-16">
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-2xl">
				<div class="rounded-3xl bg-white p-8 shadow-xl">
					<h2 class="font-playfair text-center text-2xl font-bold text-slate-900">
						Request a Setup Package
					</h2>
					<p class="mt-2 text-center text-slate-600">
						Fill out the form below and we'll get back to you within 24 hours.
					</p>

					{#if submitSuccess}
						<div class="mt-8 rounded-2xl bg-emerald-50 p-6 text-center">
							<svg
								class="mx-auto h-12 w-12 text-emerald-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<h3 class="mt-4 text-xl font-semibold text-emerald-800">Request Submitted!</h3>
							<p class="mt-2 text-emerald-600">
								We'll contact you within 24 hours to discuss your setup.
							</p>
							<button
								onclick={() => (submitSuccess = false)}
								class="mt-4 text-emerald-700 underline"
							>
								Submit another request
							</button>
						</div>
					{:else}
						<form onsubmit={submitInquiry} class="mt-8 space-y-6">
							{#if submitError}
								<div class="rounded-xl bg-red-50 p-4 text-red-700">
									{submitError}
								</div>
							{/if}

							<div class="grid gap-6 md:grid-cols-2">
								<div>
									<label for="storeName" class="block text-sm font-medium text-slate-700">
										Store Name *
									</label>
									<input
										type="text"
										id="storeName"
										bind:value={formData.storeName}
										required
										class="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
										placeholder="Your store name"
									/>
								</div>
								<div>
									<label for="contactName" class="block text-sm font-medium text-slate-700">
										Contact Name *
									</label>
									<input
										type="text"
										id="contactName"
										bind:value={formData.contactName}
										required
										class="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
										placeholder="Your full name"
									/>
								</div>
							</div>

							<div class="grid gap-6 md:grid-cols-2">
								<div>
									<label for="phone" class="block text-sm font-medium text-slate-700">
										Phone Number *
									</label>
									<input
										type="tel"
										id="phone"
										bind:value={formData.phone}
										required
										class="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
										placeholder="+2348123456789"
									/>
								</div>
								<div>
									<label for="email" class="block text-sm font-medium text-slate-700">
										Email Address *
									</label>
									<input
										type="email"
										id="email"
										bind:value={formData.email}
										required
										class="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
										placeholder="you@example.com"
									/>
								</div>
							</div>

							<div>
								<label for="location" class="block text-sm font-medium text-slate-700">
									Location/Address *
								</label>
								<input
									type="text"
									id="location"
									bind:value={formData.location}
									required
									class="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
									placeholder="Full address"
								/>
							</div>

							<div>
								<label for="packageSelect" class="block text-sm font-medium text-slate-700">
									Selected Package *
								</label>
								<select
									id="packageSelect"
									bind:value={formData.package}
									class="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
								>
									{#each packages as pkg}
										<option value={pkg.id}>{pkg.name} - ₦{pkg.price.toLocaleString()}</option>
									{/each}
								</select>
							</div>

							<div>
								<label for="notes" class="block text-sm font-medium text-slate-700">
									Additional Notes
								</label>
								<textarea
									id="notes"
									bind:value={formData.notes}
									rows="3"
									class="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
									placeholder="Any specific requirements or questions?"
								></textarea>
							</div>

							<button
								type="submit"
								disabled={submitting}
								class="w-full rounded-xl bg-amber-500 py-4 text-lg font-semibold text-white transition-all hover:bg-amber-600 disabled:opacity-50"
							>
								{submitting ? 'Submitting...' : 'Submit Request'}
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="bg-slate-900 py-16 text-center text-white">
		<div class="container mx-auto px-4">
			<h2 class="font-playfair text-3xl font-bold">Ready to Transform Your Store?</h2>
			<p class="mt-4 text-lg text-slate-300">Join hundreds of stores already using Proxifeast</p>
			<div class="mt-8 flex flex-wrap justify-center gap-4">
				<a
					href="/subscriptions"
					class="rounded-full bg-amber-500 px-8 py-3 font-semibold text-white transition-all hover:bg-amber-600 hover:shadow-lg"
				>
					View Subscription Plans
				</a>
				<a
					href="/contact"
					class="rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition-all hover:bg-white hover:text-slate-900"
				>
					Contact Sales
				</a>
			</div>
		</div>
	</section>
</div>
