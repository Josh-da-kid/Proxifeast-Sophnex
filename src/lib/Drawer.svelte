<script lang="ts">
	import { cart, clearCart, removeFromCart, total } from './stores/cart';

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer-4');
		if (drawerToggle instanceof HTMLInputElement) {
			drawerToggle.checked = false;
		}
	}

	function getNumericPrice(price: string): number {
		return parseInt(price.replace(/[₦,]/g, ''), 10);
	}
</script>

<div class="drawer drawer-end z-[9999]">
	<input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content"></div>
	<div class="drawer-side">
		<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>

		<div class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4">
			<div>
				<button
					onclick={closeSideBar}
					class="hover:text-secondary items-start justify-start hover:underline"
					><span class="text-secondary">&lt&lt</span> Back</button
				>
			</div>
			<h2 class="mb-2 text-xl font-bold">Your Cart</h2>

			{#if $cart.length > 0}
				<ul class="space-y-4">
					{#each $cart as item (item.name)}
						<li class="flex items-center justify-between border-b pb-2 text-lg">
							<div class="mx-auto flex items-center justify-evenly">
								<div></div>
								<p class="font-semibold">{item.name}</p>
								<p class="text-sm">Qty: {item.quantity} × {item.price}</p>
							</div>

							<button
								onclick={removeFromCart(item.name)}
								class="btn btn-xs btn-error mt-2 bg-red-500 p-4 text-lg text-white"
							>
								Remove
							</button>
						</li>
					{/each}
				</ul>

				<div class="mt-4">
					<p class="text-lg font-semibold">Total: ₦{$total.toLocaleString()}</p>
					<div class="mt-2 flex gap-2">
						<button onclick={clearCart} class="btn btn-sm btn-secondary">Clear</button>
						<button onclick={closeSideBar} class="btn btn-sm btn-primary">Checkout</button>
					</div>
				</div>
			{:else}
				<div role="alert" class="alert alert-info mt-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span>Your cart is currently empty.</span>
					<div>
						<a onclick={closeSideBar} href="/#menu">
							<button class="btn btn-sm btn-primary">Order</button>
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
