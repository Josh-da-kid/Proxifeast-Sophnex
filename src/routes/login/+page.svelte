<script>
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';

	let showSuccess = false;

	// Reactively check the query param
	$: {
		if ($page.url.searchParams.get('signup') === 'success') {
			showSuccess = true;

			// Hide after 3 seconds
			setTimeout(() => {
				showSuccess = false;
			}, 3000);
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

	export let form;
</script>

{#if showSuccess}
	<div
		class="alert alert-success fixed mb-4 ml-4"
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
		<span>Account created successfully! You can now log in.</span>
	</div>
{/if}

{#if logoutSuccess}
	<div
		class="alert alert-success fixed mb-4 ml-4"
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
				<form method="POST" action="?/login">
					<fieldset class="fieldset space-y-2">
						<label class="label" for="email">Email</label>
						<input
							id="email"
							type="email"
							name="email"
							class="input input-bordered w-full"
							placeholder="Email"
							required
						/>

						<label class="label" for="password">Password</label>
						<input
							id="password"
							type="password"
							name="password"
							class="input input-bordered w-full"
							placeholder="Password"
							required
						/>

						{#if form?.error}
							<p class="mt-2 text-sm text-red-500">{form.message} Incorrect login credentials</p>
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
