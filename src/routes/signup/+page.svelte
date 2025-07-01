<script>
	import { page } from '$app/stores';

	export let form;

	// Get URL query
	$: showSuccess = $page.url.searchParams.get('signup') === 'success';
</script>

{#if showSuccess}
	<div class="alert alert-success mb-4">
		<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none"
			viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
				d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<span>Account created successfully! You can now log in.</span>
	</div>
{/if}

<div class="hero bg-base-200 min-h-screen">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="text-center md:w-[500px] lg:text-left">
			<h1 class="text-5xl font-bold">Sign-up now!</h1>
			<p class="py-6">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda, sint iusto dolorem
				ratione tempore nemo necessitatibus accusantium hic placeat asperiores ut ipsam numquam
				dolore possimus maiores, suscipit amet nam itaque!
			</p>
		</div>
		<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
			<div class="card-body">
				<form method="POST" action="?/register">
					<fieldset class="fieldset space-y-2">
						<label class="label" for="fullname">Full Name</label>
						<input
							type="text"
							name="name"
							class="input input-bordered w-full"
							placeholder="John Doe"
							required
						/>

						<label class="label" for="email">Email</label>
						<input
							type="email"
							name="email"
							class="input input-bordered w-full"
							placeholder="johndoe@gmail.com"
							required
						/>

						<label class="label" for="password">Password</label>
						<input
							type="password"
							name="password"
							class="input input-bordered w-full"
							placeholder="Password"
							required
						/>

						<label class="label" for="passwordConfirm">Confirm Password</label>
						<input
							type="password"
							name="passwordConfirm"
							class="input input-bordered w-full"
							placeholder="Confirm"
							required
						/>

						<!-- {#if error}
							<p class="mt-2 text-sm text-red-500">{error}</p>
						{/if}
						{#if success}
							<p class="mt-2 text-sm text-green-500">{success}</p>
						{/if} -->
						{#if form?.error}
							<p class="mt-2 text-sm text-red-500">{form.message}</p>
						{/if}

						<button name="register" type="submit" class="btn btn-neutral mt-4 w-full">Signup</button
						>
						<div class="mt-2">
							<a href="/login" class="link link-hover text-sm">Already have an account? Login</a>
						</div>
					</fieldset>
				</form>
			</div>
		</div>
	</div>
</div>
