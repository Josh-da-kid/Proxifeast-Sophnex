<div class="hero bg-base-200 min-h-screen">
	<!-- <div class="hero-content flex-col lg:flex-row-reverse"> -->
	<!-- <div class="text-center lg:text-left">
			<h1 class="text-5xl font-bold">Login now!</h1>
			<p class="py-6">
				Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
				quasi. In deleniti eaque aut repudiandae et a id nisi.
			</p>
		</div> -->
	<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
		<h1 class="mt-3 flex items-center justify-center text-3xl">Book Reservation</h1>
		<div class="card-body">
			<fieldset class="fieldset">
				<h2 class="font-bold">Guest Details</h2>
				<label class="label">Full Name</label>
				<input type="text" class="input" placeholder="John Doe" />
				<label class="label">Email</label>
				<input type="email" class="input" placeholder="Email" />
				<label class="label">Phone Number</label>
				<input type="text" class="input" placeholder="Phone number" />

				<h2 class="mt-3 font-bold">Reservation Details</h2>
				<label class="label">Date</label>
				<input type="date" class="input" placeholder="Password" />
				<label class="label">Time</label>
				<input type="text" class="input" placeholder="e.g. 30 minutes, 1 hour, All day" />
				<label class="label">Number of Guests(party size)</label>
				<input type="number" class="input" defaultValue="20" />
				<label class="label">Occasion</label>
				<input type="text" class="input" placeholder="Anniversary Party" />

				<h2 class="mt-3 font-bold">Special Requests or Preferences(Optional)</h2>
				<label class="label">Dietary Restrictions</label>
				<input type="text" class="input" placeholder="e.g. vegetarian, gluten free" />
				<label class="label">Sitting Preference</label>
				<input
					type="text"
					class="input"
					placeholder="e.g. private room, window seat, private room"
				/>
				<label class="label">Accessibility Needs</label>
				<input type="text" class="input" placeholder="e.g. wheelchair access" />

				<h2 class="mt-3 font-bold">Payment Preference</h2>
				<h3>Which method would you like to pay for your reservation?</h3>
				<div class="flex space-x-3">
					<div class="flex gap-2">
						<input type="radio" name="payment" id="credit" />
						<label for="credit" class="label">Credit Card</label>
					</div>

					<div class="flex gap-2">
						<input type="radio" placeholder="" name="payment" id="transfer" />
						<label for="transfer" class="label">Transfer</label>
					</div>
				</div>
				<p>
					<span class="mr-1 font-bold">N/B:</span><span class="font-semibold"
						>Protect against no-shows</span
					> (your card might be charged if you don’t cancel within a set time)
				</p>

				<h2 class="mt-3 font-bold">Payment Information</h2>
				<label class="label">Credit or debit card number</label>
				<input type="text" class="input" placeholder="e.g. John Doe" />
				<label class="label">Name on the card</label>
				<input type="text" class="input" placeholder="e.g. wheelchair access" />
				<label class="label">Expiration date</label>
				<input type="text" class="input" placeholder="e.g. wheelchair access" />
				<label class="label">CVV (3-digit security code)</label>
				<input type="text" class="input" placeholder="e.g. wheelchair access" />

				<h2 class="mt-3 font-bold">Confirmation preference</h2>
				<label class="label mx-auto break-words whitespace-normal"
					>Preferred method to receive confirmation: SMS, phone call, email</label
				>
				<!-- <input type="select" class="input" placeholder="e.g. SMS" /> -->
				<select
					name="confirmationMethod"
					id=""
					class="w-fit rounded-lg border border-gray-400/50 p-2 outline-none focus:ring-1 focus:ring-blue-500"
				>
					<!-- <option value=""></option> -->
					<option value="sms">SMS</option>
					<option value="phone">Phone call</option>
					<option value="email">Email</option>
				</select>

				<div><a class="link link-hover">Forgot password?</a></div>
				<button class="btn btn-neutral mt-4">Book Now</button>
			</fieldset>
		</div>
		<!-- </div> -->
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Playfair+Display&family=Roboto&display=swap');

	:global(html, body) {
		font-family: 'Roboto', sans-serif;
	}

	:global(h1, h2, h3) {
		font-family: 'Playfair Display', serif;
	}
</style>
