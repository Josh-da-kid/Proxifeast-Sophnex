<script lang="ts">
	import { page } from '$app/stores';
	import { fly, fade } from 'svelte/transition';

	let showSuccess = $state(false);
	let logoutSuccess = $state(false);

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
				error = result.message || 'Login failed.';
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
					<input
						id="password"
						bind:value={password}
						type="password"
						name="password"
						class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none"
						placeholder="Enter your password"
						required
					/>
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
