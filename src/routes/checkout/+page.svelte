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
	import { onMount } from 'svelte';
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

	export let item; // from {#each $cart as item}

	async function updateQuantity(newQty) {
		await pb.collection('cart').update(item.id, {
			quantity: newQty
		});
		// Optionally: refresh cart data here
	}
</script>

<section class="mb-8 flex w-full justify-between gap-8 p-6 px-8 shadow-sm">
	{#if $cart.length > 0}
		<div class="w-[700px]">
			<ul class="space-y-4">
				{#each $cart as item (item.id)}
					<li class="flex items-center justify-between border-b border-gray-200 pb-4">
						<div class="flex flex-col items-center space-y-2 text-center">
							<div class="hidden h-24 w-24">
								<img
									src={item.expand.dish.image}
									alt={item.expand.dish.name}
									class="h-full w-full rounded-xl object-cover"
								/>
							</div>
							<p class="font-semibold">{item.expand.dish.name}</p>
							<!-- <p class="text-sm">
								Qty: {item.quantity} × ₦
								{item.expand.dish.promoAmount ?? item.expand.dish.defaultAmount} = ₦{item.amount.toLocaleString()}
							</p> -->
						</div>

						<div class="flex items-center justify-center gap-4">
							<!-- <option value="" disabled selected>Qty</option> -->
							<!-- <select name="quantity" class="rounded-lg hover:border-black cursor-pointer border border-gray-500 p-2 px-4">
								{#each Array(100)
									.fill(0)
									.map((_, i) => i + 1) as qty}
									<option value={qty}>{qty}</option>
								{/each}
							</select> -->
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button
								on:click={() => updateQuantity(item.quantity - 1)}
								disabled={item.quantity <= 1}
								class="hover:text-secondary cursor-pointer"
								><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 12 12"
									><path
										fill="currentColor"
										d="M2 6a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 2 6"
									/></svg
								></button
							>
							<span class="text-secondary">{item.quantity}</span>
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button
								on:click={() => updateQuantity(item.quantity + 1)}
								class="hover:text-secondary cursor-pointer"
								><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
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
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
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
		<div class="mt-6 mr-15 flex justify-end border px-8 pr-6">
			<div class="space-y-3 text-right">
				<h2 class="mt-4 mb-4 text-start text-lg font-bold">Order Summary</h2>
				<div class="flex justify-between">
					<p class="text-xl font-bold">Total:</p>
					<p class="text-xl font-bold">₦{$total.toLocaleString()}</p>
				</div>

				<div class="flex items-center justify-center gap-3">
					<!-- <button class="btn btn-outline btn-sm" on:click={() => clearModal.showModal()}>
						Clear Cart
					</button> -->
					<button
						class="btn btn-secondary btn-sm w-[300px] rounded-full p-6 transition-transform duration-300 hover:scale-105"
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

<!-- Delete Modal -->
<dialog bind:this={deleteModal} class="modal">
	<div class="modal-box text-center">
		<h3 class="text-lg font-bold">Remove Dish</h3>
		{#if dishToDelete}
			<p>Are you sure you want to remove <b>{dishToDelete.expand.dish.name}</b> from your cart?</p>
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
