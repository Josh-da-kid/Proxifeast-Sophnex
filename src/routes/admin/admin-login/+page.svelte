<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';

	let redirectTo = $state('');

	$effect(() => {
		redirectTo = $page.url.searchParams.get('redirectTo') || '/admin/admin-menu';
	});

	let logoutSuccess = $state(false);

	$effect(() => {
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

	async function adminLogin(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		isLoading = true;

		const loginData = {
			email,
			password
		};

		try {
			const res = await fetch(`/api/admin-login?redirectTo=${encodeURIComponent(redirectTo)}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(loginData)
			});

			const result = await res.json();

			if (result.error === true || !res.ok) {
				error = result.message || 'Login failed.';
			} else {
				success = result.message || 'Account Login successfully!';
				if (result.redirectTo && result.success) {
					window.location.href = result.redirectTo;
				}
			}
		} catch (err) {
			console.error('Fetch failed:', err);
			error = 'Failed to connect to server.';
		}
		isLoading = false;
	}

	let showError = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);

		if (params.get('not_admin') === '1') {
			showError = true;

			setTimeout(() => {
				showError = false;

				params.delete('not_admin');
				const newUrl = `${window.location.pathname}?${params.toString()}`;
				window.history.replaceState({}, '', newUrl);
			}, 6000);
		}
	});
</script>

<svelte:head>
	<title>Admin Login - Proxifeast</title>
</svelte:head>

{#if showError}
	<div
		class="alert alert-error fixed top-4 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 shadow-lg"
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
				d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>You must be an admin to access the admin panel.</span>
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
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-8"
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
			<h1 class="font-playfair text-3xl font-bold text-slate-900">Admin Login</h1>
			<p class="mt-2 text-slate-600">Sign in to access the admin panel</p>
		</div>

		<!-- Login Card -->
		<div class="rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50">
			<form onsubmit={adminLogin} class="space-y-5">
				<!-- Email -->
				<div class="space-y-2">
					<label for="email" class="block text-sm font-medium text-slate-700">Email Address</label>
					<input
						id="email"
						bind:value={email}
						type="email"
						name="email"
						class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none"
						placeholder="admin@example.com"
						required
					/>
				</div>

				<!-- Password -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label for="password" class="block text-sm font-medium text-slate-700">Password</label>
						<a href="/forgot" class="text-primary hover:text-primary/80 text-sm">Forgot password?</a
						>
					</div>
					<div class="relative">
						<input
							id="password"
							bind:value={password}
							type={showPassword ? 'text' : 'password'}
							name="password"
							class="focus:border-primary focus:ring-primary/20 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-slate-900 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none"
							placeholder="Enter your password"
							required
						/>
						<button
							type="button"
							class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
						class="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600"
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

			<!-- Back to Home -->
			<div class="mt-6 text-center">
				<a
					href="/"
					class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
				>
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
</div>
