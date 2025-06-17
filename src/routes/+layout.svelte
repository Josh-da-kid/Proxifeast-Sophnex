<script lang="ts">
	import Footer from '$lib/Footer.svelte';
	import Nav from '$lib/Nav.svelte';
	import '../app.css';

	let { children } = $props();

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer-4');
		// @ts-ignore
		if (drawerToggle) {
			drawerToggle.checked = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col">
	<!-- Fixed Navbar (not part of flow) -->
	<div class="fixed top-0 z-20 w-full">
		<Nav />
	</div>

	<!-- Main content (takes up remaining space) -->
	<main class="flex-grow">
		<!-- add padding top to avoid nav overlap -->
		{@render children()}
	</main>

	<!-- Footer always at bottom -->
	<Footer />
</div>

<label for="my-drawer-4">
	<div
		class="indicator bg-secondary fixed top-27 right-1 cursor-pointer rounded-full p-4 text-white shadow-xl transition-transform duration-300 hover:scale-105"
	>
		<span class="indicator-item indicator-start badge rounded-full">12</span>
		<svg
			class="drawer-button cursor-pointer"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			><path
				fill="currentColor"
				d="M7.308 21.116q-.633 0-1.067-.434t-.433-1.066t.433-1.067q.434-.433 1.067-.433t1.066.433t.434 1.067t-.434 1.066t-1.066.434m9.384 0q-.632 0-1.066-.434t-.434-1.066t.434-1.067q.434-.433 1.066-.433t1.067.433q.433.434.433 1.067q0 .632-.433 1.066q-.434.434-1.067.434M5.881 5.5l2.669 5.616h6.635q.173 0 .307-.087q.135-.087.231-.24l2.616-4.75q.115-.212.019-.375q-.097-.164-.327-.164zm-.489-1h13.02q.651 0 .98.532q.33.531.035 1.095l-2.858 5.208q-.217.365-.564.573t-.763.208H8.1l-1.215 2.23q-.154.231-.01.5t.433.27h10.384q.214 0 .357.143t.143.357t-.143.356t-.357.144H7.308q-.875 0-1.306-.738t-.021-1.482l1.504-2.68L3.808 3.5H2.5q-.213 0-.357-.143T2 3t.143-.357T2.5 2.5h1.433q.236 0 .429.121q.192.121.298.338zm3.158 6.616h7z"
			/></svg
		>
	</div>
</label>

<!-- <label for="my-drawer-4" class="drawer-button btn btn-primary">Open drawer</label> -->

<div class="drawer drawer-end z-100">
	<input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content">
		<!-- Page content here -->
	</div>
	<div class="drawer-side">
		<label for="my-drawer-4" aria-label="close sidebar" class="drawer-overlay"></label>
		<!-- <ul class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
			Sidebar content here
			<li><a>Sidebar Item 1</a></li>
			<li><a>Sidebar Item 2</a></li>
		</ul> -->
		<div class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
			<div role="alert" class="alert alert-vertical sm:alert-horizontal">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="stroke-info h-6 w-6 shrink-0"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<span>your cart is currently empty.</span>
				<div>
					<!-- <button class="btn btn-sm">Deny</button> -->
					<a onclick={closeSideBar} href="/#menu"
						><button class="btn btn-sm btn-primary">Order</button></a
					>
				</div>
			</div>
		</div>
	</div>
</div>
