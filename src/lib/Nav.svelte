<script lang="ts">
	import { derived } from 'svelte/store';
	import { menuItems, toggleMenu, getHref, isAdminPage } from './menuItems.svelte';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store'; // You might not need get() if you use derived directly

	let isAdmin = false;

	// Keep it reactive using subscription
	const unsubscribe = isAdminPage.subscribe((val) => {
		isAdmin = val;
	});

	onDestroy(unsubscribe);

	let isMenuOpen = $state(false);

	let previousScrollY = 0;
	let showHeader = $state(true);

	// Scroll-based header toggle
	function handleScroll() {
		const currentScrollY = window.scrollY;
		showHeader = currentScrollY < previousScrollY;
		previousScrollY = currentScrollY;
	}

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer');
		// @ts-ignore
		if (drawerToggle) {
			drawerToggle.checked = false;
		}
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	// Directly use the derived user store for reactivity
	const user = derived(page, ($page) => $page.data.user);
</script>

<nav
	class="navbar bg-primary text-primary-content sticky top-0 z-50 flex items-center justify-center rounded-b-3xl px-5 shadow-lg transition-transform duration-300 ease-in-out"
	class:translate-y-[-100%]={!showHeader}
	class:translate-y-0={showHeader}
>
	<div class="flex-1 px-1">
		<a href="/" class="font-playfair text-2xl font-bold normal-case md:text-3xl">
			Chef Zhanga Foods
		</a>
	</div>

	<div class="flex justify-center lg:hidden">
		<label for="my-drawer" class="btn btn-primary drawer-button flex items-center justify-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-10 w-10"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
				/>
			</svg>
		</label>
	</div>

	{#if $isAdminPage}
		<nav class="hidden md:flex">
			<a href="/admin" class="btn btn-ghost">Dashboard</a>
			<a href="/admin/admin-menu" class="btn btn-ghost">Menu</a>
			<a href="/admin/admin-order" class="btn btn-ghost">Orders</a>
			<a href="/admin/admin-reservation" class="btn btn-ghost">Reservations</a>

			<div>
				{#if $user}
					<!-- <form action="/logout" method="POST"> -->
					<button
						onclick={my_modal_2.showModal()}
						class="btn btn-ghost ml-2 hidden bg-white text-lg text-blue-700 md:flex"
					>
						Logout
					</button>
					<!-- </form> -->

					<dialog id="my_modal_2" class="modal">
						<div class="modal-box text-black">
							<h3 class="text-lg font-bold">
								Hey <span class="text-secondary">{$user.name}!</span>
							</h3>
							<p class="py-4">Are you sure you want to logout?</p>
							<div class="modal-action">
								<form method="dialog">
									<button class="btn btn-primary">Cancel</button>
								</form>
								<form action="admin/admin-logout" method="POST">
									<!-- if there is a button in form, it will close the modal -->
									<button class="btn btn-secondary">Logout</button>
								</form>
							</div>
						</div>
					</dialog>
				{:else}
					<a href="/admin/admin-login">
						<button class="btn btn-ghost ml-2 hidden bg-white text-lg text-blue-700 md:flex">
							Login
						</button>
					</a>
				{/if}
			</div>
		</nav>
	{:else}
		<div
			class={`bg-primary flex-none flex-col p-6 lg:flex lg:flex-row lg:bg-transparent lg:p-0 ${
				isMenuOpen ? 'flex' : 'hidden'
			} lg:flex`}
		>
			<div>
				<a href="/#menu">
					<button class="btn btn-ghost text-lg">Menu</button>
				</a>
			</div>

			{#each menuItems as item}
				<a
					href={getHref(item.id)}
					class="btn btn-ghost nav-link text-lg font-semibold normal-case"
					onclick={() => (isMenuOpen = false)}>{item.label}</a
				>
			{/each}
		</div>

		<div>
			<a href="/reservation">
				<button class="btn btn-ghost bg-secondary ml-2 hidden text-lg md:flex">
					Book Reservation
				</button>
			</a>
		</div>

		<div>
			{#if $user}
				<!-- <form action="/logout" method="POST"> -->
				<button
					onclick={my_modal_1.showModal()}
					class="btn btn-ghost ml-2 hidden bg-white text-lg text-blue-700 md:flex"
				>
					Logout
				</button>
				<!-- </form> -->

				<dialog id="my_modal_1" class="modal">
					<div class="modal-box text-black">
						<h3 class="text-lg font-bold">Hey <span class="text-secondary">{$user.name}!</span></h3>
						<p class="py-4">Are you sure you want to logout?</p>
						<div class="modal-action">
							<form method="dialog">
								<button class="btn btn-primary">Cancel</button>
							</form>
							<form action="/logout" method="POST">
								<!-- if there is a button in form, it will close the modal -->
								<button class="btn btn-secondary">Logout</button>
							</form>
						</div>
					</div>
				</dialog>
			{:else}
				<a href="/login">
					<button class="btn btn-ghost ml-2 hidden bg-white text-lg text-blue-700 md:flex">
						Signup/Login
					</button>
				</a>
			{/if}
		</div>
	{/if}
</nav>

{#if $isAdminPage}
	<div class="relative inset-0 z-100 mx-auto overflow-hidden">
		<input id="my-drawer" type="checkbox" class="drawer-toggle" />
		<div class="drawer-side sm:hidden">
			<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
			<ul class="menu min-h-full w-80 bg-blue-800 p-4 text-lg text-white">
				<li>
					<a onclick={closeSideBar} href="/admin"
						><button class="rounded-lg p-2">Dashboard</button></a
					>
				</li>
				<li>
					<a onclick={closeSideBar} href="/admin/admin-menu"
						><button class="rounded-lg p-2">Menu</button></a
					>
				</li>
				<li>
					<a onclick={closeSideBar} href="/admin/admin-order"
						><button class="rounded-lg p-2">Orders</button></a
					>
				</li>

				<li>
					<a onclick={closeSideBar} href="/admin/admin-reservation"
						><button class="rounded-lg p-2">Reservations</button></a
					>
				</li>
				<li>
					{#if $user}
						<!-- <form action="/logout" method="POST"> -->
						<button
							onclick={my_modal_1.showModal()}
							class="btn btn-ghost ml-2 bg-white text-lg text-blue-700 md:flex"
						>
							Logout
						</button>
						<!-- </form> -->

						<dialog id="my_modal_1" class="modal">
							<div class="modal-box text-black">
								<h3 class="text-lg font-bold">
									Hey <span class="text-secondary">{$user.name}!</span>
								</h3>
								<p class="py-4">Are you sure you want to logout?</p>
								<div class="modal-action">
									<form method="dialog">
										<button class="btn btn-primary">Cancel</button>
									</form>
									<form action="/admin/admin-logout" method="POST">
										<!-- if there is a button in form, it will close the modal -->
										<button class="btn btn-secondary">Logout</button>
									</form>
								</div>
							</div>
						</dialog>
					{:else}
						<!-- svelte-ignore node_invalid_placement_ssr -->
						<!-- <form onclick={closeSideBar} action="/admin/admin-login">
					<button class="rounded-lg p-2 btn text-lg text-blue-700">Login</button>
				</form> -->
						<a
							onclick={closeSideBar}
							class="btn rounded-lg p-2 text-blue-700"
							href="/admin/admin-login">Login</a
						>
					{/if}
				</li>
			</ul>
		</div>
	</div>
{:else}
	<div class="relative inset-0 z-100 mx-auto overflow-hidden">
		<input id="my-drawer" type="checkbox" class="drawer-toggle" />
		<div class="drawer-side sm:hidden">
			<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
			<ul class="menu min-h-full w-80 bg-blue-800 p-4 text-lg text-white">
				<li>
					<a onclick={closeSideBar} href="/#menu"><button class="rounded-lg p-2">Menu</button></a>
				</li>
				<li>
					<a onclick={closeSideBar} href="/about"><button class="rounded-lg p-2">About</button></a>
				</li>
				<li>
					<a onclick={closeSideBar} href="/contact"
						><button class="rounded-lg p-2">Contact</button></a
					>
				</li>

				<li>
					<a onclick={closeSideBar} href="/reservation"
						><button class="rounded-lg p-2">Book Reservation</button></a
					>
				</li>
				<li>
					{#if $user}
						<!-- <form action="/logout" method="POST"> -->
						<button
							onclick={my_modal_2.showModal()}
							class="btn btn-ghost ml-2 bg-white text-lg text-blue-700 md:flex"
						>
							Logout
						</button>
						<!-- </form> -->

						<dialog id="my_modal_2" class="modal">
							<div class="modal-box text-black">
								<h3 class="text-lg font-bold">
									Hey <span class="text-secondary">{$user.name}!</span>
								</h3>
								<p class="py-4">Are you sure you want to logout?</p>
								<div class="modal-action">
									<form method="dialog">
										<button class="btn btn-primary">Cancel</button>
									</form>
									<form action="/admin/admin-logout" method="POST">
										<!-- if there is a button in form, it will close the modal -->
										<button class="btn btn-secondary">Logout</button>
									</form>
								</div>
							</div>
						</dialog>
					{:else}
						<!-- svelte-ignore node_invalid_placement_ssr -->

						<a onclick={closeSideBar} href="/login" class="btn rounded-lg p-2 text-lg text-blue-700"
							>Signup/Login</a
						>
					{/if}
				</li>
			</ul>
		</div>
	</div>
{/if}
