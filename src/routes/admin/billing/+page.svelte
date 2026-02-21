<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fly, fade } from 'svelte/transition';
	import pb from '$lib/pb';

	let { data } = $props();

	let activeTab = $state('overview');
	let showPaymentModal = $state(false);
	let showHistoryModal = $state(false);
	let selectedRestaurant = $state<any>(null);
	let selectedPlan = $state('monthly');
	let autoRenew = $state(false);
	let isProcessing = $state(false);
	let paymentSuccess = $state(false);
	let paymentError = $state('');
	let renewalMessage = $state('');

	// Real-time updates for progress and days remaining
	let currentTime = $state(Date.now());

	$effect(() => {
		// Update every second
		const interval = setInterval(() => {
			currentTime = Date.now();
		}, 1000);

		return () => clearInterval(interval);
	});

	// Force reactivity when currentTime changes
	let _forceUpdate = $derived(currentTime);

	function getDaysUntilExpiry(endDate: string) {
		if (!endDate) return 0;
		const now = new Date(currentTime);
		const end = new Date(endDate);
		const diffMs = end.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	}

	function isExpiringSoon(endDate: string) {
		const days = getDaysUntilExpiry(endDate);
		return days <= 30 && days > 0;
	}

	function getSubscriptionProgress(startDate: string, endDate: string): number {
		if (!startDate || !endDate) return 0;
		const start = new Date(startDate).getTime();
		const end = new Date(endDate).getTime();
		const now = currentTime;

		if (now >= end) return 100;
		if (now <= start) return 0;

		const total = end - start;
		const elapsed = now - start;
		return Math.round((elapsed / total) * 100);
	}

	function getDaysRemaining(endDate: string): number {
		if (!endDate) return 0;
		const now = new Date(currentTime);
		const end = new Date(endDate);
		const diffMs = end.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
		return Math.max(0, diffDays);
	}

	function handleRenewClick() {
		const daysRemaining = data.subscription?.endDate
			? getDaysRemaining(data.subscription.endDate)
			: 0;

		if (daysRemaining > 7) {
			renewalMessage = `You still have ${daysRemaining} days remaining on your current subscription. You can renew early, but your new subscription will start after your current one expires.`;
		} else if (daysRemaining > 0) {
			renewalMessage = `Your subscription expires in ${daysRemaining} days. Would you like to renew now?`;
		} else {
			renewalMessage = '';
		}

		selectedPlan = data.subscription?.plan || 'monthly';
	}

	function handleContactSupport() {
		const email = data.supportEmail || 'support@proxifeast.com';
		const subject = `Support Request - ${data.restaurant?.name || 'Restaurant'}`;
		const body = `Hello Proxifeast Support,\n\nI need help with my subscription.\n\nRestaurant: ${data.restaurant?.name || 'N/A'}\nCurrent Plan: ${data.subscription?.plan || 'N/A'}\nSubscription Status: ${data.subscriptionStatus}\n\nPlease assist me.`;
		window.open(
			`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
			'_blank'
		);
	}

	// Initialize PaystackPop (client-side only)
	function getPaystackPop() {
		if (typeof window === 'undefined') return null;
		return (window as any).PaystackPop;
	}

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
		{
			id: 'weekly',
			name: '7-Day Free Trial',
			price: 0,
			description: 'Free for 7 days',
			isFree: true
		},
		{ id: 'monthly', name: 'Monthly', price: 25000, description: 'Billed monthly' },
		{
			id: 'quarterly',
			name: 'Quarterly',
			price: 65000,
			description: 'Billed quarterly (Save 6%)'
		},
		{ id: 'yearly', name: 'Yearly', price: 250000, description: 'Billed yearly (Save 17%)' }
	];

	function hasFreeTrialUsed(restaurant: any): boolean {
		// Handle both string ID and full restaurant object
		const restaurantId = typeof restaurant === 'string' ? restaurant : restaurant?.id;
		if (!restaurantId) return data.hasUsedFreeTrial;
		const restaurantSubs =
			data.subscriptions?.filter((s: any) => s.restaurantId === restaurantId) || [];
		return restaurantSubs.some((s: any) => s.plan === 'weekly');
	}

	function getAvailablePlans(restaurant: any): typeof plans {
		// Only super users can grant free trial (weekly) subscriptions
		// Non-super users should never see the weekly option
		if (data.isSuper) {
			const used = hasFreeTrialUsed(restaurant);
			if (used) {
				return plans.filter((p) => p.id !== 'weekly');
			}
			return plans;
		}
		// Non-super users cannot subscribe to free trial
		return plans.filter((p) => p.id !== 'weekly');
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'bg-emerald-100 text-emerald-800 border-emerald-200';
			case 'expired':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'cancelled':
				return 'bg-gray-100 text-gray-800 border-gray-200';
			case 'test':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			default:
				return 'bg-amber-100 text-amber-800 border-amber-200';
		}
	}

	function getStatusDisplay(status: string) {
		switch (status) {
			case 'test':
				return 'Test (Free Trial)';
			case 'active':
				return 'Active';
			case 'expired':
				return 'Expired';
			case 'cancelled':
				return 'Cancelled';
			case 'pending':
				return 'Pending';
			case 'inactive':
				return 'Inactive';
			default:
				return status;
		}
	}

	function handleSubscribe() {
		const PaystackPop = getPaystackPop();

		if (!PaystackPop) {
			paymentError = 'Payment system not loaded. Please refresh the page.';
			isProcessing = false;
			return;
		}

		if (!data.paystackKey) {
			paymentError = 'Payment configuration not found. Please contact support.';
			isProcessing = false;
			return;
		}

		const plan = plans.find((p) => p.id === selectedPlan);
		if (!plan) {
			paymentError = 'Please select a plan';
			return;
		}

		// Get restaurant from subscription, layout, or selected restaurant (for super users)
		let restaurant = data.restaurant;

		// For super users adding subscriptions, use selectedRestaurant (find full object from ID)
		if (data.isSuper && activeTab === 'add' && selectedRestaurant) {
			restaurant = data.restaurants.find((r: any) => r.id === selectedRestaurant);
		}

		// Fallback for non-super users with existing subscription
		if (!restaurant && data.subscription) {
			restaurant = {
				id: data.subscription.restaurantId,
				name: 'Restaurant',
				email: 'admin@restaurant.com'
			};
		}

		if (!restaurant) {
			paymentError = 'Restaurant not found';
			return;
		}

		// Handle free trial subscription (no payment required)
		if (plan.isFree || plan.price === 0) {
			isProcessing = true;
			paymentError = '';

			fetch('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'createFreeTrial',
					restaurantId: restaurant.id,
					plan: 'weekly',
					amount: 0,
					startDate: new Date().toISOString(),
					endDate: getEndDate('weekly').toISOString(),
					status: 'active',
					autoRenew: false
				})
			})
				.then((res) => res.json())
				.then((result) => {
					console.log('Free trial result:', result);
					if (result.success) {
						paymentSuccess = true;
						window.location.reload();
					} else {
						paymentError = result.error || result.details || 'Failed to create free trial';
					}
				})
				.catch((err) => {
					console.error('Free trial error:', err);
					paymentError = 'Failed to create free trial';
				})
				.finally(() => {
					isProcessing = false;
				});
			return;
		}

		isProcessing = true;
		paymentError = '';

		const email = restaurant.email || 'admin@restaurant.com';

		try {
			let handler = PaystackPop.setup({
				key: data.paystackKey,
				email: email,
				amount: plan.price * 100,
				currency: 'NGN',
				ref: 'SUB-' + Math.floor(Math.random() * 1000000000 + 1),
				metadata: {
					restaurantId: restaurant.id,
					restaurantName: restaurant.name,
					plan: selectedPlan,
					type: 'subscription'
				},
				callback: function (response: any) {
					// Payment complete - update or create subscription
					fetch('/api/subscriptions', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							action: data.subscription?.id ? 'update' : 'create',
							restaurantId: restaurant.id,
							plan: selectedPlan,
							amount: plan.price,
							startDate: new Date().toISOString(),
							endDate: getEndDate(selectedPlan).toISOString(),
							status: 'active',
							paymentReference: response.reference,
							recurring: false,
							autoRenew: autoRenew,
							id: data.subscription?.id || null
						})
					})
						.then((res) => res.json())
						.then((result) => {
							if (result.success) {
								paymentSuccess = true;
								window.location.reload();
							} else {
								paymentError = 'Failed to save subscription: ' + (result.error || '');
							}
						})
						.catch((err) => {
							console.error('Subscription error:', err);
							paymentError = 'Failed to save subscription';
						})
						.finally(() => {
							isProcessing = false;
						});
				},
				onClose: function () {
					isProcessing = false;
				}
			});
			handler.openIframe();
		} catch (err) {
			console.error('Paystack error:', err);
			paymentError = 'Failed to initialize payment';
			isProcessing = false;
		}
	}

	function getEndDate(plan: string): Date {
		const endDate = new Date();
		switch (plan) {
			case 'weekly':
				endDate.setDate(endDate.getDate() + 7);
				break;
			case 'monthly':
				endDate.setMonth(endDate.getMonth() + 1);
				break;
			case 'quarterly':
				endDate.setMonth(endDate.getMonth() + 3);
				break;
			case 'yearly':
				endDate.setFullYear(endDate.getFullYear() + 1);
				break;
		}
		return endDate;
	}

	function renewSubscription(subscription: any) {
		const PaystackPop = getPaystackPop();

		if (!PaystackPop) {
			paymentError = 'Payment system not loaded. Please refresh the page.';
			return;
		}

		if (!data.paystackKey) {
			paymentError = 'Payment configuration not found';
			return;
		}

		const plan = subscription.plan || 'monthly';
		const amount = subscription.amount || 15000;

		isProcessing = true;
		paymentError = '';

		// Get restaurant from subscription's restaurantId (works for both super and non-super)
		const restaurant = data.restaurants?.find((r: any) => r.id === subscription.restaurantId);
		const email = restaurant?.email || data.restaurant?.email || 'admin@restaurant.com';

		try {
			let handler = PaystackPop.setup({
				key: data.paystackKey,
				email: email,
				amount: amount * 100,
				currency: 'NGN',
				ref: 'REN-' + Math.floor(Math.random() * 1000000000 + 1),
				callback: function (response: any) {
					// Payment complete - renew subscription
					fetch('/api/subscriptions', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							action: 'renew',
							id: subscription.id,
							paymentReference: response.reference
						})
					})
						.then((res) => res.json())
						.then((result) => {
							if (result.success) {
								paymentSuccess = true;
								window.location.reload();
							} else {
								paymentError = 'Failed to renew subscription';
							}
						})
						.catch((err) => {
							console.error('Renew error:', err);
							paymentError = 'Failed to renew subscription';
						})
						.finally(() => {
							isProcessing = false;
						});
				},
				onClose: function () {
					isProcessing = false;
				}
			});
			handler.openIframe();
		} catch (err) {
			console.error('Paystack error:', err);
			paymentError = 'Failed to initialize payment';
			isProcessing = false;
		}
	}

	async function toggleAutoRenew(subscription: any) {
		isProcessing = true;
		paymentError = '';

		try {
			const response = await fetch('/api/subscriptions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'toggleAutoRenew',
					id: subscription.id
				})
			});

			const result = await response.json();

			if (result.success) {
				paymentSuccess = true;
				window.location.reload();
			} else {
				paymentError = 'Failed to toggle auto-renew: ' + (result.error || '');
			}
		} catch (err) {
			console.error('Toggle auto-renew error:', err);
			paymentError = 'Failed to toggle auto-renew';
		} finally {
			isProcessing = false;
		}
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

	<!-- Expired/Cancelled/Pending/Not Subscribed Alert -->
	{#if data.expired || data.subscriptionStatus === 'expired' || data.subscriptionStatus === 'not_subscribed' || data.subscriptionStatus === 'cancelled' || data.subscriptionStatus === 'pending'}
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
						{:else if data.subscriptionStatus === 'pending'}
							Subscription Pending
						{:else if data.subscriptionStatus === 'cancelled'}
							Subscription Cancelled
						{:else}
							Subscription Expired
						{/if}
					</h3>
					<p class="mt-1 text-sm text-red-700">
						{#if data.subscriptionStatus === 'not_subscribed'}
							Your restaurant does not have an active subscription. Please subscribe to continue
							using Proxifeast.
						{:else if data.subscriptionStatus === 'pending'}
							Your subscription is currently pending. Please complete payment to activate your
							subscription.
						{:else if data.subscriptionStatus === 'cancelled'}
							Your subscription has been cancelled. Please renew to continue using Proxifeast.
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
			<div class="grid grid-cols-2 gap-4 md:grid-cols-5">
				<div class="rounded-xl bg-white p-4 shadow-lg shadow-slate-200">
					<div class="text-2xl font-bold text-slate-800">{data.stats.total}</div>
					<div class="text-sm text-slate-500">Total Restaurants</div>
				</div>
				<div class="rounded-xl bg-white p-4 shadow-lg shadow-slate-200">
					<div class="text-2xl font-bold text-emerald-600">{data.stats.active}</div>
					<div class="text-sm text-slate-500">Active Subscriptions</div>
				</div>
				<div class="rounded-xl bg-white p-4 shadow-lg shadow-slate-200">
					<div class="text-2xl font-bold text-blue-600">{data.stats.testCount}</div>
					<div class="text-sm text-slate-500">Test Subscriptions</div>
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
								: data.subscriptionStatus === 'cancelled'
									? 'Cancelled'
									: data.subscriptionStatus === 'pending'
										? 'Pending'
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
		{#if !data.isSuper && (data.subscriptionStatus === 'not_subscribed' || data.subscriptionStatus === 'expired' || data.subscriptionStatus === 'cancelled' || data.subscriptionStatus === 'pending')}
			<!-- Subscription plans for non-super restaurants -->
			<div class="mx-auto max-w-3xl">
				<div class="rounded-2xl bg-white p-6 shadow-sm">
					<h3 class="mb-6 text-lg font-semibold text-slate-800">
						{#if data.subscriptionStatus === 'not_subscribed' || data.subscriptionStatus === 'cancelled' || data.subscriptionStatus === 'expired'}
							Choose a Plan to Get Started
						{:else}
							Complete Your Subscription
						{/if}
					</h3>

					<div class="space-y-4">
						<div>
							<label class="mb-2 block text-sm font-medium text-slate-700">Select Plan</label>
							<div class="grid gap-4 md:grid-cols-{getAvailablePlans(data.restaurant).length}">
								{#each getAvailablePlans(data.restaurant) as plan}
									<button
										class="relative rounded-xl border-2 p-4 text-left transition-all {selectedPlan ===
										plan.id
											? 'border-primary bg-primary/5'
											: 'border-slate-200 hover:border-slate-300'}"
										onclick={() => (selectedPlan = plan.id)}
									>
										{#if plan.isFree}
											<span
												class="absolute -top-2 -right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white"
												>FREE</span
											>
										{/if}
										<p class="font-semibold text-slate-800">{plan.name}</p>
										<p class="text-primary mt-1 text-lg font-bold">
											{plan.isFree ? 'FREE' : `₦${plan.price.toLocaleString()}`}
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
									>{plans.find((p) => p.id === selectedPlan)?.isFree
										? 'FREE'
										: `₦${plans.find((p) => p.id === selectedPlan)?.price.toLocaleString()}`}</span
								>
							</div>
							{#if selectedPlan !== 'weekly'}
								<div class="mt-2 flex items-center justify-between text-sm">
									<span class="text-slate-600">Auto Renew:</span>
									<label class="relative inline-flex cursor-pointer items-center">
										<input type="checkbox" bind:checked={autoRenew} class="peer sr-only" />
										<div
											class="peer peer-checked:bg-primary h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
										></div>
										<span
											class="ml-2 text-sm font-medium {autoRenew
												? 'text-primary'
												: 'text-slate-500'}"
										>
											{autoRenew ? 'Enabled' : 'Disabled'}
										</span>
									</label>
								</div>
							{/if}
						</div>

						{#if paymentError}
							<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
								{paymentError}
							</div>
						{/if}

						<button class="btn btn-primary mt-6 w-full rounded-xl py-3" onclick={handleSubscribe}>
							{#if isProcessing}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								{@const planBtn = plans.find((p) => p.id === selectedPlan)}
								Subscribe Now {planBtn?.isFree
									? '(Free Trial)'
									: `- ₦${planBtn?.price.toLocaleString()}`}
							{/if}
						</button>
					</div>
				</div>
			</div>
		{:else if !data.isSuper && data.subscription && (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'expiring_soon')}
			<!-- Active Subscription Dashboard for Non-Super Restaurants -->
			<div class="mx-auto max-w-4xl">
				<!-- Header Card -->
				{#if data.subscriptionStatus === 'expiring_soon'}
					<div class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-6 py-4">
						<div class="flex items-center gap-3">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-amber-600"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
								/>
								<line x1="12" y1="9" x2="12" y2="13" />
								<line x1="12" y1="17" x2="12.01" y2="17" />
							</svg>
							<div>
								<h3 class="font-semibold text-amber-800">Subscription Expiring Soon</h3>
								<p class="text-sm text-amber-700">
									Your subscription expires in {data.subscription.endDate
										? getDaysRemaining(data.subscription.endDate)
										: 0} days. Consider renewing to avoid interruption.
								</p>
							</div>
						</div>
					</div>
				{/if}

				<div class="mb-6 overflow-hidden rounded-2xl bg-white shadow-md">
					<div class="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-8">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-slate-300">Current Plan</p>
								<h2 class="font-playfair mt-1 text-3xl font-bold text-white capitalize">
									{data.subscription.plan}
								</h2>
							</div>
							<div class="text-right">
								<span
									class="rounded-full border border-emerald-400 bg-emerald-500/20 px-4 py-1.5 text-sm font-semibold text-emerald-300"
								>
									Active
								</span>
							</div>
						</div>
					</div>

					<!-- Progress Section -->
					<div class="px-6 py-6">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm font-medium text-slate-600">Subscription Progress</span>
							<span class="text-sm font-bold text-slate-800">
								{data.subscription.startDate
									? getSubscriptionProgress(data.subscription.startDate, data.subscription.endDate)
									: 0}%
							</span>
						</div>
						<div class="h-3 w-full overflow-hidden rounded-full bg-slate-100">
							<div
								class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
								style="width: {data.subscription.startDate
									? getSubscriptionProgress(data.subscription.startDate, data.subscription.endDate)
									: 0}%"
							></div>
						</div>
						<p class="mt-2 text-xs text-slate-500">
							{data.subscription.startDate ? getDaysRemaining(data.subscription.endDate) : 0} days remaining
							until renewal
						</p>
					</div>
				</div>

				<!-- Details Grid -->
				<div class="grid gap-4 md:grid-cols-2">
					<!-- Plan Details -->
					<div class="rounded-xl bg-white p-6 shadow-sm">
						<h3
							class="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect width="20" height="14" x="2" y="5" rx="2" />
								<line x1="2" x2="22" y1="10" y2="10" />
							</svg>
							Plan Details
						</h3>
						<div class="space-y-4">
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">Plan Type</span>
								<span class="font-medium text-slate-800 capitalize">{data.subscription.plan}</span>
							</div>
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">Amount</span>
								<span class="font-medium text-slate-800"
									>₦{data.subscription.amount?.toLocaleString()}</span
								>
							</div>
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">Billing Cycle</span>
								<span class="font-medium text-slate-800 capitalize"
									>{data.subscription.plan === 'monthly'
										? 'Monthly'
										: data.subscription.plan === 'quarterly'
											? 'Quarterly'
											: 'Yearly'}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="text-slate-600">Next Renewal</span>
								<span class="font-medium text-slate-800"
									>{data.subscription.endDate
										? new Date(data.subscription.endDate).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'long',
												day: 'numeric'
											})
										: 'N/A'}</span
								>
							</div>
						</div>
					</div>

					<!-- Subscription Period -->
					<div class="rounded-xl bg-white p-6 shadow-sm">
						<h3
							class="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
								<line x1="16" y1="2" x2="16" y2="6" />
								<line x1="8" y1="2" x2="8" y2="6" />
								<line x1="3" y1="10" x2="21" y2="10" />
							</svg>
							Subscription Period
						</h3>
						<div class="space-y-4">
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">Start Date</span>
								<span class="font-medium text-slate-800"
									>{data.subscription.startDate
										? new Date(data.subscription.startDate).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'long',
												day: 'numeric'
											})
										: 'N/A'}</span
								>
							</div>
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">End Date</span>
								<span class="font-medium text-slate-800"
									>{data.subscription.endDate
										? new Date(data.subscription.endDate).toLocaleDateString('en-US', {
												year: 'numeric',
												month: 'long',
												day: 'numeric'
											})
										: 'N/A'}</span
								>
							</div>
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">Duration</span>
								<span class="font-medium text-slate-800">
									{#if data.subscription.plan === 'monthly'}
										30 Days
									{:else if data.subscription.plan === 'quarterly'}
										90 Days
									{:else if data.subscription.plan === 'yearly'}
										365 Days
									{/if}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-slate-600">Days Remaining</span>
								<span class="font-medium text-emerald-600"
									>{data.subscription.endDate ? getDaysRemaining(data.subscription.endDate) : 0} days</span
								>
							</div>
						</div>
					</div>

					<!-- Payment Info -->
					<div class="rounded-xl bg-white p-6 shadow-sm">
						<h3
							class="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
							</svg>
							Payment Information
						</h3>
						<div class="space-y-4">
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">Payment Status</span>
								<span
									class="font-medium {data.subscription.status === 'test'
										? 'text-blue-600'
										: 'text-emerald-600'} capitalize"
									>{getStatusDisplay(data.subscription.status)}</span
								>
							</div>
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">Transaction Ref</span>
								<span class="font-mono text-xs text-slate-800"
									>{data.subscription?.paymentReference ||
										data.subscription?.payment_reference ||
										'N/A'}</span
								>
							</div>
							<div class="flex justify-between border-b border-slate-100 pb-3">
								<span class="text-slate-600">Auto Renew</span>
								<div class="flex items-center gap-2">
									<span
										class="font-medium {data.subscription.autoRenew
											? 'text-emerald-600'
											: 'text-slate-800'}"
									>
										{data.subscription.autoRenew ? 'Enabled' : 'Disabled'}
									</span>
									{#if data.subscription?.plan !== 'weekly'}
										<button
											class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
											onclick={() => toggleAutoRenew(data.subscription)}
											disabled={isProcessing}
										>
											{isProcessing ? '...' : data.subscription.autoRenew ? 'Disable' : 'Enable'}
										</button>
									{/if}
								</div>
							</div>
							<div class="flex justify-between">
								<span class="text-slate-600">Recurring</span>
								<span class="font-medium text-slate-800"
									>{data.subscription.recurring ? 'Yes' : 'No'}</span
								>
							</div>
						</div>
					</div>

					<!-- Quick Actions -->
					<div class="rounded-xl bg-white p-6 shadow-sm">
						<h3
							class="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wider text-slate-500 uppercase"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
							</svg>
							Quick Actions
						</h3>

						{#if renewalMessage}
							<div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
								<p class="text-sm text-amber-800">{renewalMessage}</p>
							</div>
						{/if}

						<div class="space-y-3">
							<button
								class="border-primary bg-primary/5 text-primary hover:bg-primary w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:text-white"
								onclick={handleRenewClick}
							>
								Renew Subscription
							</button>
							<button
								class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
								onclick={() => (showHistoryModal = true)}
							>
								View Payment History
							</button>
							<button
								class="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
								onclick={handleContactSupport}
							>
								Contact Support
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Payment History Modal -->
		{#if showHistoryModal}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
				onclick={() => (showHistoryModal = false)}
			>
				<div
					class="m-4 max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6"
					onclick={(e) => e.stopPropagation()}
				>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="font-playfair text-xl font-bold text-slate-800">Payment History</h3>
						<button
							onclick={() => (showHistoryModal = false)}
							class="text-slate-400 hover:text-slate-600"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>

					{#if data.subscription}
						<div class="space-y-4">
							<div class="rounded-lg border border-slate-200 p-4">
								<div class="flex items-center justify-between">
									<div>
										<p class="font-medium text-slate-800 capitalize">
											{data.subscription.plan === 'weekly'
												? '7-Day Free Trial'
												: `${data.subscription.plan} Plan`}
										</p>
										<p class="text-sm text-slate-500">
											₦{data.subscription.amount?.toLocaleString()}
										</p>
									</div>
									<span
										class="rounded-full px-3 py-1 text-xs font-medium capitalize {getStatusColor(
											data.subscription.status
										)}"
									>
										{getStatusDisplay(data.subscription.status)}
									</span>
								</div>
								<div class="mt-3 grid grid-cols-2 gap-2 text-sm">
									<div>
										<p class="text-slate-500">Start Date</p>
										<p class="font-medium text-slate-800">
											{data.subscription.startDate
												? new Date(data.subscription.startDate).toLocaleDateString()
												: 'N/A'}
										</p>
									</div>
									<div>
										<p class="text-slate-500">End Date</p>
										<p class="font-medium text-slate-800">
											{data.subscription.endDate
												? new Date(data.subscription.endDate).toLocaleDateString()
												: 'N/A'}
										</p>
									</div>
									<div class="col-span-2">
										<p class="text-slate-500">Transaction Reference</p>
										<p class="font-mono text-xs text-slate-800">
											{data.subscription?.paymentReference ||
												data.subscription?.payment_reference ||
												'N/A'}
										</p>
									</div>
								</div>
							</div>

							{#if data.previousSubscriptions?.length > 0}
								<h4 class="font-semibold text-slate-700">Previous Subscriptions</h4>
								{#each data.previousSubscriptions as prevSub}
									<div class="rounded-lg border border-slate-200 p-4 opacity-75">
										<div class="flex items-center justify-between">
											<div>
												<p class="font-medium text-slate-800 capitalize">{prevSub.plan} Plan</p>
												<p class="text-sm text-slate-500">₦{prevSub.amount?.toLocaleString()}</p>
											</div>
											<span
												class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 capitalize"
											>
												{prevSub.status}
											</span>
										</div>
										<p class="mt-2 text-sm text-slate-500">
											{prevSub.startDate ? new Date(prevSub.startDate).toLocaleDateString() : 'N/A'}
											- {prevSub.endDate ? new Date(prevSub.endDate).toLocaleDateString() : 'N/A'}
										</p>
									</div>
								{/each}
							{/if}

							{#if !data.previousSubscriptions?.length}
								<p class="text-center text-slate-500">No previous subscription records found.</p>
							{/if}
						</div>
					{:else}
						<p class="text-center text-slate-500">No subscription history available.</p>
					{/if}
				</div>
			</div>
		{:else if data.isSuper && activeTab === 'overview'}
			<div class="grid gap-6 md:grid-cols-2">
				<!-- Active Subscriptions -->
				<div class="rounded-2xl bg-white p-6 shadow-sm">
					<h3 class="mb-4 text-lg font-semibold text-slate-800">Active Subscriptions</h3>
					<div class="space-y-3">
						{#each data.subscriptions.filter((s: any) => s.status === 'active' || s.status === 'test') as subscription}
							{@const restaurant = data.restaurants.find(
								(r: any) => r.id === subscription.restaurantId
							)}
							<div class="flex items-center justify-between rounded-lg border border-slate-100 p-3">
								<div>
									<p class="font-medium text-slate-800">{restaurant?.name || 'Restaurant'}</p>
									<p class="text-xs text-slate-500">
										{subscription.plan} - ₦{(subscription.amount || 0).toLocaleString()}
									</p>
									<p
										class="text-xs {subscription.autoRenew ? 'text-emerald-600' : 'text-slate-400'}"
									>
										Auto Renew: {subscription.autoRenew ? 'Enabled' : 'Disabled'}
									</p>
								</div>
								<div class="text-right">
									<span
										class="rounded-full border px-2 py-1 text-xs font-medium {getStatusColor(
											subscription.status
										)}"
									>
										{getStatusDisplay(subscription.status)}
									</span>
									{#if subscription.plan !== 'weekly' && subscription.status !== 'test'}
										<button
											class="mt-1 block rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
											onclick={() => toggleAutoRenew(subscription)}
											disabled={isProcessing}
										>
											{isProcessing ? '...' : subscription.autoRenew ? 'Disable' : 'Enable'}
										</button>
									{/if}
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
						{#each data.subscriptions.filter((s: any) => (s.status === 'active' || s.status === 'test') && isExpiringSoon(s.endDate)) as subscription}
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
									<p
										class="text-xs {subscription.autoRenew ? 'text-emerald-600' : 'text-slate-400'}"
									>
										Auto Renew: {subscription.autoRenew ? 'Enabled' : 'Disabled'}
									</p>
								</div>
								<div class="flex flex-col items-end gap-2">
									{#if subscription.status === 'test'}
										<button
											class="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
											onclick={() => {
												activeTab = 'add';
												selectedRestaurant = data.restaurants.find(
													(r: any) => r.id === subscription.restaurantId
												)?.id;
											}}
										>
											Upgrade
										</button>
									{:else}
										<button
											class="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
											onclick={() => renewSubscription(subscription)}
										>
											Renew
										</button>
									{/if}
									{#if subscription.plan !== 'weekly' && subscription.status !== 'test'}
										<button
											class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
											onclick={() => toggleAutoRenew(subscription)}
											disabled={isProcessing}
										>
											{isProcessing
												? '...'
												: subscription.autoRenew
													? 'Disable Auto'
													: 'Enable Auto'}
										</button>
									{/if}
								</div>
							</div>
						{:else}
							<p class="text-sm text-slate-500">No subscriptions expiring soon</p>
						{/each}
					</div>
				</div>
			</div>
		{:else if data.isSuper && activeTab === 'subscriptions'}
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
								>Auto Renew</th
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
								<td class="px-4 py-3 text-slate-600 capitalize"
									>{subscription.plan === 'weekly' ? '7-Day Free Trial' : subscription.plan}</td
								>
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
									{#if subscription.plan !== 'weekly' && subscription.status !== 'test'}
										<button
											class="rounded-lg px-2 py-1 text-xs font-medium {subscription.autoRenew
												? 'bg-emerald-100 text-emerald-700'
												: 'bg-slate-100 text-slate-600'}"
											onclick={() => toggleAutoRenew(subscription)}
											disabled={isProcessing}
										>
											{subscription.autoRenew ? 'Enabled' : 'Disabled'}
										</button>
									{:else}
										<span class="text-xs text-slate-400">N/A</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<span
										class="rounded-full border px-2 py-1 text-xs font-medium {getStatusColor(
											subscription.status
										)}"
									>
										{getStatusDisplay(subscription.status)}
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
								<td colspan="8" class="px-4 py-8 text-center text-slate-500"
									>No subscriptions found</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if data.isSuper && activeTab === 'add'}
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
									<option value={restaurant.id}>{restaurant.name}</option>
								{/each}
							</select>
						</div>

						{#if selectedRestaurant}
							<div>
								<label class="mb-2 block text-sm font-medium text-slate-700">Select Plan</label>
								<div class="grid gap-4 md:grid-cols-{getAvailablePlans(selectedRestaurant).length}">
									{#each getAvailablePlans(selectedRestaurant) as plan}
										<button
											class="relative rounded-xl border-2 p-4 text-left transition-all {selectedPlan ===
											plan.id
												? 'border-primary bg-primary/5'
												: 'border-slate-200 hover:border-slate-300'}"
											onclick={() => (selectedPlan = plan.id)}
										>
											{#if plan.isFree}
												<span
													class="absolute -top-2 -right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white"
													>FREE</span
												>
											{/if}
											<p class="font-semibold text-slate-800">{plan.name}</p>
											<p class="text-primary mt-1 text-lg font-bold">
												{plan.isFree ? 'FREE' : `₦${plan.price.toLocaleString()}`}
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
										>{plans.find((p) => p.id === selectedPlan)?.isFree
											? 'FREE'
											: `₦${plans.find((p) => p.id === selectedPlan)?.price.toLocaleString()}`}</span
									>
								</div>
								{#if selectedPlan !== 'weekly'}
									<div class="mt-2 flex items-center justify-between text-sm">
										<span class="text-slate-600">Auto Renew:</span>
										<label class="relative inline-flex cursor-pointer items-center">
											<input type="checkbox" bind:checked={autoRenew} class="peer sr-only" />
											<div
												class="peer peer-checked:bg-primary h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
											></div>
											<span
												class="ml-2 text-sm font-medium {autoRenew
													? 'text-primary'
													: 'text-slate-500'}"
											>
												{autoRenew ? 'Enabled' : 'Disabled'}
											</span>
										</label>
									</div>
								{/if}
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
									{@const planBtn = plans.find((p) => p.id === selectedPlan)}
									Subscribe Now {planBtn?.isFree
										? '(Free Trial)'
										: `- ₦${planBtn?.price.toLocaleString()}`}
								{/if}
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
