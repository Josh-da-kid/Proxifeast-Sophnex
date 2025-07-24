<script lang="ts">
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';

	let showSuccess = false;

	// Reactively check the query param
	$: {
		if ($page.url.searchParams.get('signup') === 'success') {
			showSuccess = true;

			// Hide after 6 seconds
			setTimeout(() => {
				showSuccess = false;
			}, 6000);

			// Remove ?signup=success from the URL without reloading
			const url = new URL(window.location.href);
			url.searchParams.delete('signup');
			history.replaceState(null, '', url.pathname + url.search);
		}
	}

	let logoutSuccess = false;

	// Reactively check the query param
	$: {
		if ($page.url.searchParams.get('logout') === 'success') {
			logoutSuccess = true;

			// Hide after 3 seconds
			setTimeout(() => {
				logoutSuccess = false;
			}, 3000);
		}
	}

	// export let form;
	let email = '';
	let password = '';
	let error = '';
	let success = '';
	let isLoading = false;

	async function login(e: any) {
		e.preventDefault();
		error = '';
		success = '';
		isLoading = true;

		const loginData = {
			email,
			password
		};

		try {
			const res = await fetch('/api/login', {
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
				// Optionally redirect or reset form
				window.location.href = '/';
			}
		} catch (err) {
			console.error('Fetch failed:', err);
			error = 'Failed to connect to server.';
		}
		isLoading = false;
	}
</script>

{#if showSuccess}
	<div
		class="alert alert-success fixed z-5 mb-4 ml-4 w-[300px] md:w-[400px]"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span
			>Account created successfully! A verification Email has been sent to your mail, verify your
			emial before logging in to your account.</span
		>
	</div>
{/if}

{#if logoutSuccess}
	<div
		class="alert alert-success fixed z-5 mb-4 ml-4"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-6 w-6 shrink-0 stroke-current"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<span>Logout successful! You can now log in to another account.</span>
	</div>
{/if}

<div class="hero bg-base-200 min-h-screen">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="text-center md:w-[500px] lg:text-left">
			<h1 class="text-5xl font-bold">Login now!</h1>
			<p class="py-6">Welcome back! Log in to access your Zhanga Restaurant dashboard.</p>
		</div>
		<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
			<div class="card-body">
				<form onsubmit={login}>
					<fieldset class="fieldset space-y-2">
						<label class="label" for="email">Email</label>
						<input
							id="email"
							bind:value={email}
							type="email"
							name="email"
							class="input input-bordered w-full"
							placeholder="Email"
							required
						/>

						<label class="label" for="password">Password</label>
						<input
							id="password"
							bind:value={password}
							type="password"
							name="password"
							class="input input-bordered w-full"
							placeholder="Password"
							required
						/>

						{#if isLoading}
							<div>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
									><path
										fill="none"
										stroke="currentColor"
										stroke-dasharray="16"
										stroke-dashoffset="16"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 3c4.97 0 9 4.03 9 9"
										><animate
											fill="freeze"
											attributeName="stroke-dashoffset"
											dur="0.2s"
											values="16;0"
										/><animateTransform
											attributeName="transform"
											dur="1.5s"
											repeatCount="indefinite"
											type="rotate"
											values="0 12 12;360 12 12"
										/></path
									></svg
								>
							</div>
						{/if}
						<!-- {#if form?.error}
							<p class="mt-2 text-sm text-red-500">{form.message}</p>
						{/if} -->
						{#if error.length > 0}
							<p class="mt-2 text-sm text-red-500">{error}</p>
						{/if}
						{#if success.length > 0}
							<p class="mt-2 text-sm text-green-700">{success}</p>
						{/if}

						<button name="login" type="submit" class="btn btn-neutral mt-4 w-full">Login</button>
						<div class="mt-2 flex justify-between text-sm">
							<a href="/signup" class="link link-hover">New here? Sign up</a>
							<a href="/forgot" class="link link-hover">Forgot password?</a>
						</div>
					</fieldset>
				</form>
			</div>
		</div>
	</div>
</div>
