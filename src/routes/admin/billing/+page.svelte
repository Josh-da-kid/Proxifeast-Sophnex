<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fly, fade } from 'svelte/transition';
	import pb from '$lib/pb';

	let { data } = $props();

	let activeTab = $state('overview');
	let showPaymentModal = $state(false);
	let selectedRestaurant = $state<any>(null);
	let selectedPlan = $state('monthly');
	let isProcessing = $state(false);
	let paymentSuccess = $state(false);
	let paymentError = $state('');

	// Handle URL params
	$effect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get('success') === '1') {
			paymentSuccess = true;
			setTimeout(() => {
				paymentSuccess = false;
				window.history.replaceState({}, '', '/admin/billing');
			}, 5000);
		}
		if (params.get('error')) {
			paymentError = params.get('error') || 'Payment failed';
			setTimeout(() => {
				paymentError = '';
				window.history.replaceState({}, '', '/admin/billing');
			}, 5000);
		}
	});

	// Show appropriate tab based on subscription status
	$effect(() => {
		if (data.subscriptionStatus === 'not_subscribed' || data.subscriptionStatus === 'expired') {
			activeTab = 'add';
		}
	});

	const plans = [
		{ id: 'monthly', name: 'Monthly', price: 15000, description: 'Billed monthly' },
		{
			id: 'quarterly',
			name: 'Quarterly',
			price: 40000,
			description: 'Billed quarterly (Save 11%)'
		},
		{ id: 'yearly', name: 'Yearly', price: 150000, description: 'Billed yearly (Save 17%)' }
	];

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200';
			case 'expired':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'cancelled':
				return 'bg-gray-100 text-gray-800 border-gray-200';
			default:
				return 'bg-amber-100 text-amber-800 border-amber-200';
		}
	}

	function getDaysUntilExpiry(endDate: string) {
		const now = new Date();
		const end = new Date(endDate);
		const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		return diff;
	}

	function isExpiringSoon(endDate: string) {
		return getDaysUntilExpiry(endDate) <= 30 && getDaysUntilExpiry(endDate) > 0;
	}

	async function handleSubscribe() {
		if (!selectedRestaurant) return;

		isProcessing = true;
		paymentError = '';

		try {
			const plan = plans.find((p) => p.id === selectedPlan);

			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					restaurantId: selectedRestaurant.id,
					restaurantName: selectedRestaurant.name,
					plan: selectedPlan,
					amount: plan?.price,
					email: selectedRestaurant.email || 'admin@restaurant.com',
					recurring: false,
					callbackUrl: window.location.origin + '/api/payment-callback'
				})
			});

			const result = await res.json();

			if (result.authorizationUrl) {
				window.location.href = result.authorizationUrl;
			} else {
				paymentError = result.error || 'Payment initialization failed';
			}
		} catch (err: any) {
			paymentError = err.message || 'Failed to process payment';
		}

		isProcessing = false;
	}

	async function renewSubscription(subscription: any) {
		isProcessing = true;

		try {
			const res = await fetch('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'renew',
					id: subscription.id
				})
			});

			const result = await res.json();
			if (result.success) {
				window.location.reload();
			}
		} catch (err) {
			console.error('Renew error:', err);
		}

		isProcessing = false;
	}
</script>

<svelte:head>
	<title>Billing - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Success/Error Alerts -->
	{#if paymentSuccess}
		<div class="container mx-auto mt-6 px-4">
			<div class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-emerald-600"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
					<polyline points="22 4 12 14.01 9 11.01" />
				</svg>
				<div>
					<h3 class="font-semibold text-emerald-800">Payment Successful!</h3>
					<p class="mt-1 text-sm text-emerald-700">Your subscription is now active.</p>
				</div>
			</div>
		</div>
	{/if}

	{#if paymentError}
		<div class="container mx-auto mt-6 px-4">
			<div class="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 text-red-600"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="15" y1="9" x2="9" y2="15" />
					<line x1="9" y1="9" x2="15" y2="15" />
				</svg>
				<div>
					<h3 class="font-semibold text-red-800">Payment Failed</h3>
					<p class="mt-1 text-sm text-red-700">{paymentError}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Expired Alert -->
	{#if data.expired || data.subscriptionStatus === 'expired' || data.subscriptionStatus === 'not_subscribed'}
		<div class="container mx-auto mt-6 px-4">
			<div class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mt-0.5 h-5 w-5 shrink-0 text-red-600"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div>
					<h3 class="font-semibold text-red-800">
						{#if data.subscriptionStatus === 'not_subscribed'}
							Subscription Required
						{:else}
							Subscription Expired
						{/if}
					</h3>
					<p class="mt-1 text-sm text-red-700">
						{#if data.subscriptionStatus === 'not_subscribed'}
							Your restaurant does not have an active subscription. Please subscribe to continue
							using Proxifeast.
						{:else}
							Your subscription has expired. Please renew to continue using Proxifeast.
						{/if}
					</p>
				</div>
			</div>
		</div>
	{:else if data.subscriptionStatus === 'expiring_soon'}
		<div class="container mx-auto mt-6 px-4">
			<div class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div>
					<h3 class="font-semibold text-amber-800">Subscription Expiring Soon</h3>
					<p class="mt-1 text-sm text-amber-700">
						Your subscription is expiring soon. Please renew to avoid service interruption.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Header -->
	<section
		class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-6 text-center text-white md:py-8"
	>
		<div class="container mx-auto px-4">
			<h1 class="font-playfair text-3xl font-bold md:text-4xl">Billing & Subscriptions</h1>
			<p class="mt-2 text-white/80">Manage your subscription and payment details</p>
		</div>
	</section>

	<!-- Stats Cards -->
	<section class="container mx-auto -mt-6 px-4">
		{#if data.isSuper}
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="rounded-xl bg-white p-4 shadow-lg shadow-slate-200">
					<div class="text-2xl font-bold text-slate-800">{data.stats.total}</div>
					<div class="text-sm text-slate-500">Total Restaurants</div>
				</div>
				<div class="rounded-xl bg-white p-4 shadow-lg shadow-slate-200">
					<div class="text-2xl font-bold text-emerald-600">{data.stats.active}</div>
					<div class="text-sm text-slate-500">Active Subscriptions</div>
				</div>
				<div class="rounded-xl bg-white p-4 shadow-lg shadow-slate-200">
					<div class="text-2xl font-bold text-amber-600">{data.stats.expiringSoon}</div>
					<div class="text-sm text-slate-500">Expiring Soon</div>
				</div>
				<div class="rounded-xl bg-white p-4 shadow-lg shadow-slate-200">
					<div class="text-2xl font-bold text-slate-800">
						₦{(data.stats.totalRevenue || 0).toLocaleString()}
					</div>
					<div class="text-sm text-slate-500">Total Revenue</div>
				</div>
			</div>
		{:else}
			<!-- Non-super restaurant subscription status -->
			<div class="rounded-xl bg-white p-6 shadow-lg shadow-slate-200">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-lg font-semibold text-slate-800">Your Subscription</h3>
						<p class="mt-1 text-sm text-slate-500">
							{#if data.subscription}
								{data.subscription.plan} plan - ₦{data.subscription.amount?.toLocaleString()}
							{:else}
								No active subscription
							{/if}
						</p>
					</div>
					<span
						class="rounded-full border px-3 py-1 text-sm font-medium {getStatusColor(
							data.subscriptionStatus
						)}"
					>
						{data.subscriptionStatus === 'not_subscribed'
							? 'Not Subscribed'
							: data.subscriptionStatus === 'expiring_soon'
								? 'Expiring Soon'
								: data.subscriptionStatus}
					</span>
				</div>
				{#if data.subscription}
					<div class="mt-4 border-t border-slate-100 pt-4">
						<div class="flex justify-between text-sm">
							<span class="text-slate-500">Start Date:</span>
							<span class="text-slate-800"
								>{new Date(data.subscription.startDate).toLocaleDateString()}</span
							>
						</div>
						<div class="mt-2 flex justify-between text-sm">
							<span class="text-slate-500">End Date:</span>
							<span class="text-slate-800"
								>{new Date(data.subscription.endDate).toLocaleDateString()}</span
							>
						</div>
						{#if data.subscriptionStatus === 'expiring_soon'}
							<div class="mt-4">
								<button
									class="btn btn-primary w-full"
									onclick={() => {
										activeTab = 'add';
										selectedPlan = data.subscription?.plan || 'monthly';
									}}
								>
									Renew Now
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Tabs -->
	{#if data.isSuper}
		<section class="container mx-auto mt-8 px-4">
			<div class="flex gap-2 border-b border-slate-200">
				<button
					class="border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
					'overview'
						? 'border-primary text-primary'
						: 'border-transparent text-slate-500 hover:text-slate-700'}"
					onclick={() => (activeTab = 'overview')}
				>
					Overview
				</button>
				<button
					class="border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
					'subscriptions'
						? 'border-primary text-primary'
						: 'border-transparent text-slate-500 hover:text-slate-700'}"
					onclick={() => (activeTab = 'subscriptions')}
				>
					All Subscriptions
				</button>
				<button
					class="border-b-2 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'add'
						? 'border-primary text-primary'
						: 'border-transparent text-slate-500 hover:text-slate-700'}"
					onclick={() => (activeTab = 'add')}
				>
					Add Subscription
				</button>
			</div>
		</section>
	{/if}

	<!-- Content -->
	<main class="container mx-auto px-4 py-8">
		{#if !data.isSuper && (data.subscriptionStatus === 'not_subscribed' || data.subscriptionStatus === 'expired')}
			<!-- Subscription plans for non-super restaurants -->
			<div class="mx-auto max-w-3xl">
				<div class="rounded-2xl bg-white p-6 shadow-sm">
					<h3 class="mb-6 text-lg font-semibold text-slate-800">
						{#if data.subscriptionStatus === 'not_subscribed'}
							Choose a Plan to Get Started
						{:else}
							Renew Your Subscription
						{/if}
					</h3>

					<div class="space-y-4">
						<div>
							<label class="mb-2 block text-sm font-medium text-slate-700">Select Plan</label>
							<div class="grid gap-4 md:grid-cols-3">
								{#each plans as plan}
									<button
										class="rounded-xl border-2 p-4 text-left transition-all {selectedPlan ===
										plan.id
											? 'border-primary bg-primary/5'
											: 'border-slate-200 hover:border-slate-300'}"
										onclick={() => (selectedPlan = plan.id)}
									>
										<p class="font-semibold text-slate-800">{plan.name}</p>
										<p class="text-primary mt-1 text-lg font-bold">
											₦{plan.price.toLocaleString()}
										</p>
										<p class="text-xs text-slate-500">{plan.description}</p>
									</button>
								{/each}
							</div>
						</div>

						<div class="mt-6 rounded-lg bg-slate-50 p-4">
							<div class="flex justify-between text-sm">
								<span class="text-slate-600">Plan:</span>
								<span class="font-medium text-slate-800 capitalize">{selectedPlan}</span>
							</div>
							<div class="mt-2 flex justify-between text-sm">
								<span class="text-slate-600">Amount:</span>
								<span class="text-primary font-bold"
									>₦{plans.find((p) => p.id === selectedPlan)?.price.toLocaleString()}</span
								>
							</div>
						</div>

						{#if paymentError}
							<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
								{paymentError}
							</div>
						{/if}

						<button
							class="btn btn-primary mt-6 w-full rounded-xl py-3"
							disabled={isProcessing}
							onclick={() => {
								selectedRestaurant = data.restaurant;
								handleSubscribe();
							}}
						>
							{#if isProcessing}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								Subscribe Now - ₦{plans.find((p) => p.id === selectedPlan)?.price.toLocaleString()}
							{/if}
						</button>
					</div>
				</div>
			</div>
		{:else if activeTab === 'overview'}
			<div class="grid gap-6 md:grid-cols-2">
				<!-- Active Subscriptions -->
				<div class="rounded-2xl bg-white p-6 shadow-sm">
					<h3 class="mb-4 text-lg font-semibold text-slate-800">Active Subscriptions</h3>
					<div class="space-y-3">
						{#each data.subscriptions.filter((s: any) => s.status === 'active') as subscription}
							{@const restaurant = data.restaurants.find(
								(r: any) => r.id === subscription.restaurantId
							)}
							<div class="flex items-center justify-between rounded-lg border border-slate-100 p-3">
								<div>
									<p class="font-medium text-slate-800">{restaurant?.name || 'Restaurant'}</p>
									<p class="text-xs text-slate-500">
										{subscription.plan} - ₦{(subscription.amount || 0).toLocaleString()}
									</p>
								</div>
								<div class="text-right">
									<span
										class="rounded-full border px-2 py-1 text-xs font-medium {getStatusColor(
											subscription.status
										)}"
									>
										{subscription.status}
									</span>
									{#if isExpiringSoon(subscription.endDate)}
										<p class="mt-1 text-xs text-amber-600">
											{getDaysUntilExpiry(subscription.endDate)} days left
										</p>
									{/if}
								</div>
							</div>
						{:else}
							<p class="text-sm text-slate-500">No active subscriptions</p>
						{/each}
					</div>
				</div>

				<!-- Expiring Soon -->
				<div class="rounded-2xl bg-white p-6 shadow-sm">
					<h3 class="mb-4 text-lg font-semibold text-slate-800">Expiring Soon (30 days)</h3>
					<div class="space-y-3">
						{#each data.subscriptions.filter((s: any) => s.status === 'active' && isExpiringSoon(s.endDate)) as subscription}
							{@const restaurant = data.restaurants.find(
								(r: any) => r.id === subscription.restaurantId
							)}
							<div
								class="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-3"
							>
								<div>
									<p class="font-medium text-slate-800">{restaurant?.name || 'Restaurant'}</p>
									<p class="text-xs text-slate-500">
										Expires: {new Date(subscription.endDate).toLocaleDateString()}
									</p>
								</div>
								<button
									class="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
									onclick={() => renewSubscription(subscription)}
								>
									Renew
								</button>
							</div>
						{:else}
							<p class="text-sm text-slate-500">No subscriptions expiring soon</p>
						{/each}
					</div>
				</div>
			</div>
		{:else if activeTab === 'subscriptions'}
			<div class="overflow-x-auto rounded-2xl bg-white shadow-sm">
				<table class="w-full">
					<thead class="bg-slate-50">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
								>Restaurant</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
								>Plan</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
								>Amount</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
								>Start Date</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
								>End Date</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
								>Status</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
								>Actions</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each data.subscriptions as subscription}
							{@const restaurant = data.restaurants.find(
								(r: any) => r.id === subscription.restaurantId
							)}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-3 font-medium text-slate-800"
									>{restaurant?.name || 'Restaurant'}</td
								>
								<td class="px-4 py-3 text-slate-600 capitalize">{subscription.plan}</td>
								<td class="px-4 py-3 text-slate-600"
									>₦{(subscription.amount || 0).toLocaleString()}</td
								>
								<td class="px-4 py-3 text-slate-600"
									>{new Date(subscription.startDate).toLocaleDateString()}</td
								>
								<td class="px-4 py-3 text-slate-600"
									>{new Date(subscription.endDate).toLocaleDateString()}</td
								>
								<td class="px-4 py-3">
									<span
										class="rounded-full border px-2 py-1 text-xs font-medium {getStatusColor(
											subscription.status
										)}"
									>
										{subscription.status}
									</span>
								</td>
								<td class="px-4 py-3">
									{#if subscription.status === 'active' && isExpiringSoon(subscription.endDate)}
										<button
											class="bg-primary hover:bg-primary/90 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
											onclick={() => renewSubscription(subscription)}
										>
											Renew
										</button>
									{/if}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="7" class="px-4 py-8 text-center text-slate-500"
									>No subscriptions found</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if activeTab === 'add'}
			<div class="mx-auto max-w-2xl">
				<div class="rounded-2xl bg-white p-6 shadow-sm">
					<h3 class="mb-6 text-lg font-semibold text-slate-800">Create New Subscription</h3>

					<div class="space-y-4">
						<div>
							<label class="mb-1 block text-sm font-medium text-slate-700">Select Restaurant</label>
							<select
								bind:value={selectedRestaurant}
								class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:outline-none"
							>
								<option value={null}>Choose a restaurant...</option>
								{#each data.restaurants as restaurant}
									<option value={restaurant}>{restaurant.name}</option>
								{/each}
							</select>
						</div>

						{#if selectedRestaurant}
							<div>
								<label class="mb-2 block text-sm font-medium text-slate-700">Select Plan</label>
								<div class="grid gap-4 md:grid-cols-3">
									{#each plans as plan}
										<button
											class="rounded-xl border-2 p-4 text-left transition-all {selectedPlan ===
											plan.id
												? 'border-primary bg-primary/5'
												: 'border-slate-200 hover:border-slate-300'}"
											onclick={() => (selectedPlan = plan.id)}
										>
											<p class="font-semibold text-slate-800">{plan.name}</p>
											<p class="text-primary mt-1 text-lg font-bold">
												₦{plan.price.toLocaleString()}
											</p>
											<p class="text-xs text-slate-500">{plan.description}</p>
										</button>
									{/each}
								</div>
							</div>

							<div class="mt-6 rounded-lg bg-slate-50 p-4">
								<div class="flex justify-between text-sm">
									<span class="text-slate-600">Plan:</span>
									<span class="font-medium text-slate-800 capitalize">{selectedPlan}</span>
								</div>
								<div class="mt-2 flex justify-between text-sm">
									<span class="text-slate-600">Amount:</span>
									<span class="text-primary font-bold"
										>₦{plans.find((p) => p.id === selectedPlan)?.price.toLocaleString()}</span
									>
								</div>
							</div>

							{#if paymentError}
								<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
									{paymentError}
								</div>
							{/if}

							<button
								class="btn btn-primary mt-6 w-full rounded-xl py-3"
								disabled={isProcessing || !selectedRestaurant}
								onclick={handleSubscribe}
							>
								{#if isProcessing}
									<span class="loading loading-spinner loading-sm"></span>
								{:else}
									Subscribe Now - ₦{plans
										.find((p) => p.id === selectedPlan)
										?.price.toLocaleString()}
								{/if}
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
