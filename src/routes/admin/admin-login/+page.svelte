<script>
	export let form;
	const error = form?.error;
</script>

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
				<form method="POST">
					<fieldset class="fieldset">
						<label class="label">Email</label>
						<input name="email" type="email" class="input" placeholder="Email" required />
						<label class="label">Password</label>
						<input type="password" name="password" class="input" placeholder="Password" required />
						<!-- <div><a href="/signup" class="link link-hover">New here? signup</a></div> -->
						<button type="submit" class="btn btn-neutral mt-4">Login</button>
						<div><a class="link link-hover">Forgot password?</a></div>

						{#if error}
							<p class="mt-2 text-red-500">{error}</p>
						{/if}
					</fieldset>
				</form>
			</div>
		</div>
	</div>
</div>
