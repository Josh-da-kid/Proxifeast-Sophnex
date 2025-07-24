<script lang="ts">
	import { page } from '$app/stores';

	export let form;
	let password: any = '';
	let passwordConfirm: any = '';
	let email: any = '';
	let name: any = '';
	let error: any = '';
	let success = '';
	let isLoading = false;

	// Get URL query
	$: showSuccess = $page.url.searchParams.get('signup') === 'success';

	async function register(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		isLoading = true;

		// Password confirmation check
		if (password !== passwordConfirm) {
			error = 'Passwords do not match.';
			isLoading = false;
			return;
		}

		// 2. Email validation
		// const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		// if (!emailIsValid) {
		// 	error = 'Please enter a valid email address.';
		// 	isLoading = false;
		// 	return;
		// }

		// Password strength checks
		const passwordRequirements = [
			{ check: password.length >= 8, message: 'Password must be at least 8 characters long.' },
			{
				check: /[A-Z]/.test(password),
				message: 'Password must contain at least one uppercase letter.'
			},
			{
				check: /[a-z]/.test(password),
				message: 'Password must contain at least one lowercase letter.'
			},
			{ check: /[0-9]/.test(password), message: 'Password must contain at least one number.' },
			{
				check: /[!@#$%^&*]/.test(password),
				message: 'Password must contain at least one special character (!@#$%^&*).'
			}
		];

		for (const rule of passwordRequirements) {
			if (!rule.check) {
				error = rule.message;
				isLoading = false;
				return;
			}
		}

		// Form is valid, send to server
		const registerData = {
			name,
			email,
			password,
			passwordConfirm
		};

		try {
			const res = await fetch('/api/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(registerData)
			});

			const result = await res.json();

			// if (!res.ok) {
			// 	error = result.error || 'Registration failed.';
			if (result.error === true || !res.ok) {
				error = result.message || 'Registration failed.';
			} else {
				success = result.message || 'Account created successfully!';
				// Optionally redirect or reset form
				window.location.href = '/login?signup=success';
			}
		} catch (err) {
			console.error('Fetch failed:', err);
			error = 'Failed to connect to server.';
		}

		isLoading = false;
	}
</script>

{#if showSuccess}
	<div class="alert alert-success mb-4">
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
				<!-- <form method="POST" action="?/register"> -->
				<form onsubmit={register}>
					<fieldset class="fieldset space-y-2">
						<label class="label" for="fullname">Full Name</label>
						<input
							type="text"
							bind:value={name}
							name="name"
							class="input input-bordered w-full"
							placeholder="John Doe"
							required
						/>

						<label class="label" for="email">Email</label>
						<input
							type="email"
							bind:value={email}
							name="email"
							class="input input-bordered w-full"
							placeholder="johndoe@gmail.com"
							required
						/>

						<label class="label" for="password">Password</label>
						<input
							type="password"
							bind:value={password}
							name="password"
							class="input input-bordered w-full"
							placeholder="Password"
							required
						/>

						<label class="label" for="passwordConfirm">Confirm Password</label>
						<input
							type="password"
							bind:value={passwordConfirm}
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
						<!-- <small>Your password must </small> -->
						<div class="flex flex-col">
							<span class="text-secondary">Password Requirement :</span>
							<span>Password must be at least 8 characters long.</span>
							<span>Password must contain at least one uppercase letter.</span>
							<span>Password must contain at least one lowercase letter.</span>
							<span>Password must contain at least one number.</span>
							<span>Password must contain at least one special character (!@#$%^&*).</span>
						</div>

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
