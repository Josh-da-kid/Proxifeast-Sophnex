<script lang="ts">
	import { derived } from 'svelte/store';
	import { menuItems, toggleMenu } from './menuItems.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
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

	const currentPath = derived(page, ($page) => $page.url.pathname);
	const currentHash = derived(page, ($page) => $page.url.hash);

	// const isActive = (target:any) => {
	// 		// target can be a hash (like "#menu") or path (like "/about")
	// 		const { pathname, hash } = $page.url;
	// 		if (target.startsWith('#')) {
	// 			return hash === target;
	// 		} else {
	// 			return pathname === target;
	// 		}
	// 	};

	function getHref(id: any) {
		if (id === 'home') return '/';
		// if (id === 'menu') return '#menu';
		return `/${id}`;
	}
</script>

<!-- Navbar -->

<nav
	class="navbar bg-primary text-primary-content sticky top-0 z-50 flex items-center justify-center rounded-b-3xl px-5 shadow-lg transition-transform duration-300 ease-in-out"
	class:translate-y-[-100%]={!showHeader}
	class:translate-y-0={showHeader}
>
	<div class="flex-1 px-1">
		<a href="/" class="font-playfair text-2xl font-bold normal-case md:text-3xl">
			Chef Zhanga Foods
			<!-- Native Delicacies -->
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
				class:bg-white={item.id === 'signup'}
				class:text-blue-700={item.id === 'signup'}
				class:ml-2={item.id === 'signup'}
				onclick={() => (isMenuOpen = false)}>{item.label}</a
			>
		{/each}
	</div>

	<div>
		<a href="/reservation">
			<button class="btn btn-ghost bg-secondary ml-2 hidden text-lg md:flex"
				>Book Reservation</button
			>
		</a>
	</div>
</nav>

<!-- drawer side bar -->

<div class="relative inset-0 z-100 mx-auto overflow-hidden">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-side sm:hidden">
		<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
		<!-- svelte-ignore a11y_missing_attribute -->
		<ul class="menu min-h-full w-80 bg-blue-800 p-4 text-lg text-white">
			<li>
				<a onclick={closeSideBar} href="/#menu"><button class="rounded-lg p-2">Menu</button></a>
			</li>
			<!-- <li>
				<a onclick={closeSideBar} href="#menu"
					><button
						class:bg-primary={$currentHash === '#menu'}
						class:text-white={$currentHash === '#menu'}
						class="rounded-lg p-2">Menu</button
					></a
				>
			</li> -->
			<li>
				<a onclick={closeSideBar} href="/about"><button class="rounded-lg p-2">About</button></a>
			</li>
			<li>
				<a onclick={closeSideBar} href="/contact"><button class="rounded-lg p-2">Contact</button></a
				>
			</li>
			<li>
				<a onclick={closeSideBar} href="/signup"
					><button class="rounded-lg p-2">Signup/Login</button></a
				>
			</li>
			<li>
				<a onclick={closeSideBar} href="/reservation"
					><button class="rounded-lg p-2">Book Reservation</button></a
				>
			</li>
		</ul>
	</div>
</div>
