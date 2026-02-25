<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	const plans = [
		{
			id: 'weekly',
			name: '7-Day Free Trial',
			price: 0,
			description: 'Free for 7 days to test all features',
			features: [
				'Full menu management',
				'Real-time orders',
				'Analytics dashboard',
				'QR code per table',
				'Push notifications'
			],
			isPopular: false,
			isFree: true
		},
		{
			id: 'monthly',
			name: 'Monthly',
			price: 25000,
			description: 'Billed monthly, cancel anytime',
			features: [
				'Everything in Free Trial',
				'Priority support',
				'Custom domain',
				'No Proxifeast branding',
				'Email notifications'
			],
			isPopular: true
		},
		{
			id: 'quarterly',
			name: 'Quarterly',
			price: 65000,
			description: 'Billed quarterly (Save 6%)',
			features: [
				'Everything in Monthly',
				'Lower per-month cost',
				'Dedicated support',
				'Advanced analytics',
				'Multi-branch support'
			],
			isPopular: false
		},
		{
			id: 'yearly',
			name: 'Yearly',
			price: 250000,
			description: 'Billed yearly (Save 17%)',
			features: [
				'Everything in Quarterly',
				'Best value',
				'Premium support',
				'API access',
				'White-label option'
			],
			isPopular: false
		}
	];

	const faqs = [
		{
			question: 'What payment methods do you accept?',
			answer:
				'We accept all major payment methods including debit/credit cards (Visa, Mastercard), USSD, mobile money, and bank transfers through our secure Paystack integration.'
		},
		{
			question: 'Can I cancel my subscription anytime?',
			answer:
				'Yes! You can cancel your subscription at any time. Your access will continue until the end of your current billing period.'
		},
		{
			question: 'Is there a free trial?',
			answer:
				'Yes! We offer a 7-day free trial so you can explore all features before committing. No credit card required.'
		},
		{
			question: 'What happens when my subscription expires?',
			answer:
				'When your subscription expires, your restaurant menu will be temporarily paused until you renew. Your data is safely stored and will be restored once you subscribe again.'
		},
		{
			question: 'Do you offer refunds?',
			answer:
				'We offer a 7-day money-back guarantee for annual subscriptions. Monthly subscriptions can be cancelled anytime with no refunds for partial months.'
		},
		{
			question: 'Can I upgrade or downgrade my plan?',
			answer:
				'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.'
		}
	];

	let openFaq = $state<number | null>(null);

	function toggleFaq(index: number) {
		openFaq = openFaq === index ? null : index;
	}
</script>

<svelte:head>
	<title>Subscription Plans - Proxifeast</title>
	<meta
		name="description"
		content="Choose the perfect Proxifeast plan for your restaurant. Start with a free trial or upgrade for advanced features."
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50">
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
					Simple, Transparent Pricing
				</h1>
				<p class="text-lg text-slate-300 md:text-xl" in:fade={{ duration: 600, delay: 200 }}>
					Choose the perfect plan for your restaurant. No hidden fees, no surprises.
				</p>
			</div>
		</div>
	</section>

	<!-- Pricing Cards -->
	<section class="container mx-auto px-4 py-12">
		<div class="mx-auto max-w-6xl">
			<!-- Mobile: Scrollable horizontally -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{#each plans as plan, index}
					<div
						class="relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-lg transition-all hover:shadow-xl {plan.isPopular
							? 'border-amber-500 ring-2 ring-amber-500/20'
							: 'border-slate-200'}"
						in:fly={{ y: 30, duration: 600, delay: 100 * index }}
					>
						{#if plan.isPopular}
							<div class="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
								<span class="rounded-full bg-amber-500 px-4 py-1 text-sm font-bold text-white"
									>Most Popular</span
								>
							</div>
						{/if}
						{#if plan.isFree}
							<div class="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
								<span class="rounded-full bg-emerald-500 px-4 py-1 text-sm font-bold text-white"
									>Free Trial</span
								>
							</div>
						{/if}

						<div class="mb-4 text-center">
							<h3 class="font-playfair text-xl font-semibold text-slate-900">{plan.name}</h3>
							<p class="mt-2 text-sm text-slate-500">{plan.description}</p>
						</div>

						<div class="mb-6 text-center">
							{#if plan.isFree}
								<span class="text-4xl font-bold text-emerald-600">FREE</span>
							{:else}
								<span class="text-4xl font-bold text-slate-900">₦{plan.price.toLocaleString()}</span
								>
								{#if plan.id !== 'monthly'}
									<span class="text-sm text-slate-500">/one-time</span>
								{:else}
									<span class="text-sm text-slate-500">/month</span>
								{/if}
							{/if}
						</div>

						<div class="mb-6 flex-1">
							<ul class="space-y-3">
								{#each plan.features as feature}
									<li class="flex items-start gap-2 text-sm text-slate-600">
										<svg
											class="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500"
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
						</div>

						<a
							href="/contact"
							class="mt-auto w-full rounded-xl py-3 text-center font-medium transition-all {plan.isPopular
								? 'bg-amber-500 text-white hover:bg-amber-600'
								: 'border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}"
						>
							Get Started
						</a>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Features Comparison -->
	<section class="bg-white py-16">
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-4xl">
				<h2 class="font-playfair mb-8 text-center text-3xl font-bold text-slate-900">
					What's Included
				</h2>

				<div class="overflow-x-auto">
					<table class="w-full min-w-[600px]">
						<thead>
							<tr class="border-b border-slate-200">
								<th class="pb-4 text-left font-semibold text-slate-900">Feature</th>
								<th class="pb-4 text-center font-semibold text-slate-900">Free Trial</th>
								<th class="pb-4 text-center font-semibold text-amber-600">Monthly+</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							<tr>
								<td class="py-4 text-slate-600">QR Code per table</td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Digital menu management</td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Real-time order notifications</td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Basic analytics</td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Push notifications</td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Table reservations</td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Custom domain</td>
								<td class="py-4 text-center"><span class="text-slate-300">—</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Remove Proxifeast branding</td>
								<td class="py-4 text-center"><span class="text-slate-300">—</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Priority support</td>
								<td class="py-4 text-center"><span class="text-slate-300">—</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">Advanced analytics</td>
								<td class="py-4 text-center"><span class="text-slate-300">—</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
							<tr>
								<td class="py-4 text-slate-600">API access</td>
								<td class="py-4 text-center"><span class="text-slate-300">—</span></td>
								<td class="py-4 text-center"><span class="text-emerald-500">✓</span></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="bg-slate-50 py-16">
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-3xl">
				<h2 class="font-playfair mb-8 text-center text-3xl font-bold text-slate-900">
					Frequently Asked Questions
				</h2>

				<div class="space-y-4">
					{#each faqs as faq, index}
						<div class="rounded-xl bg-white shadow-sm">
							<button
								class="flex w-full items-center justify-between p-4 text-left font-medium text-slate-900"
								onclick={() => toggleFaq(index)}
							>
								<span>{faq.question}</span>
								<svg
									class="h-5 w-5 transform text-slate-500 transition-transform {openFaq === index
										? 'rotate-180'
										: ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
							{#if openFaq === index}
								<div class="border-t border-slate-100 px-4 pb-4" in:fly={{ y: -10, duration: 200 }}>
									<p class="pt-4 text-slate-600">{faq.answer}</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="bg-gradient-to-r from-slate-800 to-slate-700 py-16 text-center text-white">
		<div class="container mx-auto px-4">
			<div class="mx-auto max-w-2xl">
				<h2 class="font-playfair mb-4 text-3xl font-bold">Ready to Get Started?</h2>
				<p class="mb-8 text-slate-300">
					Start your free 7-day trial today. No credit card required.
				</p>
				<div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
					<a
						href="/contact"
						class="rounded-xl bg-white px-8 py-3 font-medium text-slate-800 transition-all hover:bg-slate-100"
					>
						Start Free Trial
					</a>
					<a
						href="/about"
						class="rounded-xl border-2 border-white px-8 py-3 font-medium text-white transition-all hover:bg-white/10"
					>
						Learn More
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
