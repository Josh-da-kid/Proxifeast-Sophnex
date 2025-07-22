<script>
	import { page } from '$app/stores';

	export let form;

	// Get URL query
	// $: showSuccess = $page.url.searchParams.get('signup') === 'success';

	let showSuccess = false;

	// Reactively check the query param
	$: {
		if ($page.url.searchParams.get('reset') === 'success') {
			showSuccess = true;

			// Hide after 3 seconds
			setTimeout(() => {
				showSuccess = false;
			}, 6000);
		}
	}
</script>

{#if showSuccess}
	<div class="alert alert-success mb-4 ml-4 w-[300px] md:w-[400px]">
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
			>Account reset Email sent to your Inbox successfully! Use the link provided to reset your
			password.</span
		>
	</div>
{/if}

<div class="hero bg-base-200 min-h-screen">
	<div class="hero-content flex-col lg:flex-row-reverse">
		<div class="text-center md:w-[500px] lg:text-left">
			<h1 class="text-5xl font-bold">Reset Your Password!</h1>
			<p class="py-6">
				Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda, sint iusto dolorem
				ratione tempore nemo necessitatibus accusantium hic placeat asperiores ut ipsam numquam
				dolore possimus maiores, suscipit amet nam itaque!
			</p>
		</div>
		<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
			<div class="card-body">
				<form method="POST" action="?/reset">
					<fieldset class="fieldset space-y-2">
						<!-- <label class="label" for="fullname">Full Name</label>
						<input
							type="text"
							name="name"
							class="input input-bordered w-full"
							placeholder="John Doe"
							required
						/> -->

						<label class="label" for="email">Email</label>
						<input
							type="email"
							name="email"
							class="input input-bordered w-full"
							placeholder="johndoe@gmail.com"
							required
						/>

						<!-- <label class="label" for="password">Password</label>
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
						/> -->

						{#if form?.error}
							<p class="mt-2 text-sm text-red-500">{form?.error}</p>
						{/if}
						{#if form?.success}
							<p class="mt-2 text-sm text-green-500">{form?.success}</p>
						{/if}
						{#if form?.error}
							<p class="mt-2 text-sm text-red-500">{form?.message}</p>
						{/if}

						<button name="reset" type="submit" class="btn btn-neutral mt-4 w-full"
							>Reset Password</button
						>
						<div class="mt-2">
							<a href="/login" class="link link-hover text-sm">Remembered your password? Login</a>
						</div>
					</fieldset>
				</form>
			</div>
		</div>
	</div>
</div>
