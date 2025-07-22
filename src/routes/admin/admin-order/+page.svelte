<script lang="ts">
	// This `data` comes from the server load function
	export let data;
	const orders = data.orders;
</script>

<h1 class="mb-4 text-center text-2xl font-bold">All Orders</h1>

{#each orders as order (order.id)}
	<div class="bg-base-100 mb-6 rounded border p-4 shadow">
		<h2 class="mb-2 text-lg font-semibold">Order ID: {order.id}</h2>
		<p><strong>Status:</strong> {order.status}</p>
		<p><strong>Total:</strong> ₦{order.totalAmount}</p>

		<h3 class="mt-4 mb-2 font-semibold">Items:</h3>
		<ul class="ml-5 list-disc">
			{#each order.items as item (item.id)}
				<li>
					{item.expand.dish.name} — {item.quantity} × ₦{item.price} = ₦{item.quantity * item.price}
				</li>
			{/each}
		</ul>
	</div>
{/each}
