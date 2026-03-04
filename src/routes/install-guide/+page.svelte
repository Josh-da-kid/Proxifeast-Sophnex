<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let isIOS = $state(false);
	let isAndroid = $state(false);
	let isDesktop = $state(false);
	let activeTab = $state<'mobile' | 'pc'>('mobile');

	onMount(() => {
		const ua = navigator.userAgent;
		isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
		isAndroid = /Android/.test(ua) && !isIOS;
		isDesktop = !isIOS && !isAndroid;

		// Set default tab based on device
		if (isDesktop) {
			activeTab = 'pc';
		}
	});
</script>

<svelte:head>
	<title>Install App - Proxifeast</title>
	<meta
		name="description"
		content="Learn how to install the Proxifeast app on your device for the best food ordering experience."
	/>
</svelte:head>

<div class="bg-base-200 min-h-screen">
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<!-- Header -->
		<div class="mb-12 text-center" in:fly={{ y: -20, duration: 500 }}>
			<div
				class="bg-primary mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="40"
					height="40"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-primary-content"
				>
					<path d="M12 2v20M2 12h20" />
				</svg>
			</div>
			<h1 class="mb-4 text-4xl font-bold">Install Proxifeast</h1>
			<p class="text-base-content/70 text-lg">Get the best food ordering experience with our app</p>
		</div>

		<!-- Benefits -->
		<div class="mb-12 grid gap-6 md:grid-cols-3" in:fly={{ y: 20, duration: 500, delay: 100 }}>
			<div class="bg-base-100 rounded-2xl p-6 text-center shadow-lg">
				<div
					class="bg-success/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-success"
					>
						<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
					</svg>
				</div>
				<h3 class="mb-2 font-bold">Lightning Fast</h3>
				<p class="text-base-content/70 text-sm">Instant access to your favorite venues</p>
			</div>

			<div class="bg-base-100 rounded-2xl p-6 text-center shadow-lg">
				<div
					class="bg-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-primary"
					>
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
					</svg>
				</div>
				<h3 class="mb-2 font-bold">Works Offline</h3>
				<p class="text-base-content/70 text-sm">Browse menus even without internet</p>
			</div>

			<div class="bg-base-100 rounded-2xl p-6 text-center shadow-lg">
				<div
					class="bg-secondary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-secondary"
					>
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
						<path d="M13.73 21a2 2 0 0 1-3.46 0" />
					</svg>
				</div>
				<h3 class="mb-2 font-bold">Push Notifications</h3>
				<p class="text-base-content/70 text-sm">Get updates on your orders instantly</p>
			</div>
		</div>

		<!-- Installation Instructions -->
		<div
			class="bg-base-100 overflow-hidden rounded-2xl shadow-lg"
			in:fly={{ y: 20, duration: 500, delay: 200 }}
		>
			<!-- Platform Tabs -->
			<div class="border-base-200 flex border-b">
				<button
					class="flex-1 p-4 text-center font-medium transition-colors {activeTab === 'mobile'
						? 'bg-primary text-primary-content'
						: 'hover:bg-base-200'}"
					onclick={() => (activeTab = 'mobile')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-2 inline h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
						<line x1="12" y1="18" x2="12.01" y2="18" />
					</svg>
					Mobile
				</button>
				<button
					class="flex-1 p-4 text-center font-medium transition-colors {activeTab === 'pc'
						? 'bg-primary text-primary-content'
						: 'hover:bg-base-200'}"
					onclick={() => (activeTab = 'pc')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-2 inline h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
						<line x1="8" y1="21" x2="16" y2="21" />
						<line x1="12" y1="17" x2="12" y2="21" />
					</svg>
					PC / Laptop
				</button>
			</div>

			{#if activeTab === 'mobile'}
				{#if isIOS}
					<!-- iOS Instructions -->
					<div class="p-8">
						<div class="mb-8 flex items-center gap-4">
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-black">
								<svg viewBox="0 0 24 24" width="24" height="24" fill="white">
									<path
										d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-2xl font-bold">Install on iOS</h2>
								<p class="text-base-content/70">iPhone and iPad</p>
							</div>
						</div>

						<div class="space-y-6">
							<div class="flex gap-4">
								<div
									class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
								>
									1
								</div>
								<div>
									<h3 class="mb-2 font-bold">Open Safari</h3>
									<p class="text-base-content/70 mb-3">
										Use Safari browser for the best installation experience. Other browsers may not
										support PWA installation.
									</p>
									<div class="bg-base-200 text-base-content/60 rounded-lg p-3 text-sm">
										Note: Chrome and other browsers on iOS don't support direct PWA installation.
									</div>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
								>
									2
								</div>
								<div>
									<h3 class="mb-2 font-bold">Tap the Share Button</h3>
									<p class="text-base-content/70">
										Look for the share icon at the bottom of Safari (it's a square with an arrow
										pointing up).
									</p>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
								>
									3
								</div>
								<div>
									<h3 class="mb-2 font-bold">Add to Home Screen</h3>
									<p class="text-base-content/70">
										Scroll down in the share menu and tap "Add to Home Screen".
									</p>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
								>
									4
								</div>
								<div>
									<h3 class="mb-2 font-bold">Confirm Installation</h3>
									<p class="text-base-content/70">
										Tap "Add" in the top right corner. The Proxifeast app icon will now appear on
										your home screen!
									</p>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Android Instructions -->
					<div class="p-8">
						<div class="mb-8 flex items-center gap-4">
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500">
								<svg viewBox="0 0 24 24" width="24" height="24" fill="white">
									<path
										d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0225 3.503C15.5902 8.4796 13.8539 8.1363 12 8.1363c-1.8544 0-3.5914.3433-5.1373.9625L4.8406 5.5963a.4161.4161 0 0 0-.5677-.1521.416.416 0 0 0-.1521.5676l1.9977 3.4592C2.6889 11.1867.3432 14.6589.3432 18.6617h23.3136c0-4.0028-2.3457-7.475-5.775-9.3403"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-2xl font-bold">Install on Android</h2>
								<p class="text-base-content/70">Chrome and other browsers</p>
							</div>
						</div>

						<div class="space-y-6">
							<div class="flex gap-4">
								<div
									class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
								>
									1
								</div>
								<div>
									<h3 class="mb-2 font-bold">Open Chrome</h3>
									<p class="text-base-content/70 mb-3">
										Use Chrome browser for the best experience. You can also use Edge, Samsung
										Internet, or other Chromium-based browsers.
									</p>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
								>
									2
								</div>
								<div>
									<h3 class="mb-2 font-bold">Tap the Menu</h3>
									<p class="text-base-content/70">
										Look for the three dots menu (⋮) in the top right corner of the browser and tap
										it.
									</p>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
								>
									3
								</div>
								<div>
									<h3 class="mb-2 font-bold">Add to Home Screen</h3>
									<p class="text-base-content/70">
										Select "Add to Home screen" or "Install app" from the menu options.
									</p>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
								>
									4
								</div>
								<div>
									<h3 class="mb-2 font-bold">Confirm Installation</h3>
									<p class="text-base-content/70">
										Tap "Install" or "Add" when prompted. The Proxifeast app icon will appear on
										your home screen!
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}
			{:else}
				<!-- PC Instructions -->
				<div class="p-8">
					<div class="mb-8 flex items-center gap-4">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
							<svg viewBox="0 0 24 24" width="24" height="24" fill="white">
								<path
									d="M0 3.449L9.06.639a1.17 1.17 0 011.885 0L12 1.639l.959-1.065a1.17 1.17 0 011.885 0L22 6.164v13.126a1.17 1.17 0 01-1.171 1.171H1.171A1.17 1.17 0 010 19.29V3.449zm12.935 4.365l-1.821-1.821L12 5.134 1.821 6.813.001 4.992l9.06-3.635 1.821 1.821 1.053.94v-.184zM1.172 19.29l.823 6.641h14.547l.823-6.641a1.172 1.172 0 00-1.171-1.171H2.343a1.172 1.172 0 00-1.171 1.171z"
								/>
							</svg>
						</div>
						<div>
							<h2 class="text-2xl font-bold">Install on PC</h2>
							<p class="text-base-content/70">Windows, Mac, and Linux</p>
						</div>
					</div>

					<div class="space-y-6">
						<div class="flex gap-4">
							<div
								class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
							>
								1
							</div>
							<div>
								<h3 class="mb-2 font-bold">Open in Chrome or Edge</h3>
								<p class="text-base-content/70 mb-3">
									For the best experience, use Google Chrome, Microsoft Edge, or any Chromium-based
									browser.
								</p>
							</div>
						</div>

						<div class="flex gap-4">
							<div
								class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
							>
								2
							</div>
							<div>
								<h3 class="mb-2 font-bold">Look for Install Icon</h3>
								<p class="text-base-content/70 mb-3">
									Look for the install icon in the address bar (computer monitor icon) on the right
									side.
									{#if !isDesktop}
										<span class="text-sm opacity-70"
											>(This option appears on desktop/laptop browsers)</span
										>
									{/if}
								</p>
							</div>
						</div>

						<div class="flex gap-4">
							<div
								class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
							>
								3
							</div>
							<div>
								<h3 class="mb-2 font-bold">Click Install</h3>
								<p class="text-base-content/70">
									Click the install icon or select "Install Proxifeast" from the browser menu. The
									app will install and open in a separate window!
								</p>
							</div>
						</div>

						<div class="flex gap-4">
							<div
								class="bg-primary text-primary-content flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
							>
								4
							</div>
							<div>
								<h3 class="mb-2 font-bold">Access Anytime</h3>
								<p class="text-base-content/70">
									Find Proxifeast in your installed apps or desktop. The app works offline and
									provides push notifications!
								</p>
							</div>
						</div>
					</div>

					<!-- Chrome-specific instructions -->
					<div class="mt-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
						<h4 class="mb-2 flex items-center gap-2 font-semibold">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-blue-600"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
							</svg>
							Chrome Users
						</h4>
						<p class="text-base-content/70 text-sm">
							Click the three dots menu (⋮) → "Save and share" → "Install Proxifeast" OR look for
							the computer icon in the address bar.
						</p>
					</div>

					<!-- Edge-specific instructions -->
					<div class="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
						<h4 class="mb-2 flex items-center gap-2 font-semibold">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-green-600"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M2 12L4.5 20.5H11.5L12.5 14.5L15 2L2 12Z" />
							</svg>
							Edge Users
						</h4>
						<p class="text-base-content/70 text-sm">
							Click the three dots menu (⋮) → "Apps" → "Install this site as an app" OR look for the
							install icon in the address bar.
						</p>
					</div>
				</div>
			{/if}

			<!-- Alternative Method -->
			<div class="border-base-200 bg-base-200/50 border-t p-8">
				<h3 class="mb-4 flex items-center gap-2 font-bold">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
					Having Trouble?
				</h3>
				<div class="grid gap-4 text-sm md:grid-cols-2">
					<div class="bg-base-100 rounded-lg p-4">
						<h4 class="mb-2 font-semibold">Can't see the install option?</h4>
						<p class="text-base-content/70">
							Make sure you're using a modern browser like Chrome, Safari, or Edge. Some older
							browsers don't support PWA installation.
						</p>
					</div>
					<div class="bg-base-100 rounded-lg p-4">
						<h4 class="mb-2 font-semibold">Already installed?</h4>
						<p class="text-base-content/70">
							If you've previously installed the app, you won't see the install option again. Look
							for the Proxifeast icon on your home screen.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Back to Home -->
		<div class="mt-12 text-center" in:fly={{ y: 20, duration: 500, delay: 300 }}>
			<a href="/" class="btn btn-primary btn-lg">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mr-2"
				>
					<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
					<polyline points="9 22 9 12 15 12 15 22" />
				</svg>
				Back to Home
			</a>
		</div>
	</div>
</div>
