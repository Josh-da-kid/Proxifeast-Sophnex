<script lang="ts">
	import { page } from '$app/stores';
	import { fly, fade } from 'svelte/transition';

	let showSuccess = $state(false);
	let logoutSuccess = $state(false);

	// Modal state for linking account
	let showLinkModal = $state(false);
	let linkRestaurantName = $state('');
	let linkRestaurantId = $state('');
	let linkEmail = $state('');
	let linkError = $state('');
	let linkSuccess = $state('');
	let isLinking = $state(false);

	$effect(() => {
		if ($page.url.searchParams.get('signup') === 'success') {
			showSuccess = true;
			setTimeout(() => {
				showSuccess = false;
			}, 6000);
			const url = new URL(window.location.href);
			url.searchParams.delete('signup');
			history.replaceState(null, '', url.pathname + url.search);
		}

		if ($page.url.searchParams.get('logout') === 'success') {
			logoutSuccess = true;
			setTimeout(() => {
				logoutSuccess = false;
			}, 3000);
			const url = new URL(window.location.href);
			url.searchParams.delete('logout');
			history.replaceState(null, '', url.pathname + url.search);
		}
	});

	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let error = $state('');
	let success = $state('');
	let isLoading = $state(false);

	async function login(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		isLoading = true;

		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const result = await res.json();

			if (result.error === true || !res.ok) {
				if (result.code === 'NOT_REGISTERED_FOR_RESTAURANT') {
					linkRestaurantName = result.restaurantName || 'this restaurant';
					linkRestaurantId = result.restaurantId || '';
					linkEmail = result.email || email;
					showLinkModal = true;
				} else {
					error = result.message || 'Login failed.';
				}
			} else {
				success = result.message || 'Login successful!';
				window.location.href = '/';
			}
		} catch (err) {
			console.error('Fetch failed:', err);
			error = 'Failed to connect to server.';
		}
		isLoading = false;
	}

	async function linkAccount() {
		linkError = '';
		linkSuccess = '';
		isLinking = true;

		try {
			const res = await fetch('/api/link-restaurant', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: linkEmail,
					restaurantId: linkRestaurantId
				})
			});

			const result = await res.json();

			if (result.error) {
				linkError = result.message || 'Failed to link account.';
			} else {
				linkSuccess = result.message || 'Account linked successfully!';
				setTimeout(() => {
					showLinkModal = false;
					// Retry login
					login(new Event('submit'));
				}, 1500);
			}
		} catch (err) {
			console.error('Link failed:', err);
			linkError = 'Failed to connect to server.';
		}
		isLinking = false;
	}
</script>

<svelte:head>
	<title>Login - Proxifeast</title>
</svelte:head>

{#if showSuccess}
	<div
		class="alert alert-success fixed top-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 shadow-lg"
		in:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Account created! Please check your email to verify before logging in.</span>
	</div>
{/if}

{#if logoutSuccess}
	<div
		class="alert alert-success fixed top-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 shadow-lg"
		in:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5 shrink-0"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Logout successful!</span>
	</div>
{/if}

<!-- Link Account Modal -->
{#if showLinkModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		in:fade={{ duration: 200 }}
	>
		<div
			class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
			in:fly={{ y: 20, duration: 300 }}
		>
			<div class="text-center">
				<div
					class="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-primary h-6 w-6"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-xl font-bold text-gray-900">Link to {linkRestaurantName}?</h3>
				<p class="mb-6 text-gray-600">
					Your account ({linkEmail}) is not registered for <strong>{linkRestaurantName}</strong>.
					Would you like to link your existing account to this restaurant?
				</p>

				{#if linkError}
					<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
						{linkError}
					</div>
				{/if}

				{#if linkSuccess}
					<div class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
						{linkSuccess}
					</div>
				{/if}

				<div class="flex gap-3">
					<button
						type="button"
						class="btn btn-ghost flex-1"
						onclick={() => {
							showLinkModal = false;
							linkError = '';
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						class="btn btn-primary flex-1"
						disabled={isLinking}
						onclick={linkAccount}
					>
						{#if isLinking}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							Link Account
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-100 px-4 py-8"
>
	<div class="w-full max-w-md" in:fade={{ duration: 400 }}>
		<!-- Logo & Header -->
		<div class="mb-8 text-center">
			<div
				class="bg-primary shadow-primary/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="text-primary-content h-8 w-8"
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
			<h1 class="font-playfair text-3xl font-bold text-gray-900">Welcome Back</h1>
			<p class="mt-2 text-gray-600">Sign in to continue to Proxifeast</p>
		</div>

		<!-- Login Card -->
		<div class="rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50">
			<form onsubmit={login} class="space-y-5">
				<!-- Email -->
				<div class="space-y-2">
					<label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
					<input
						id="email"
						bind:value={email}
						type="email"
						name="email"
						class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none"
						placeholder="you@example.com"
						required
					/>
				</div>

				<!-- Password -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
						<a href="/forgot" class="text-primary hover:text-primary/80 text-sm">Forgot password?</a
						>
					</div>
					<div class="relative">
						<input
							id="password"
							bind:value={password}
							type={showPassword ? 'text' : 'password'}
							name="password"
							class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-gray-900 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none"
							placeholder="Enter your password"
							required
						/>
						<button
							type="button"
							class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							onclick={() => (showPassword = !showPassword)}
						>
							{#if showPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<!-- Error Message -->
				{#if error}
					<div
						class="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600"
						in:fade
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{error}
					</div>
				{/if}

				<!-- Success Message -->
				{#if success}
					<div
						class="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600"
						in:fade
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 shrink-0"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{success}
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isLoading}
					class="btn btn-primary w-full rounded-xl py-3 text-base font-medium"
				>
					{#if isLoading}
						<span class="loading loading-spinner loading-sm"></span>
					{:else}
						Sign In
					{/if}
				</button>
			</form>

			<!-- Divider -->
			<div class="my-6 flex items-center gap-4">
				<div class="h-px flex-1 bg-gray-200"></div>
				<span class="text-sm text-gray-400">or</span>
				<div class="h-px flex-1 bg-gray-200"></div>
			</div>

			<!-- Sign Up Link -->
			<p class="text-center text-gray-600">
				Don't have an account?
				<a href="/signup" class="text-primary hover:text-primary/80 font-medium">Create one</a>
			</p>
		</div>

		<!-- Back to Home -->
		<div class="mt-6 text-center">
			<a href="/" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				Back to Home
			</a>
		</div>
	</div>
</div>
