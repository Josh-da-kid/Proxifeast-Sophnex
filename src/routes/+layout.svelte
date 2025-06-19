<script lang="ts">
	import Drawer from '$lib/Drawer.svelte';
	import Footer from '$lib/Footer.svelte';
	import Nav from '$lib/Nav.svelte';
	import { cart } from '$lib/stores/cart';
	import '../app.css';

	let { children } = $props();

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer-4');
		if (drawerToggle instanceof HTMLInputElement) {
			drawerToggle.checked = false;
		}
	}

	function getNumericPrice(price: string): number {
		return parseInt(price.replace(/[₦,]/g, ''), 10);
	}

	let total = $cart.reduce((sum, item) => sum + getNumericPrice(item.price) * item.quantity, 0);
</script>

<div class="flex min-h-screen flex-col">
	<!-- Fixed Navbar (not part of flow) -->
	<div class="fixed top-0 z-20 w-full">
		<Nav />
	</div>

	<main class="flex-grow pt-20">{@render children()}</main>
	<Footer />
</div>

<!-- Cart FAB Icon -->
<label for="my-drawer-4">
	<div
		class="tooltip indicator bg-secondary fixed top-28 right-4 z-10 cursor-pointer rounded-full p-4 text-white shadow-xl transition-transform duration-300 hover:scale-105"
		data-tip="view cart"
	>
		<span class="indicator-item indicator-start badge badge-sm bg-white font-bold text-black">
			<!-- {$cart.reduce((sum, item) => sum + item.quantity, 0)} -->
			{$cart.length}
		</span>
		<svg
			class="drawer-button"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
		>
			<path
				fill="currentColor"
				d="M7.308 21.116q-.633 0-1.067-.434t-.433-1.066t.433-1.067q.434-.433 1.067-.433t1.066.433t.434 1.067t-.434 1.066t-1.066.434m9.384 0q-.632 0-1.066-.434t-.434-1.066t.434-1.067q.434-.433 1.066-.433t1.067.433q.433.434.433 1.067q0 .632-.433 1.066q-.434.434-1.067.434M5.881 5.5l2.669 5.616h6.635q.173 0 .307-.087q.135-.087.231-.24l2.616-4.75q.115-.212.019-.375q-.097-.164-.327-.164zm-.489-1h13.02q.651 0 .98.532q.33.531.035 1.095l-2.858 5.208q-.217.365-.564.573t-.763.208H8.1l-1.215 2.23q-.154.231-.01.5t.433.27h10.384q.214 0 .357.143t.143.357t-.143.356t-.357.144H7.308q-.875 0-1.306-.738t-.021-1.482l1.504-2.68L3.808 3.5H2.5q-.213 0-.357-.143T2 3t.143-.357T2.5 2.5h1.433q.236 0 .429.121q.192.121.298.338zm3.158 6.616h7z"
			/>
		</svg>
	</div>
</label>

<!-- Drawer Cart -->
<Drawer />
