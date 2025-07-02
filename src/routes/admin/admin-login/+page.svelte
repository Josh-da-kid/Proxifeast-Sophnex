<script>
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';

	export let form;
	const error = form?.error;

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
</script>

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
			<p class="py-6">
				Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
				quasi. In deleniti eaque aut repudiandae et a id nisi.
			</p>
		</div>
		<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
			<div class="card-body">
				<form method="POST" action="?/loginAdmin">
					<fieldset class="fieldset">
						<label for="email" class="label">Email</label>
						<input name="email" type="email" class="input" placeholder="Email" required />
						<label for="password" class="label">Password</label>
						<input type="password" name="password" class="input" placeholder="Password" required />
						<!-- <div><a href="/signup" class="link link-hover">New here? signup</a></div> -->
						<button name="loginAdmin" type="submit" class="btn btn-neutral mt-4">Login</button>
						<div><a href="/" class="link link-hover">Forgot password?</a></div>

						{#if form?.error}
							<p class="mt-2 text-red-500">{form.message}</p>
						{/if}
					</fieldset>
				</form>
			</div>
		</div>
	</div>
</div>
