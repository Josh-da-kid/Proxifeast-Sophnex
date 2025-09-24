<script lang="ts">
	import { writable, derived, get } from 'svelte/store';
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import pb from '$lib/pb';
	import { clearCartFrontend } from '$lib/stores/cart';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';

	const restaurantId = derived(page, ($page) => $page.data.restaurant?.id);
	const paystackKey = derived(page, ($page) => $page.data.restaurant?.paystackKey);
	export const cart = writable<any[]>([]);
	export const total = derived(cart, ($cart) =>
		$cart.reduce((acc, item) => acc + (item.amount || 0), 0)
	);
	export const user = derived(page, ($page) => $page.data.user);
	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	let deleteModal: HTMLDialogElement;
	let clearModal: HTMLDialogElement;
	let dishToDelete: any = $state(null);
	let loading = $state(true);

	// ✅ Fetch cart
	export async function fetchCart(restaurantId?: string) {
		const userId = get(user)?.id;
		if (!userId) {
			loading = false;
			return;
		}

		try {
			let filter = `user="${userId}"`;
			if (restaurantId) {
				filter += ` && restaurantId="${restaurantId}"`;
			}

			const records = await pb.collection('cart').getFullList({
				filter,
				expand: 'dish'
			});
			cart.set(records);
		} catch (err) {
			console.error('Failed to fetch cart:', err);
		} finally {
			loading = false;
		}
	}

	// ✅ Remove item
	export async function removeFromCart(id: string) {
		try {
			await pb.collection('cart').delete(id);
			await fetchCart(get(restaurantId));
		} catch (err) {
			console.error('Failed to remove item:', err);
		}
	}

	// ✅ Clear entire cart
	export async function clearCart(restaurantId?: string) {
		const userId = get(user)?.id;
		if (!userId || !restaurantId) return;

		try {
			const items = await pb.collection('cart').getFullList({
				filter: `user="${userId}" && restaurantId="${restaurantId}"`
			});
			await Promise.all(items.map((item) => pb.collection('cart').delete(item.id)));
			await fetchCart(restaurantId);
			clearModal?.close();
		} catch (err) {
			console.error('Failed to clear cart:', err);
		}
	}

	// ✅ Lifecycle: fetch cart on mount
	onMount(() => {
		// if (deliveryOption === 'home') calculateFee('7.4898,9.0635');
		const rid = get(restaurantId);
		if (rid) fetchCart(rid);
		document.body.classList.add('overflow-hidden');
	});

	onDestroy(() => {
		document.body.classList.remove('overflow-hidden');
	});

	// ✅ Quantity update
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
			await pb.collection('cart').update(itemId, {
				quantity: newQty,
				amount: unitPrice * newQty
			});

			await fetchCart(get(restaurantId));
		} catch (err) {
			console.error('Failed to update quantity:', err);
		}
	}

	// let deliveryFee = $state(0);

	// let deliveryTotal: any = $state('');

	// async function calculateFee(userCoords: string) {
	// 	const restaurantCoords = '7.4986,9.0579'; // fixed coords
	// 	const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjcyOGMxN2U1N2RlNDQ2ZGZiZDMwYzExODY2MTg0NjcwIiwiaCI6Im11cm11cjY0In0=&start=${restaurantCoords}&end=${userCoords}`;

	// 	try {
	// 		const res = await fetch(url);
	// 		if (!res.ok) throw new Error('ORS request failed');
	// 		const data = await res.json();

	// 		const distanceMeters = data.features[0].properties.summary.distance;
	// 		const distanceKm = distanceMeters / 1000;

	// 		const feePerKm = 100; // Naira per KM
	// 		// const deliveryFee = Math.ceil(distanceKm * feePerKm);
	// 		deliveryFee = Math.ceil(distanceKm * feePerKm);

	// 		console.log(`Distance: ${distanceKm.toFixed(2)} km`);
	// 		console.log(`Delivery Fee Set: ₦${deliveryFee}`);

	// 		console.log(`Distance: ${distanceKm} km`);
	// 		console.log(`Delivery Fee: ₦${deliveryFee}`);
	// 		deliveryTotal = $total + deliveryFee;
	// 		console.log('Total:', get(total));

	// 		console.log('Delivery Total:', deliveryTotal);
	// 		// Update UI with delivery fee here
	// 	} catch (err) {
	// 		console.error('Could not fetch distance', err);
	// 	}
	// }

	let distance = 0;
	let matchedAddress = '';
	// let loadingDelivery = $state(false);
	let addressAlert = $state('');

	// async function getDeliveryFee(address: string) {
	// 	loadingDelivery = true;
	// 	console.log('📦 Sending address to backend:', address);

	// 	try {
	// 		const res = await fetch('/api/delivery-fee', {
	// 			method: 'POST',
	// 			headers: { 'Content-Type': 'application/json' },
	// 			body: JSON.stringify({ address })
	// 		});

	// 		const data = await res.json();

	// 		if (!res.ok || data.error) {
	// 			addressAlert =
	// 				data.error?.message ||
	// 				'Unable to calculate delivery fee. Probably an invalid address was received.';
	// 			console.error('❌ Delivery fee error:', data.error || res.statusText);
	// 			deliveryFee = 0;
	// 			deliveryTotal = 0;
	// 			return;
	// 		}

	// 		// ✅ Update local/state values
	// 		deliveryFee = data.fee;
	// 		distance = data.distance;
	// 		matchedAddress = data.addressMatched;

	// 		// Add to current cart total
	// 		deliveryTotal = get(total) + deliveryFee;

	// 		// 🔍 Logs
	// 		console.log(`📍 Address matched: ${matchedAddress}`);
	// 		console.log(`🛣️ Distance: ${distance} km`);
	// 		console.log(`💸 Delivery Fee: ₦${deliveryFee}`);
	// 		console.log(`🧾 Total with Delivery: ₦${deliveryTotal}`);
	// 		loadingDelivery = false;

	// 		// 👉 Here you can:
	// 		// - Show in the UI
	// 		// - Save to checkout state
	// 		// - Trigger animation or update
	// 	} catch (err) {
	// 		console.error('🚨 Failed to get delivery fee:', err);
	// 		loadingDelivery = false;
	// 		addressAlert = 'Something went wrong while calculating delivery fee.';
	// 		setTimeout(() => {
	// 			addressAlert = '';
	// 		}, 5000);
	// 	} finally {
	// 		loadingDelivery = false; // ✅ always stop loading
	// 		if (addressAlert) {
	// 			setTimeout(() => {
	// 				addressAlert = '';
	// 			}, 5000);
	// 		}
	// 	}
	// }

	let debounceTimeout: any;

	// $effect(() => {
	// 	if (deliveryOption === 'home' && homeAddress.length > 5) {
	// 		clearTimeout(debounceTimeout);
	// 		debounceTimeout = setTimeout(() => {
	// 			getDeliveryFee(homeAddress);
	// 		}, 1000); // wait 1 second
	// 	}
	// });

	// ====================
	// Order + Paystack
	// ====================
	let deliveryOption = $state('');
	let paymentOption = $state('');
	let fullName = '';
	let phone = $state('');
	let prefix = $state('+234');
	let tableNumber = $state('');
	let orderTotal = $state('');
	let homeAddress = $state('');
	let hour = $state('12');
	let minutes = $state('00');
	let meridian = $state('PM');

	let pickupTime = $derived(`${hour}:${String(minutes).padStart(2, '0')} ${meridian}`);
	const formattedPhone = $derived(`${prefix}${phone}`);
	const PaystackPop = (window as any).PaystackPop;
	let email = get(user)?.email;
	let amount = get(total);

	function isValidPhone(prefix: string, phone: string): boolean {
		prefix = prefix.trim();
		phone = phone.trim().replace(/\s+/g, '');
		if (!/^\d+$/.test(phone)) return false;

		if (prefix === '+234') {
			return /^[789][01]\d{8}$/.test(phone);
		}

		return phone.length >= 7 && phone.length <= 15;
	}

	function payWithPaystack(e: Event) {
		e.preventDefault();

		if (!isValidPhone(prefix, phone)) {
			alert('Please enter a valid Nigerian phone number.');
			return;
		}

		// amount = deliveryOption === 'home' ? get(total) + 2000 : get(total);
		amount = get(total);

		let handler = PaystackPop.setup({
			key: $paystackKey,
			email: email,
			amount: amount * 100,
			currency: 'NGN',
			ref: 'ORD-' + Math.floor(Math.random() * 1000000000 + 1),
			callback: function (response: any) {
				alert('Payment complete! Reference: ' + response.reference);

				const cartQuantity = $cart.length;
				const orderedDishes = $cart.map((item) => ({
					dish: item.expand?.dish?.id,
					name: item.expand?.dish?.name,
					quantity: item.quantity,
					amount: item.amount
				}));

				const orderData = {
					reference: response.reference,
					totalAmount: get(total),
					type: deliveryOption,
					user: get(user).id,
					dishes: orderedDishes,
					name: get(user).name,
					email: get(user).email,
					quantity: $cart.length,
					formattedPhone,
					tableNumber,
					homeAddress,
					// orderTotal,
					pickupTime
				};

				if (deliveryOption === 'tableService') {
					orderData.tableNumber = tableNumber;
				} else if (deliveryOption === 'home') {
					orderData.homeAddress = homeAddress;
					// orderData.orderTotal = get(total) + 2000;
					// orderData.orderTotal = get(total) + deliveryFee;
				} else if (deliveryOption === 'restaurantPickup') {
					orderData.pickupTime = pickupTime;
				}

				fetch('/api/save-order', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(orderData)
				})
					.then((res) => res.json())
					.then((data) => {
						alert('Order saved successfully!');
						goto('/pending');
						clearCart($cart[0]?.restaurantId);
					})
					.catch((err) => {
						console.error(err);
						alert('Error saving order.');
					});
			},
			onClose: function () {
				alert('Transaction was cancelled');
			}
		});

		handler.openIframe();
	}

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer-5');
		if (drawerToggle instanceof HTMLInputElement) drawerToggle.checked = false;
	}

	function openSideBar() {
		const drawerToggle = document.getElementById('my-drawer-5');
		if (drawerToggle instanceof HTMLInputElement) drawerToggle.checked = true;
	}
</script>

{#if addressAlert}
	<div
		role="alert"
		class="alert alert-error index-0 fixed top-1/2 z-99999 mb-4 ml-2 w-[300px] sm:w-[400px]"
		in:fly={{ y: -20, duration: 300 }}
		out:fly={{ y: -20, duration: 300 }}
	>
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
				d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
			/>
		</svg>
		{addressAlert}
	</div>
{/if}

<main>
	{#if $isLoggedIn}
		{#if loading}
			<div class="text-secondary mt-15 flex items-center justify-center text-center">
				<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24"
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
		{:else}
			<section
				class="max-h-screen w-full justify-between gap-8 overflow-y-auto p-6 px-8 md:mt-8 md:flex"
			>
				{#if $cart.length > 0}
					<div class="scroll-hidden max-h-[80vh] overflow-y-auto pr-2 md:w-[800px]">
						<ul class="space-y-4">
							{#each $cart as item (item.id)}
								<li class="items-center justify-between border-b border-gray-200 pb-4 md:flex">
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

											<div class="gap-3 text-start md:flex">
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

									<div class="mt-2 mr-4 flex items-center justify-center gap-4 sm:mt-0 sm:mr-0">
										<!-- svelte-ignore a11y_consider_explicit_label -->
										<button
											onclick={() => {
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
											onclick={() => {
												updateQuantity({
													itemId: item.id,
													dishId: item.dish,
													userId: $user.id,
													newQty: item.quantity + 1,
													promoAmount: item.expand.dish.promoAmount,
													defaultAmount: item.expand.dish.amount
												});
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
											onclick={() => {
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
					<div
						class="scroll-hidden mt-8 hidden max-h-[70vh] overflow-y-auto md:mt-0 md:mr-12 md:flex md:max-h-[80vh] md:justify-end md:px-12 md:pr-6"
					>
						<div class="space-y-3 text-right">
							<h2 class="mt-4 mb-4 text-start text-2xl font-bold">Order Summary</h2>

							<div class="flex w-full justify-between">
								<p class="text-xl font-bold">Total:</p>
								<p class="text-xl font-bold">₦{$total.toLocaleString()}</p>
							</div>

							<form onsubmit={payWithPaystack} class="space-y-4">
								<p class="hidden">{$user.email}</p>
								<div class="space-y-2 space-x-4 text-start">
									<p class="font-bold">Delivery Type:</p>

									<label for="tableService" class="flex gap-2">
										<div
											class="wide-tooltip tooltip tooltip-right relative z-50"
											data-tip="this is a delivery to the table you're seated on in the restaurant"
										>
											<svg
												class="text-secondary"
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												><path
													fill="currentColor"
													d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8"
												/></svg
											>
										</div>
										<span>Table Service</span>
										<input
											bind:group={deliveryOption}
											value="tableService"
											type="radio"
											id="tableService"
											name="delivery"
											required
										/>
									</label>

									<label for="restaurantPickup" class="flex gap-2">
										<div
											class="wide-tooltip tooltip tooltip-right relative z-50"
											data-tip="you get to pickup your order in the restaurant counter"
										>
											<svg
												class="text-secondary"
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												><path
													fill="currentColor"
													d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8"
												/></svg
											>
										</div>
										<span>Pickup</span>
										<input
											bind:group={deliveryOption}
											value="restaurantPickup"
											type="radio"
											id="restaurantPickup"
											name="delivery"
										/>
									</label>

									<label for="home" class="flex gap-2">
										<div
											class="tooltip tooltip-right relative z-50"
											data-tip="delivery directly to your doorstep"
										>
											<svg
												class="text-secondary"
												xmlns="http://www.w3.org/2000/svg"
												width="24"
												height="24"
												viewBox="0 0 24 24"
												><path
													fill="currentColor"
													d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8"
												/></svg
											>
										</div>
										<span>Home delivery</span>
										<input
											bind:group={deliveryOption}
											value="home"
											type="radio"
											id="home"
											name="delivery"
										/>
									</label>
								</div>

								<div class="space-y-4 text-start">
									{#if deliveryOption == 'tableService'}
										<label for="table" class="flex flex-col">
											<span>Table Number:</span>
											<input
												type="number"
												min="1"
												id="table"
												bind:value={tableNumber}
												class=" border-secondary focus:ring-secondary mt-1 w-[150px] rounded-lg border p-2 focus:ring-2 focus:outline-none"
												required
											/>

											<small
												><span class="text-secondary mr-1 font-bold">N/B : </span>Input the table
												number you're seated on.</small
											>
										</label>
									{:else if deliveryOption == 'restaurantPickup'}
										<label for="table" class="flex w-[250px] flex-col">
											<span>Pickup Time:</span>
											<p class="mt-2 text-gray-600">Pickup Time: {pickupTime}</p>

											<div class="flex gap-2">
												<input
													type="number"
													id="hour"
													bind:value={hour}
													min="1"
													max="12"
													placeholder="HH"
													class="border-secondary focus:ring-secondary mt-1 w-[60px] rounded-lg border p-2 focus:ring-2 focus:outline-none"
													required
												/>

												<span class="flex items-center justify-center text-2xl font-extrabold"
													>:</span
												>

												<input
													type="number"
													id="minutes"
													bind:value={minutes}
													min="0"
													max="59"
													placeholder="MM"
													class="border-secondary focus:ring-secondary mt-1 w-[60px] rounded-lg border p-2 focus:ring-2 focus:outline-none"
													required
												/>

												<select
													id="meridian"
													class="border-secondary h-12 w-[60px] rounded-lg border p-1"
													required
													bind:value={meridian}
												>
													<option value="AM">AM</option>
													<option value="PM">PM</option>
												</select>
											</div>
											<small
												><span class="text-secondary mr-1 font-bold">N/B : </span>Input the time you
												will be most likely to pickup your order.</small
											>
										</label>
									{:else if deliveryOption == 'home'}
										<label for="address" class="flex w-[250px] flex-col md:w-[300px]">
											<span>Home Address:</span>
											<textarea
												id="address"
												bind:value={homeAddress}
												class="border-secondary focus:ring-secondary mt-1 h-[100px] rounded-lg border p-2 focus:ring-2 focus:outline-none"
												required
											></textarea>
											<small
												><span class="text-secondary mr-1 font-bold">N/B : </span>Input the place
												you want your order to be delivered to.</small
											>
										</label>
									{/if}
								</div>

								<div class="space-x-4 text-start">
									<p class="font-bold">Contact Info:</p>
									<label for="phone" class="flex w-[250px] flex-col">
										<span>Full Name:</span>
										<input
											type="text"
											placeholder="John Doe"
											id="name"
											bind:value={$user.name}
											readonly
											name="delivery"
											class="border-secondary focus:ring-secondary mt-1 rounded-lg border p-2 focus:ring-2 focus:outline-none"
											required
										/>
										<small
											><span class="text-secondary mr-1 font-bold">N/B : </span>This value cannot be
											changed here.</small
										>
									</label>
								</div>

								<div class="space-x-4 text-start">
									<label for="phone" class="flex w-[250px] flex-col">
										<span>Phone Number:</span>

										<div class="flex gap-2">
											<input
												bind:value={prefix}
												type="text"
												class="focus:ring-secondary border-secondary h-[55px] w-[70px] rounded-lg border p-1 focus:ring-2 focus:outline-none"
												minlength="4"
												maxlength="4"
												placeholder="+234"
											/>
											<input
												type="text"
												placeholder="70123456789"
												id="phone"
												bind:value={phone}
												name="delivery"
												minlength="10"
												maxlength="10"
												class="border-secondary focus:ring-secondary mt-1 w-[200px] rounded-lg border p-3 focus:ring-2 focus:outline-none"
												required
											/>
										</div>

										<small class="mt-1"
											><span class="font-bold">Note:</span> you'll be contacted via this phone number
											when your order is ready</small
										>
										{#if phone && !isValidPhone(prefix, phone)}
											<p class="mt-1 text-sm text-red-500">Invalid phone number format</p>
										{/if}
									</label>
								</div>

								<label class="flex justify-center gap-2 text-start md:w-[350px]">
									<input type="checkbox" id="policy" class="h-8 w-8" required />
									<span>I confirm my order and agree to the terms and refund policy</span>
								</label>

								<div class="flex items-center justify-center gap-3">
									<button
										type="submit"
										class="btn btn-secondary btn-sm mb-8 rounded-full p-6 text-lg transition-transform duration-300 hover:scale-105 md:w-[350px]"
									>
										Submit Order & Pay
									</button>
								</div>
							</form>
						</div>
					</div>
				{:else}
					<div class="mx-auto flex flex-col items-center justify-center text-center">
						<p class=" text-gray-500 italic">Your cart is empty.</p>
						<a href="/#menu" class="mt-1"
							><button class="btn btn-primary transition-transform duration-300 hover:scale-105"
								>Order</button
							></a
						>
					</div>
				{/if}
			</section>
		{/if}
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
					onclick={async () => {
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
				<button
					class="btn btn-error text-white"
					onclick={() => {
						clearCart($restaurantId);
					}}>Yes, Clear All</button
				>
			</div>
		</div>
	</dialog>
</main>

<!-- mobile -->
{#if $isLoggedIn && $cart.length > 0}
	<div class="fixed right-2 bottom-8 md:hidden">
		<button
			onclick={openSideBar}
			class="bg-primary btn animate-bounce rounded-lg p-2 font-bold text-white transition-transform duration-300 hover:scale-105"
		>
			Checkout
		</button>
	</div>
{/if}

<div class="drawer drawer-end z-[9999]">
	<input id="my-drawer-5" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content"></div>
	<div class="drawer-side">
		<label for="my-drawer-5" aria-label="close sidebar" class="drawer-overlay"></label>

		<div class="menu bg-base-200 text-base-content min-h-full w-80 space-y-4 p-4 pl-6 md:min-w-1/3">
			<div>
				<button
					onclick={closeSideBar}
					class="hover:text-secondary cursor-pointer items-start justify-start hover:underline"
					><span class="text-secondary">&lt&lt</span> Back</button
				>
			</div>

			<div class=" ">
				<div class="space-y-3 text-right">
					<h2 class="mt-4 mb-4 text-start text-2xl font-bold">Order Summary</h2>

					<div class="flex w-full justify-between">
						<p class="text-xl font-bold">Total:</p>
						<p class="text-xl font-bold">₦{$total.toLocaleString()}</p>
					</div>

					<form onsubmit={payWithPaystack} class="space-y-4">
						<div class="space-y-2 space-x-4 text-start">
							<p class="font-bold">Delivery Type:</p>

							<label for="tableService" class="flex gap-2">
								<div
									class="wide-tooltip tooltip tooltip-right relative z-50"
									data-tip="this is a delivery to the table you're seated on in the restaurant"
								>
									<svg
										class="text-secondary"
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										><path
											fill="currentColor"
											d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8"
										/></svg
									>
								</div>
								<span>Table Service</span>
								<input
									bind:group={deliveryOption}
									value="tableService"
									type="radio"
									id="tableService"
									name="delivery"
									required
								/>
							</label>

							<label for="restaurantPickup" class="flex gap-2">
								<div
									class="wide-tooltip tooltip tooltip-right relative z-50"
									data-tip="you get to pickup your order in the restaurant counter"
								>
									<svg
										class="text-secondary"
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										><path
											fill="currentColor"
											d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8"
										/></svg
									>
								</div>
								<span>Pickup</span>
								<input
									bind:group={deliveryOption}
									value="restaurantPickup"
									type="radio"
									id="restaurantPickup"
									name="delivery"
								/>
							</label>

							<label for="home" class="flex gap-2">
								<div
									class="tooltip tooltip-right relative z-50"
									data-tip="delivery directly to your doorstep"
								>
									<svg
										class="text-secondary"
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										><path
											fill="currentColor"
											d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8"
										/></svg
									>
								</div>
								<span>Home delivery</span>
								<input
									bind:group={deliveryOption}
									value="home"
									type="radio"
									id="home"
									name="delivery"
								/>
							</label>
						</div>

						<div class="space-y-4 text-start">
							{#if deliveryOption == 'tableService'}
								<label for="table" class="flex flex-col">
									<span>Table Number:</span>
									<input
										type="number"
										min="1"
										id="table"
										bind:value={tableNumber}
										class=" border-secondary focus:ring-secondary mt-1 w-[150px] rounded-lg border p-2 focus:ring-2 focus:outline-none"
										required
									/>

									<small
										><span class="text-secondary mr-1 font-bold">N/B : </span>Input the table number
										you're seated on.</small
									>
								</label>
							{:else if deliveryOption == 'restaurantPickup'}
								<label for="table" class="flex w-[250px] flex-col">
									<span>Pickup Time:</span>
									<p class="mt-2 text-gray-600">Pickup Time: {pickupTime}</p>

									<div class="flex gap-2">
										<input
											type="number"
											id="hour"
											bind:value={hour}
											min="1"
											max="12"
											placeholder="HH"
											class="border-secondary focus:ring-secondary mt-1 w-[60px] rounded-lg border p-2 focus:ring-2 focus:outline-none"
											required
										/>

										<span class="flex items-center justify-center text-2xl font-extrabold">:</span>

										<input
											type="number"
											id="minutes"
											bind:value={minutes}
											min="0"
											max="59"
											placeholder="MM"
											class="border-secondary focus:ring-secondary mt-1 w-[60px] rounded-lg border p-2 focus:ring-2 focus:outline-none"
											required
										/>

										<select
											id="meridian"
											class="border-secondary h-12 w-[60px] rounded-lg border p-1"
											required
											bind:value={meridian}
										>
											<option value="AM">AM</option>
											<option value="PM">PM</option>
										</select>
									</div>
									<small
										><span class="text-secondary mr-1 font-bold">N/B : </span>Input the time you
										will be most likely to pickup your order.</small
									>
								</label>
							{:else if deliveryOption == 'home'}
								<label for="address" class="flex w-[250px] flex-col md:w-[300px]">
									<span>Home Address:</span>
									<textarea
										id="address"
										bind:value={homeAddress}
										class="border-secondary focus:ring-secondary mt-1 h-[100px] rounded-lg border p-2 focus:ring-2 focus:outline-none"
										required
									></textarea>
									<small
										><span class="text-secondary mr-1 font-bold">N/B : </span>Input the place you
										want your order to be delivered to.</small
									>
								</label>
							{/if}
						</div>

						<div class="space-x-4 text-start">
							<label for="phone" class="flex w-[200px] flex-col">
								<span>Phone Number:</span>

								<div class="mt-1 flex gap-2">
									<input
										bind:value={prefix}
										type="text"
										class="focus:ring-secondary border-secondary h-[55px] w-[70px] rounded-lg border p-1 focus:ring-2 focus:outline-none"
										minlength="4"
										maxlength="4"
										placeholder="+234"
									/>
									<input
										type="text"
										placeholder="70123456789"
										id="phone"
										bind:value={phone}
										name="delivery"
										minlength="10"
										maxlength="10"
										class="border-secondary focus:ring-secondary mt-1 w-[200px] rounded-lg border p-3 focus:ring-2 focus:outline-none"
										required
									/>
								</div>
								<small class="mt-1"
									><span class="font-bold">Note:</span> you'll be contacted with this phone number when
									your order is ready</small
								>
								{#if phone && !isValidPhone(prefix, phone)}
									<p class="mt-1 text-sm text-red-500">Invalid phone number format</p>
								{/if}
							</label>
						</div>

						<label class="flex justify-center gap-2 text-start md:w-[350px]">
							<input type="checkbox" id="policy" class="h-8 w-8" required />
							<span>I confirm my order and agree to the terms and refund policy</span>
						</label>

						<div class="flex items-center justify-center gap-3">
							<button
								type="submit"
								class="btn btn-secondary btn-sm mb-8 rounded-full p-6 text-lg transition-transform duration-300 hover:scale-105 md:w-[350px]"
							>
								Submit Order & Pay
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
