<!-- <script lang="ts">
	import { cart, clearCart, fetchCart, removeFromCart, total } from '$lib/stores/cart';
	import { onMount } from 'svelte';

	onMount(async () => {
		console.log('Fetching cart...');
		await fetchCart();
		console.log('Cart after fetch:', $cart);
	});
</script> -->

<script lang="ts">
	import { writable, derived, get } from 'svelte/store';
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import pb from '$lib/pb';

	// Cart store
	export const cart = writable<any[]>([]);

	export const total = derived(cart, ($cart) =>
		$cart.reduce((acc, item) => acc + (item.amount || 0), 0)
	);

	export const user = derived(page, ($page) => $page.data.user);

	let deleteModal: HTMLDialogElement;
	let clearModal: HTMLDialogElement;
	let dishToDelete: any = null;

	// Fetch cart data
	export async function fetchCart() {
		const userId = get(user)?.id;
		if (!userId) return;

		try {
			const records = await pb.collection('cart').getFullList({
				filter: `user="${userId}"`,
				expand: 'dish'
			});
			cart.set(records);
		} catch (err) {
			console.error('Failed to fetch cart:', err);
		}
	}

	// Remove item
	export async function removeFromCart(id: string) {
		try {
			await pb.collection('cart').delete(id);
			await fetchCart();
		} catch (err) {
			console.error('Failed to remove item:', err);
		}
	}

	// Clear entire cart
	export async function clearCart() {
		const userId = get(user)?.id;
		if (!userId) return;

		try {
			const items = await pb.collection('cart').getFullList({
				filter: `user="${userId}"`
			});
			await Promise.all(items.map((item) => pb.collection('cart').delete(item.id)));
			await fetchCart();
			clearModal.close(); // Close modal on success
		} catch (err) {
			console.error('Failed to clear cart:', err);
		}
	}

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer-4');
		if (drawerToggle instanceof HTMLInputElement) {
			drawerToggle.checked = false;
		}
	}

	onMount(fetchCart);

	async function updateQuantity({
		itemId,
		dishId,
		userId,
		newQty,
		promoAmount,
		defaultAmount
	}: {
		itemId: string;
		dishId: string;
		userId: string;
		newQty: number;
		promoAmount?: number;
		defaultAmount: number;
	}) {
		const unitPrice = promoAmount ?? defaultAmount;

		if (newQty < 1) {
			await removeFromCart(itemId);
			return;
		}

		try {
			// Update the cart item directly using itemId
			const updatedAmount = unitPrice * newQty;

			await pb.collection('cart').update(itemId, {
				quantity: newQty,
				amount: updatedAmount
			});

			await fetchCart(); // Refresh cart store
		} catch (err) {
			console.error('Failed to update quantity:', err);
		}
	}

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	onMount(() => {
		document.body.classList.add('overflow-hidden');
	});

	onDestroy(() => {
		document.body.classList.remove('overflow-hidden');
	});
</script>

<main>
	{#if $isLoggedIn}
		<!-- <section class="flex h-screen overflow-y-auto w-full justify-between gap-8 p-6 px-8 md:flex"> -->
		<section class="max-h-screen w-full justify-between gap-8 overflow-y-auto p-6 px-8 md:flex">
			{#if $cart.length > 0}
				<div class="max-h-[80vh] w-[700px] overflow-y-auto pr-2">
					<ul class="space-y-4">
						{#each $cart as item (item.id)}
							<li class="flex items-center justify-between border-b border-gray-200 pb-4">
								<div class="flex gap-2 space-y-2 text-center">
									<div class="h-24 w-24">
										<img
											src={item.expand.dish.image}
											alt={item.expand.dish.name}
											class="h-full w-full rounded-xl object-cover"
										/>
									</div>

									<div class="">
										<p class="text-start font-semibold">{item.expand.dish.name}</p>

										<div class="flex gap-3 text-start">
											{#if item.expand.dish.promoAmount && item.expand.dish.promoAmount < item.expand.dish.defaultAmount}
												<span
													class="badge badge-accent mt-1"
													class:bg-gray-100={item.expand.dish.availability !== 'Available'}
													class:border-gray-200={item.expand.dish.availability !== 'Available'}
												>
													-{Math.round(
														(1 - item.expand.dish.promoAmount / item.expand.dish.defaultAmount) *
															100
													)}%
												</span>
												<!-- svelte-ignore node_invalid_placement_ssr -->
												<div class="flex gap-2">
													<p class="text-secondary font-bold">
														₦{Number(item.expand.dish.promoAmount).toLocaleString()}
													</p>
													<p class="text-gray-400 line-through">
														₦{Number(item.expand.dish.defaultAmount).toLocaleString()}
													</p>
												</div>
											{:else}
												<!-- svelte-ignore node_invalid_placement_ssr -->
												<p class="text-secondary font-bold">
													₦{Number(item.expand.dish.defaultAmount).toLocaleString()}
												</p>
											{/if}
										</div>
									</div>
								</div>

								<div class="flex items-center justify-center gap-4">
									<!-- svelte-ignore a11y_consider_explicit_label -->
									<button
										on:click={() => {
											if (item.quantity <= 1) {
												dishToDelete = item;
												deleteModal.showModal();
											} else {
												updateQuantity({
													itemId: item.id,
													dishId: item.dish,
													userId: $user.id,
													newQty: item.quantity - 1,
													promoAmount: item.expand.dish.promoAmount,
													defaultAmount: item.expand.dish.amount
												});
											}
										}}
										class="hover:text-secondary cursor-pointer rounded-full bg-blue-500 text-white"
										><svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 12 12"
											><path
												fill="currentColor"
												d="M2 6a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 2 6"
											/></svg
										></button
									>
									<span class="text-secondary">{item.quantity}</span>
									<!-- svelte-ignore a11y_consider_explicit_label -->
									<button
										on:click={() => {
											if (item.quantity <= 1) {
												dishToDelete = item;
												deleteModal.showModal();
											} else {
												updateQuantity({
													itemId: item.id,
													dishId: item.dish,
													userId: $user.id,
													newQty: item.quantity + 1,
													promoAmount: item.expand.dish.promoAmount,
													defaultAmount: item.expand.dish.amount
												});
											}
										}}
										class="hover:text-secondary cursor-pointer rounded-full bg-blue-500 text-white"
										><svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											><path
												fill="currentColor"
												d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1"
											/></svg
										></button
									>

									<!-- svelte-ignore a11y_consider_explicit_label -->
									<button
										class=" btn-sm cursor-pointer text-red-500 transition-transform duration-300 hover:text-gray-500"
										on:click={() => {
											dishToDelete = item;
											deleteModal.showModal();
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											><path
												fill="currentColor"
												d="M7.616 20q-.672 0-1.144-.472T6 18.385V6H5V5h4v-.77h6V5h4v1h-1v12.385q0 .69-.462 1.153T16.384 20zM17 6H7v12.385q0 .269.173.442t.443.173h8.769q.23 0 .423-.192t.192-.424zM9.808 17h1V8h-1zm3.384 0h1V8h-1zM7 6v13z"
											/></svg
										>
									</button>
								</div>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Temu-style right-aligned totals and buttons -->
				<div class="mt-8 flex justify-end md:mt-0 md:mr-12 md:px-8 md:pr-6">
					<div class="space-y-3 text-right">
						<h2 class="mt-4 mb-4 text-start text-2xl font-bold">Order Summary</h2>
						<div class="flex justify-between">
							<p class="text-xl font-bold">Total:</p>
							<p class="text-xl font-bold">₦{$total.toLocaleString()}</p>
						</div>

						<div class="space-x-4 text-start">
							<p class="font-bold">Mode of transfer:</p>

							<label for="transfer">
								<span>Bank transfer</span>
								<input type="radio" id="transfer" name="payment" />
							</label>

							<label for="card">
								<span>Card Payment</span>
								<input type="radio" id="card" name="payment" />
							</label>
						</div>

						<div class="space-x-4 text-start">
							<p class="font-bold">Delivery Type:</p>

							<label for="restaurant">
								<span>Restaurant Delivery</span>
								<input type="radio" id="restaurant" name="delivery" />
							</label>

							<label for="home">
								<span>Home delivery</span>
								<input type="radio" id="home" name="delivery" />
							</label>
						</div>

						<div class="space-x-4 text-start">
							<p class="font-bold">Contact Info:</p>
							<label for="phone" class="flex w-[250px] flex-col">
								<span>Phone Number:</span>
								<input
									type="text"
									placeholder="+2347068346403"
									id="phone"
									name="delivery"
									class="border-secondary focus:ring-secondary mt-1 rounded-lg border p-2 focus:ring-2 focus:outline-none"
								/>
								<small class="mt-1"
									><span class="font-bold">Note:</span> you'll be contacted with this phone number when
									your order is ready</small
								>
							</label>
						</div>

						<div class="flex items-center justify-center gap-3">
							<!-- <button class="btn btn-outline btn-sm" on:click={() => clearModal.showModal()}>
							Clear Cart
						</button> -->
							<button
								class="btn btn-secondary btn-sm w-[200px] rounded-full p-6 transition-transform duration-300 hover:scale-105 md:w-[350px]"
								on:click={closeSideBar}
							>
								Checkout
							</button>
						</div>
					</div>
				</div>
			{:else}
				<p class="text-center text-gray-500 italic">Your cart is empty.</p>
			{/if}
		</section>
	{:else}
		<p class="mt-8 text-center text-gray-500 italic">You must be logged in inorder to checkout.</p>
		<a href="/login" class="btn btn-primary mx-auto mt-4 flex w-fit items-center justify-center"
			>Signup/login</a
		>
	{/if}

	<!-- Delete Modal -->
	<dialog bind:this={deleteModal} class="modal">
		<div class="modal-box text-center">
			<h3 class="text-lg font-bold">Remove Dish</h3>
			{#if dishToDelete}
				<p>
					Are you sure you want to remove <b>{dishToDelete.expand.dish.name}</b> from your cart?
				</p>
			{/if}
			<div class="modal-action justify-center">
				<form method="dialog">
					<button class="btn">Cancel</button>
				</form>
				<button
					class="btn btn-error text-white"
					on:click={async () => {
						await removeFromCart(dishToDelete.id);
						deleteModal.close();
					}}
				>
					Remove
				</button>
			</div>
		</div>
	</dialog>

	<!-- Clear Cart Modal -->
	<dialog bind:this={clearModal} class="modal">
		<div class="modal-box text-center">
			<h3 class="text-lg font-bold">Clear Cart</h3>
			<p>Are you sure you want to remove all items from your cart?</p>
			<div class="modal-action justify-center">
				<form method="dialog">
					<button class="btn">Cancel</button>
				</form>
				<button class="btn btn-error text-white" on:click={clearCart}>Yes, Clear All</button>
			</div>
		</div>
	</dialog>
</main>
