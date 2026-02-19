<script lang="ts">
	import { page } from '$app/stores';
	import { fly, fade } from 'svelte/transition';

	let showSuccess = $derived($page.url.searchParams.get('signup') === 'success');

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let error = $state('');
	let success = $state('');
	let isLoading = $state(false);

	let passwordRequirements = $state([
		{ check: false, text: 'At least 8 characters' },
		{ check: false, text: 'One uppercase letter' },
		{ check: false, text: 'One lowercase letter' },
		{ check: false, text: 'One number' },
		{ check: false, text: 'One special character (!@#$%^&*)' }
	]);

	$effect(() => {
		passwordRequirements = [
			{ check: password.length >= 8, text: 'At least 8 characters' },
			{ check: /[A-Z]/.test(password), text: 'One uppercase letter' },
			{ check: /[a-z]/.test(password), text: 'One lowercase letter' },
			{ check: /[0-9]/.test(password), text: 'One number' },
			{ check: /[!@#$%^&*]/.test(password), text: 'One special character' }
		];
	});

	let allRequirementsMet = $derived(passwordRequirements.every((r) => r.check));

	async function register(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		isLoading = true;

		if (password !== passwordConfirm) {
			error = 'Passwords do not match.';
			isLoading = false;
			return;
		}

		if (!allRequirementsMet) {
			error = 'Please meet all password requirements.';
			isLoading = false;
			return;
		}

		try {
			const res = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, password, passwordConfirm })
			});

			const result = await res.json();

			if (result.error === true || !res.ok) {
				error = result.message || 'Registration failed.';
			} else {
				success = 'Account created! Redirecting...';
				setTimeout(() => {
					window.location.href = '/login?signup=success';
				}, 1500);
			}
		} catch (err) {
			console.error('Fetch failed:', err);
			error = 'Failed to connect to server.';
		}

		isLoading = false;
	}

	async function oauthSignup(provider: string) {
		try {
			const res = await fetch(`/api/oauth-url?provider=${provider}`);
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			}
		} catch (err) {
			console.error('OAuth error:', err);
		}
	}
</script>

<svelte:head>
	<title>Sign Up - Proxifeast</title>
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
			<h1 class="font-playfair text-3xl font-bold text-gray-900">Create Account</h1>
			<p class="mt-2 text-gray-600">Join Proxifeast to start ordering</p>
		</div>

		<!-- Signup Card -->
		<div class="rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50">
			<form onsubmit={register} class="space-y-4">
				<!-- Full Name -->
				<div class="space-y-2">
					<label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
					<input
						id="name"
						bind:value={name}
						type="text"
						name="name"
						class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none"
						placeholder="John Doe"
						required
					/>
				</div>

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
					<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
					<div class="relative">
						<input
							id="password"
							bind:value={password}
							type={showPassword ? 'text' : 'password'}
							name="password"
							class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-gray-900 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none"
							placeholder="Create a password"
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

				<!-- Confirm Password -->
				<div class="space-y-2">
					<label for="passwordConfirm" class="block text-sm font-medium text-gray-700"
						>Confirm Password</label
					>
					<div class="relative">
						<input
							id="passwordConfirm"
							bind:value={passwordConfirm}
							type={showConfirmPassword ? 'text' : 'password'}
							name="passwordConfirm"
							class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-gray-900 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none"
							placeholder="Confirm your password"
							required
						/>
						<button
							type="button"
							class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							onclick={() => (showConfirmPassword = !showConfirmPassword)}
						>
							{#if showConfirmPassword}
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

				<!-- Password Requirements -->
				<div class="rounded-xl bg-gray-50 p-3">
					<p class="mb-2 text-xs font-medium text-gray-500">Password must have:</p>
					<div class="grid grid-cols-2 gap-1 text-xs">
						{#each passwordRequirements as req}
							<div
								class="flex items-center gap-1"
								class:text-green-600={req.check}
								class:text-gray-400={!req.check}
							>
								{#if req.check}
									<svg
										class="h-3 w-3"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								{:else}
									<svg
										class="h-3 w-3"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<circle cx="12" cy="12" r="10" />
									</svg>
								{/if}
								{req.text}
							</div>
						{/each}
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
					disabled={isLoading || !allRequirementsMet}
					class="btn btn-primary w-full rounded-xl py-3 text-base font-medium disabled:opacity-50"
				>
					{#if isLoading}
						<span class="loading loading-spinner loading-sm"></span>
					{:else}
						Create Account
					{/if}
				</button>
			</form>

			<!-- Divider -->
			<div class="my-6 flex items-center gap-4">
				<div class="h-px flex-1 bg-gray-200"></div>
				<span class="text-sm text-gray-400">or</span>
				<div class="h-px flex-1 bg-gray-200"></div>
			</div>

			<!-- Social Signup -->
			<div class="space-y-3">
				<button
					type="button"
					class="btn flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 font-medium text-gray-700 hover:bg-gray-50"
					onclick={() => oauthSignup('google')}
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24">
						<path
							fill="#4285F4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="#34A853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="#FBBC05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="#EA4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					Sign up with Google
				</button>

				<button
					type="button"
					class="btn flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 font-medium text-gray-700 hover:bg-gray-50"
					onclick={() => oauthSignup('facebook')}
				>
					<svg class="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
						<path
							d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
						/>
					</svg>
					Sign up with Facebook
				</button>
			</div>

			<!-- Login Link -->
			<p class="text-center text-gray-600">
				Already have an account?
				<a href="/login" class="text-primary hover:text-primary/80 font-medium">Sign in</a>
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
