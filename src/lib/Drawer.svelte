<script lang="ts">
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';
	import { isAdminPage } from './menuItems.svelte';
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

	let isAdmin = false;

	// Keep it reactive using subscription
	const unsubscribe = isAdminPage.subscribe((val) => {
		isAdmin = val;
	});

	// $: isLoggedIn = $page.data.user !== null;
	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	console.log($page.data.user);
</script>

{#if $isAdminPage && $isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>

			<div
				class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4 pl-6 md:min-w-1/3"
			>
				<div>
					<button
						onclick={closeSideBar}
						class="hover:text-secondary items-start justify-start hover:underline"
						><span class="text-secondary">&lt&lt</span> Back</button
					>
				</div>
				<h2 class="mb-2 text-xl font-bold">Create New Dish</h2>

				<form action="/admin?/createDish" method="POST">
					<div class="flex flex-col">
						<label for="name" class="">Name of Dish</label>
						<input
							type="text"
							id="name"
							name="name"
							placeholder="Name of Dish"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="description" class="">Dish Description</label>
						<textarea
							id="description"
							name="description"
							placeholder="e.g. creamy and tasty"
							class="textarea focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						></textarea>
					</div>

					<select
						class="select border-secondary focus:ring-secondary mt-2 border focus:ring-2 focus:outline-none"
						name="category"
						required
					>
						<option value="" disabled selected>Select Dish Category</option>
						<option value="Main Dish">Main Dish</option>
						<option value="Seafood">Seafood</option>
						<option value="Drinks & Sides">Drinks & Sides</option>
					</select>

					<div class="mt-2 flex flex-col">
						<label for="image" class="">Image of Dish</label>
						<input
							type="text"
							id="image"
							name="image"
							placeholder="e.g. https://friedricensauce.img"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="quantity" class="">Quantity of Dish</label>
						<input
							type="number"
							id="quantity"
							name="quantity"
							defaultValue="1"
							min="1"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="defaultAmount" class="">Dish Amount</label>
						<input
							type="text"
							name="defaultAmount"
							id="defaultAmount"
							placeholder="e.g. 5500"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
							required
						/>
					</div>

					<div class="mt-2 flex flex-col">
						<label for="promoAmount" class="">Promo Amount(Optional)</label>
						<input
							type="text"
							id="promoAmount"
							name="promoAmount"
							placeholder="e.g. 2500"
							class="input focus:ring-secondary border-secondary focus:ring-2 focus:outline-none"
						/>
					</div>

					<button type="submit" name="createDish" class="btn btn-secondary mt-4">Create Dish</button
					>
				</form>
			</div>
		</div>
	</div>
{:else if $isAdminPage && !$isLoggedIn}
	<div class="drawer drawer-end z-[9999]">
		<input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
		<div class="drawer-content"></div>
		<div class="drawer-side">
			<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>

			<div
				class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4 pl-6 md:min-w-1/3"
			>
				<div>
					<button
						onclick={closeSideBar}
						class="hover:text-secondary items-start justify-start hover:underline"
						><span class="text-secondary">&lt&lt</span> Back</button
					>
				</div>
				<h2 class="mb-2 text-xl font-bold">Create New Dish</h2>

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
					<span>You must be logged as an admin in to create a Dish.</span>
					<div>
						<a onclick={closeSideBar} href="/admin/admin-login">
							<button class="btn btn-sm btn-primary">Login</button>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
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
{/if}
