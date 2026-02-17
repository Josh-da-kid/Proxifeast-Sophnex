<script lang="ts">
	import { derived } from 'svelte/store';
	import { menuItems, toggleMenu, getHref, isAdminPage } from './menuItems.svelte';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';

	let isAdmin = false;

	const unsubscribe = isAdminPage.subscribe((val) => {
		isAdmin = val;
	});

	onDestroy(unsubscribe);

	let isMenuOpen = $state(false);

	let previousScrollY = 0;
	let showHeader = $state(true);

	function handleScroll() {
		const currentScrollY = window.scrollY;
		showHeader = currentScrollY < previousScrollY || currentScrollY < 50;
		previousScrollY = currentScrollY;
	}

	function closeSideBar() {
		const drawerToggle = document.getElementById('my-drawer');
		if (drawerToggle) {
			// @ts-ignore
			drawerToggle.checked = false;
		}
	}

	onMount(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	const user = derived(page, ($page) => $page.data.user);

	const restaurantName = get(page).data.restaurant?.name;

	let logoutModalAdmin: HTMLDialogElement;
	let logoutModalUser: HTMLDialogElement;
</script>

<nav
	class="navbar bg-primary text-primary-content sticky top-0 z-[60] flex h-16 items-center justify-between px-4 shadow-lg transition-transform duration-300 ease-in-out md:px-6"
	class:translate-y-[-100%]={!showHeader}
	class:translate-y-0={showHeader}
>
	<!-- Logo Section -->
	<div class="flex items-center gap-3">
		<a href="/" class="flex flex-col">
			<span class="font-playfair text-xl leading-tight font-bold md:text-2xl">
				{restaurantName}
			</span>
		</a>
	</div>

	<!-- Desktop Navigation -->
	<div class="hidden items-center gap-1 lg:flex">
		<a href="/install-guide" class="btn btn-ghost btn-sm gap-2 hover:bg-white">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"><path d="M12 2v20M2 12h20" /></svg
			>
			Install App
		</a>
		{#if $user}
			<a href="/checkout" class="btn btn-ghost btn-sm gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path
						d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
					/></svg
				>
				Cart
			</a>
			<a href="/favorites" class="btn btn-ghost btn-sm gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
					/>
				</svg>
				Favorites
			</a>
		{/if}
	</div>

	<!-- Mobile Menu Button -->
	<div class="flex items-center gap-2">
		<label for="my-drawer" class="btn btn-ghost btn-circle drawer-button">
			<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24"
				><path
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-width="1.5"
					d="M4 7h3m13 0h-9m9 10h-3M4 17h9m-9-5h16"
				/></svg
			>
		</label>
	</div>
</nav>

{#if $isAdminPage}
	<div class="drawer drawer-end relative z-[70]">
		<input id="my-drawer" type="checkbox" class="drawer-toggle" />
		<div class="drawer-side z-[80]">
			<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
			<div class="bg-base-100 flex h-full w-80 flex-col">
				<!-- Drawer Header -->
				<div class="bg-primary text-primary-content p-6">
					<h2 class="font-playfair text-xl font-bold">{restaurantName}</h2>
					<p class="text-primary-content/80 text-sm">Admin Panel</p>
				</div>

				<!-- Navigation Links -->
				<ul class="menu flex-1 gap-1 p-4">
					<li>
						<a
							onclick={closeSideBar}
							href="/admin"
							class={$page.url.pathname === '/admin' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><rect width="7" height="9" x="3" y="3" rx="1" /><rect
									width="7"
									height="5"
									x="14"
									y="3"
									rx="1"
								/><rect width="7" height="9" x="14" y="12" rx="1" /><rect
									width="7"
									height="5"
									x="3"
									y="16"
									rx="1"
								/></svg
							>
							Dashboard
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/admin/analytics"
							class={$page.url.pathname === '/admin/analytics' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><line x1="18" y1="20" x2="18" y2="10" /><line
									x1="12"
									y1="20"
									x2="12"
									y2="4"
								/><line x1="6" y1="20" x2="6" y2="14" /></svg
							>
							Analytics
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/admin/admin-menu"
							class={$page.url.pathname === '/admin/admin-menu' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M3 7v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" /><path d="M3 7h18" /><path
									d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
								/></svg
							>
							Menu
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/admin/admin-order"
							class={$page.url.pathname === '/admin/admin-order' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg
							>
							Pending Orders
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/admin/admin-history"
							class={$page.url.pathname === '/admin/admin-history' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg
							>
							Order History
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/admin/admin-reservation"
							class={$page.url.pathname === '/admin/admin-reservation' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M8 2v4" /><path d="M16 2v4" /><rect
									width="18"
									height="18"
									x="3"
									y="4"
									rx="2"
								/><path d="M3 10h18" /></svg
							>
							Reservations
						</a>
					</li>
				</ul>

				<!-- Drawer Footer -->
				<div class="border-base-300 border-t p-4">
					{#if $user}
						<div class="mb-4">
							<p class="text-sm font-medium">{$user.name}</p>
							<p class="text-base-content/60 text-xs">{$user.email}</p>
						</div>
						<button
							onclick={() => logoutModalAdmin.showModal()}
							class="btn btn-error btn-outline w-full"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
									points="16 17 21 12 16 7"
								/><line x1="21" y1="12" x2="9" y2="12" /></svg
							>
							Logout
						</button>

						<dialog bind:this={logoutModalAdmin} id="logout_modal_admin" class="modal">
							<div class="modal-box">
								<h3 class="text-lg font-bold">Confirm Logout</h3>
								<p class="py-4">Are you sure you want to logout?</p>
								<div class="modal-action">
									<form method="dialog">
										<button class="btn">Cancel</button>
									</form>
									<form action="/admin/admin-logout" method="POST">
										<button class="btn btn-error">Logout</button>
									</form>
								</div>
							</div>
						</dialog>
					{:else}
						<a onclick={closeSideBar} href="/admin/admin-login" class="btn btn-primary w-full">
							Login
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="drawer drawer-end relative z-[70]">
		<input id="my-drawer" type="checkbox" class="drawer-toggle" />
		<div class="drawer-side z-[80]">
			<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
			<div class="bg-base-100 flex h-full w-80 flex-col">
				<!-- Drawer Header -->
				<div class="bg-primary text-primary-content p-6">
					<h2 class="font-playfair text-xl font-bold">{restaurantName}</h2>
					<p class="text-primary-content/80 text-sm">Menu</p>
				</div>

				<!-- Navigation Links -->
				<ul class="menu flex-1 gap-1 p-4">
					<li>
						<a onclick={closeSideBar} href="/" class={$page.url.pathname === '/' ? 'active' : ''}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline
									points="9 22 9 12 15 12 15 22"
								/></svg
							>
							Home
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/install-guide"
							class={$page.url.pathname === '/install-guide' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="M12 2v20M2 12h20" /></svg
							>
							Install App
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/restaurants"
							class={$page.url.pathname === '/restaurants' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M2 7.5V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2.5" /><path
									d="M2 17.5a.5.5 0 0 1 .5-.5h19a.5.5 0 0 1 .5.5v1a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5Z"
								/><path d="m4 7.5 1.6 6.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L20 7.5" /></svg
							>
							Restaurants
						</a>
					</li>
					{#if $user}
						<li>
							<a
								onclick={closeSideBar}
								href="/favorites"
								class={$page.url.pathname === '/favorites' ? 'active' : ''}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path
										d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
									/>
								</svg>
								Favorites
							</a>
						</li>
					{/if}
					<li>
						<a
							onclick={closeSideBar}
							href="/checkout"
							class={$page.url.pathname === '/checkout' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path
									d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
								/></svg
							>
							Cart
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/pending"
							class={$page.url.pathname === '/pending' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg
							>
							Pending Orders
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/history"
							class={$page.url.pathname === '/history' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg
							>
							Order History
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/reservation"
							class={$page.url.pathname === '/reservation' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M8 2v4" /><path d="M16 2v4" /><rect
									width="18"
									height="18"
									x="3"
									y="4"
									rx="2"
								/><path d="M3 10h18" /></svg
							>
							Book Reservation
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/about"
							class={$page.url.pathname === '/about' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg
							>
							About
						</a>
					</li>
					<li>
						<a
							onclick={closeSideBar}
							href="/contact"
							class={$page.url.pathname === '/contact' ? 'active' : ''}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path
									d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
								/></svg
							>
							Contact
						</a>
					</li>
				</ul>

				<!-- Drawer Footer -->
				<div class="border-base-300 border-t p-4">
					{#if $user}
						<div class="mb-4">
							<p class="text-sm font-medium">{$user.name}</p>
							<p class="text-base-content/60 text-xs">{$user.email}</p>
						</div>
						<button
							onclick={() => logoutModalUser.showModal()}
							class="btn btn-error btn-outline w-full"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline
									points="16 17 21 12 16 7"
								/><line x1="21" y1="12" x2="9" y2="12" /></svg
							>
							Logout
						</button>

						<dialog bind:this={logoutModalUser} id="logout_modal_user" class="modal">
							<div class="modal-box">
								<h3 class="text-lg font-bold">Confirm Logout</h3>
								<p class="py-4">Are you sure you want to logout?</p>
								<div class="modal-action">
									<form method="dialog">
										<button class="btn">Cancel</button>
									</form>
									<form action="/logout" method="POST">
										<button class="btn btn-error">Logout</button>
									</form>
								</div>
							</div>
						</dialog>
					{:else}
						<a onclick={closeSideBar} href="/login" class="btn btn-primary w-full">
							Sign In / Register
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
