<div class="hero mt-6 mb-8 min-h-screen">
	<div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
		<h1 class="mt-3 flex items-center justify-center text-3xl">Book Reservation</h1>
		<div class="card-body">
			<fieldset class="fieldset">
				<h2 class="font-bold">Guest Details</h2>
				<label for="name" class="label">Full Name</label>
				<input id="name" type="text" class="input" placeholder="John Doe" />
				<label for="email" class="label">Email</label>
				<input id="email" type="email" class="input" placeholder="Email" />
				<label for="phone" class="label">Phone Number</label>
				<input id="phone" type="text" class="input" placeholder="Phone number" />

				<h2 class="mt-3 font-bold">Reservation Details</h2>
				<label for="date" class="label">Date</label>
				<input id="date" type="date" class="input" placeholder="Password" />
				<label for="time" class="label">Time</label>
				<input id="time" type="text" class="input" placeholder="e.g. 30 minutes, 1 hour, All day" />
				<label for="guest" class="label">Number of Guests(party size)</label>
				<input id="guest" type="number" class="input" defaultValue="20" />
				<label for="occasion" class="label">Occasion</label>
				<input id="occasion" type="text" class="input" placeholder="Anniversary Party" />

				<h2 class="mt-3 font-bold">Special Requests or Preferences(Optional)</h2>
				<label for="restrictions" class="label">Dietary Restrictions</label>
				<input
					id="restrictions"
					type="text"
					class="input"
					placeholder="e.g. vegetarian, gluten free"
				/>
				<label for="sitting" class="label">Sitting Preference</label>
				<input
					type="text"
					id="sitting"
					class="input"
					placeholder="e.g. private room, window seat, private room"
				/>
				<label for="accessibility" class="label">Accessibility Needs</label>
				<input id="accessibility" type="text" class="input" placeholder="e.g. wheelchair access" />

				<h2 class="mt-3 font-bold">Payment Preference</h2>
				<h3>Which method would you like to pay for your reservation?</h3>
				<div class="flex space-x-3">
					<div class="flex gap-2">
						<input type="radio" name="payment" id="credit" />
						<label for="credit" class="label">Credit Card</label>
					</div>

					<div class="flex gap-2">
						<input type="radio" placeholder="" name="payment" id="transfer" />
						<label for="transfer" class="label">Bank Transfer</label>
					</div>
				</div>
				<p>
					<span class="mr-1 font-bold">N/B:</span><span class="font-semibold"
						>Protect against no-shows</span
					> (your card might be charged if you don’t cancel within a set time)
				</p>

				<h2 class="mt-3 font-bold">Payment Information</h2>
				<label for="cc" class="label">Credit or debit card number</label>
				<input id="cc" type="text" class="input" placeholder="e.g. John Doe" />
				<label for="cardName" class="label">Name on the card</label>
				<input id="cardName" type="text" class="input" placeholder="e.g. wheelchair access" />
				<label for="exp" class="label">Expiration date</label>
				<input id="exp" type="text" class="input" placeholder="e.g. wheelchair access" />
				<label for="cvv" class="label">CVV (3-digit security code)</label>
				<input id="cvv" type="text" class="input" placeholder="e.g. wheelchair access" />

				<h2 class="mt-3 font-bold">Confirmation preference</h2>
				<label for="preference" class="label mx-auto break-words whitespace-normal"
					>Preferred method to receive confirmation: SMS, phone call, email</label
				>
				<!-- <input type="select" class="input" placeholder="e.g. SMS" /> -->
				<select
					name="preference"
					class="w-fit rounded-lg border border-gray-400/50 p-2 outline-none focus:ring-1 focus:ring-blue-500"
				>
					<!-- <option value=""></option> -->
					<option value="sms">SMS</option>
					<option value="phone">Phone call</option>
					<option value="email">Email</option>
				</select>

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
