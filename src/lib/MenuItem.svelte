<script lang="ts">
	import { page } from '$app/stores';

	let { dish, showRestaurant = false, quantity = 1, onAddToCart, showQuantity = true } = $props();

	const user = $derived($page.data.user);
	const isLoggedIn = $derived(user !== null);

	let localQuantity = $state(quantity);
	let isAdding = $state(false);

	function increment() {
		localQuantity++;
	}

	function decrement() {
		if (localQuantity > 1) {
			localQuantity--;
		}
	}

	async function handleAddToCart() {
		if (!isLoggedIn) {
			window.location.href = '/login';
			return;
		}
		if (dish.availability !== 'Available') return;

		isAdding = true;
		try {
			if (onAddToCart) {
				await onAddToCart(dish, localQuantity);
			}
			localQuantity = 1;
		} finally {
			isAdding = false;
		}
	}

	const isAvailable = $derived(dish.availability === 'Available');
	const hasDiscount = $derived(dish.promoAmount && dish.promoAmount < dish.defaultAmount);
	const discountPercent = $derived(
		hasDiscount ? Math.round((1 - dish.promoAmount / dish.defaultAmount) * 100) : 0
	);
</script>

<div class="menu-item-card group">
	<!-- Image -->
	<div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
		{#if dish.image}
			<img
				src={dish.image}
				alt={dish.name}
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
				loading="lazy"
			/>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-slate-400">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1"
				>
					<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
					<path d="M7 2v20" />
					<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
				</svg>
			</div>
		{/if}

		<!-- Discount Badge -->
		{#if hasDiscount}
			<div class="absolute top-3 left-3">
				<span class="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
					-{discountPercent}% OFF
				</span>
			</div>
		{/if}

		<!-- Availability Badge -->
		{#if !isAvailable}
			<div class="absolute inset-0 flex items-center justify-center bg-slate-900/60">
				<span class="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
					Sold Out
				</span>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="p-4">
		<!-- Restaurant Tag -->
		{#if showRestaurant && dish.restaurantName}
			<p class="mb-2 text-xs font-medium text-amber-600">{dish.restaurantName}</p>
		{/if}

		<!-- Name -->
		<h3
			class="font-heading mb-1 line-clamp-1 text-lg font-semibold text-slate-900 transition-colors group-hover:text-amber-600"
		>
			{dish.name}
		</h3>

		<!-- Description -->
		{#if dish.description}
			<p class="mb-3 line-clamp-2 text-sm text-slate-500">
				{dish.description}
			</p>
		{/if}

		<!-- Price -->
		<div class="mb-4 flex items-baseline gap-2">
			{#if hasDiscount}
				<span class="text-xl font-bold text-amber-600">
					₦{Number(dish.promoAmount).toLocaleString()}
				</span>
				<span class="text-sm text-slate-400 line-through">
					₦{Number(dish.defaultAmount).toLocaleString()}
				</span>
			{:else}
				<span class="text-xl font-bold text-slate-900">
					₦{Number(dish.defaultAmount).toLocaleString()}
				</span>
			{/if}
		</div>

		<!-- Add to Cart -->
		{#if showQuantity}
			<div class="flex items-center gap-3">
				<!-- Quantity Selector -->
				{#if isAvailable}
					<div class="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50">
						<button
							onclick={decrement}
							disabled={localQuantity <= 1}
							class="flex h-8 w-8 items-center justify-center rounded-l-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-50"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M5 12h14" />
							</svg>
						</button>
						<span class="w-8 text-center text-sm font-semibold text-slate-900">
							{localQuantity}
						</span>
						<button
							onclick={increment}
							class="flex h-8 w-8 items-center justify-center rounded-r-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 5v14M5 12h14" />
							</svg>
						</button>
					</div>
				{/if}

				<!-- Add Button -->
				<button
					onclick={handleAddToCart}
					disabled={!isAvailable || isAdding}
					class="btn-primary-custom flex-1 !py-2 !text-sm {!isAvailable
						? 'cursor-not-allowed opacity-50'
						: ''}"
				>
					{#if isAdding}
						<span class="loading loading-spinner loading-sm"></span>
					{:else if !isAvailable}
						Sold Out
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="mr-1"
						>
							<path d="M12 5v14M5 12h14" />
						</svg>
						Add
					{/if}
				</button>
			</div>
		{:else}
			<button
				onclick={handleAddToCart}
				disabled={!isAvailable || isAdding}
				class="btn-primary-custom w-full !py-2 {!isAvailable
					? 'cursor-not-allowed opacity-50'
					: ''}"
			>
				{#if isAdding}
					<span class="loading loading-spinner loading-sm"></span>
				{:else if !isAvailable}
					Sold Out
				{:else}
					Add to Cart
				{/if}
			</button>
		{/if}
	</div>
</div>

<style>
	.font-heading {
		font-family: 'Plus Jakarta Sans', sans-serif;
	}

	.menu-item-card {
		overflow: hidden;
		border-radius: 1rem;
		border: 1px solid #f1f5f9;
		background-color: white;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		transition: all 0.3s;
	}

	.menu-item-card:hover {
		border-color: #e2e8f0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.btn-primary-custom {
		border-radius: 0.75rem;
		background-color: #f59e0b;
		padding: 0.5rem 1rem;
		font-weight: 600;
		color: white;
		transition: all 0.3s ease-out;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-primary-custom:hover {
		background-color: #d97706;
		box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.25);
	}

	.btn-primary-custom:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.btn-primary-custom:disabled:hover {
		box-shadow: none;
	}
</style>
