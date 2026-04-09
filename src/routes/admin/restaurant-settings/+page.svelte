<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import Notification from '$lib/Notification.svelte';
	import Footer from '$lib/Footer.svelte';
	import ImageCropper from '$lib/ImageCropper.svelte';

	let { data } = $props();
	const restaurant = data?.restaurant;
	const orderServices = data?.orderServices ?? {
		tableService: true,
		pickup: true,
		homeDelivery: true
	};
	const teamMembers = data?.teamMembers ?? [];
	const restaurants = data?.restaurants ?? [];
	const managedStores = data?.managedStores ?? [];
	const globalUsers = data?.globalUsers ?? [];
	const currentUserId = $page.data.user?.id;
	const currentRestaurantId = data?.restaurantId;
	// Use isSuper from page server data (returned from load function)
	const isSuper = data?.isSuper ?? false;
	const setupInquiries = data?.setupInquiries ?? [];

	// New restaurant form state
	let showNewRestaurantModal = $state(false);
	let creatingRestaurant = $state(false);
	let newRestaurantForm = $state({
		name: '',
		type: 'restaurant',
		domain: '',
		slug: '',
		description: '',
		motto: '',
		category: '',
		email: '',
		phone: '',
		state: '',
		localGovernment: '',
		address: '',
		openingTime: '09:00',
		closingTime: '22:00',
		serviceFee: '0',
		deliveryFeePerKm: '0',
		maxDeliveryRadius: '10',
		isSuper: false,
		hasReservation: false,
		hasRoomService: false
	});

	async function createRestaurant(event: SubmitEvent) {
		event.preventDefault();
		creatingRestaurant = true;

		const formData = new FormData();
		Object.entries(newRestaurantForm).forEach(([key, value]) => {
			// Handle checkbox - send 'true' if checked, empty string if not
			if (key === 'isSuper' || key === 'hasReservation' || key === 'hasRoomService') {
				formData.append(key, value ? 'true' : '');
			} else {
				formData.append(key, String(value ?? ''));
			}
		});

		try {
			const response = await fetch('?/createRestaurant', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				showNewRestaurantModal = false;
				newRestaurantForm = {
					name: '',
					type: 'restaurant',
					domain: '',
					slug: '',
					description: '',
					motto: '',
					category: '',
					email: '',
					phone: '',
					state: '',
					localGovernment: '',
					address: '',
					openingTime: '09:00',
					closingTime: '22:00',
					serviceFee: '0',
					deliveryFeePerKm: '0',
					maxDeliveryRadius: '10',
					isSuper: false,
					hasReservation: false,
					hasRoomService: false
				};
				successAlert = true;
				successMessage = 'Store created successfully!';
				setTimeout(() => (successAlert = false), 3000);
				await invalidateAll();
			} else {
				errorAlert = true;
				errorMessage = result.data?.error || 'Failed to create store';
				setTimeout(() => (errorAlert = false), 3000);
			}
		} catch (err) {
			console.error('Error creating store:', err);
			errorAlert = true;
			errorMessage = 'Failed to create store';
			setTimeout(() => (errorAlert = false), 3000);
		} finally {
			creatingRestaurant = false;
		}
	}

	async function updateInquiryStatus(inquiryId: string, status: string) {
		const formData = new FormData();
		formData.append('inquiryId', inquiryId);
		formData.append('status', status);

		try {
			const response = await fetch('?/updateInquiryStatus', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				await invalidateAll();
			}
		} catch (err) {
			console.error('Error updating inquiry:', err);
		}
	}

	// Form state - use restaurant data as initial values
	let tableServiceEnabled = $state(orderServices.tableService);
	let pickupEnabled = $state(orderServices.pickup);
	let homeDeliveryEnabled = $state(orderServices.homeDelivery);

	// Restaurant info form state
	let restName = $state(restaurant?.name || '');
	let restDomain = $state(restaurant?.domain || '');
	let restCategory = $state(restaurant?.category || '');
	let restMotto = $state(restaurant?.motto || '');
	let restDescription = $state(restaurant?.description || '');
	let restOpeningTime = $state(restaurant?.openingTime || '');
	let restClosingTime = $state(restaurant?.closingTime || '');
	let restPhone = $state(restaurant?.phone || '');
	let restAddress = $state(restaurant?.address || restaurant?.restaurantAddress || '');
	let restState = $state(restaurant?.state || '');
	let restLGA = $state(restaurant?.localGovernment || '');
	let restImageUrl = $state(restaurant?.imageUrl || '');
	let restLogoUrl = $state(restaurant?.logoUrl || '');
	let restBannerUrl = $state(restaurant?.bannerUrl || '');

	// Gallery management state
	let galleryImages = $state(data?.galleryImages || []);
	let originalGalleryImages = $state([...(data?.galleryImages || [])]);
	let galleryChanged = $derived(
		JSON.stringify(galleryImages) !== JSON.stringify(originalGalleryImages)
	);
	let galleryUploadMode = $state(false);

	function openGalleryCropper() {
		cropperType = 'gallery';
		showImageCropper = true;
	}

	function handleGalleryImageCrop(blob: Blob, base64: string) {
		galleryImages = [...galleryImages, base64];
		showImageCropper = false;
	}

	function removeGalleryImage(index: number) {
		galleryImages = galleryImages.filter((_, i) => i !== index);
	}

	async function submitGallery(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);
		formData.set('galleryImages', JSON.stringify(galleryImages));

		const response = await fetch('?/updateGallery', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (result.type === 'success') {
			successAlert = true;
			successMessage = result.data?.message || 'Gallery updated successfully!';
			setTimeout(() => {
				successAlert = false;
			}, 3000);
			originalGalleryImages = [...galleryImages];
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to update gallery';
			setTimeout(() => {
				errorAlert = false;
			}, 3000);
		}
	}

	$effect(() => {
		if (data?.galleryImages) {
			galleryImages = data.galleryImages;
			originalGalleryImages = [...data.galleryImages];
		}
	});

	// Override handleImageCrop to also handle gallery
	function handleImageCropWithGallery(blob: Blob, base64: string) {
		if (cropperType === 'gallery') {
			handleGalleryImageCrop(blob, base64);
		} else {
			handleImageCrop(blob, base64);
		}
	}

	// Image cropper state
	let showImageCropper = $state(false);
	let cropperType = $state<'image' | 'logo' | 'banner' | 'gallery'>('image');

	function openImageCropper(type: 'image' | 'logo' | 'banner' | 'gallery') {
		cropperType = type;
		showImageCropper = true;
	}

	async function uploadImageToPocketBase(
		blob: Blob,
		restaurantId: string,
		imageType: string
	): Promise<string> {
		const formData = new FormData();
		const fileName = `${imageType}_${Date.now()}.png`;
		formData.append('file', blob, fileName);

		const response = await fetch(
			`/api/upload-image?restaurantId=${restaurantId}&type=${imageType}`,
			{
				method: 'POST',
				body: formData
			}
		);

		console.log('Upload response status:', response.status);

		if (response.ok) {
			const data = await response.json();
			console.log('Upload success, URL:', data.url);
			return data.url;
		}

		const errorData = await response.json();
		console.error('Upload failed:', errorData);
		throw new Error(errorData.error || 'Failed to upload image');
	}

	async function handleImageCrop(blob: Blob, base64: string) {
		// Upload to PocketBase and get URL
		try {
			const url = await uploadImageToPocketBase(blob, restaurant?.id || '', cropperType);
			console.log('Uploaded URL for', cropperType, ':', url);

			if (cropperType === 'image') {
				restImageUrl = url;
			} else if (cropperType === 'logo') {
				restLogoUrl = url;
			} else if (cropperType === 'banner') {
				restBannerUrl = url;
			}
		} catch (err) {
			console.error('Failed to upload image:', err);
			// Fallback to base64 if upload fails
			if (cropperType === 'image') {
				restImageUrl = base64;
			} else if (cropperType === 'logo') {
				restLogoUrl = base64;
			} else if (cropperType === 'banner') {
				restBannerUrl = base64;
			}
		}
		showImageCropper = false;
	}

	function removeImage(type: 'image' | 'logo' | 'banner') {
		if (type === 'image') {
			restImageUrl = '';
		} else if (type === 'logo') {
			restLogoUrl = '';
		} else if (type === 'banner') {
			restBannerUrl = '';
		}
	}

	// Track original values to detect changes
	let originalOrderServices = $state({ ...orderServices });
	let originalRestaurantInfo = $state({
		name: restaurant?.name || '',
		domain: restaurant?.domain || '',
		category: restaurant?.category || '',
		motto: restaurant?.motto || '',
		description: restaurant?.description || '',
		openingTime: restaurant?.openingTime || '',
		closingTime: restaurant?.closingTime || '',
		phone: restaurant?.phone || '',
		address: restaurant?.address || restaurant?.restaurantAddress || '',
		state: restaurant?.state || '',
		localGovernment: restaurant?.localGovernment || '',
		imageUrl: restaurant?.imageUrl || '',
		logoUrl: restaurant?.logoUrl || '',
		bannerUrl: restaurant?.bannerUrl || ''
	});

	// Check if forms have changes
	let orderServicesChanged = $derived(
		tableServiceEnabled !== originalOrderServices.tableService ||
			pickupEnabled !== originalOrderServices.pickup ||
			homeDeliveryEnabled !== originalOrderServices.homeDelivery
	);

	let restaurantInfoChanged = $derived(
		restName !== originalRestaurantInfo.name ||
			restDomain !== originalRestaurantInfo.domain ||
			restCategory !== originalRestaurantInfo.category ||
			restMotto !== originalRestaurantInfo.motto ||
			restDescription !== originalRestaurantInfo.description ||
			restOpeningTime !== originalRestaurantInfo.openingTime ||
			restClosingTime !== originalRestaurantInfo.closingTime ||
			restPhone !== originalRestaurantInfo.phone ||
			restAddress !== originalRestaurantInfo.address ||
			restState !== originalRestaurantInfo.state ||
			restLGA !== originalRestaurantInfo.localGovernment ||
			restImageUrl !== originalRestaurantInfo.imageUrl ||
			restLogoUrl !== originalRestaurantInfo.logoUrl ||
			restBannerUrl !== originalRestaurantInfo.bannerUrl
	);

	// Update local state when data changes
	$effect(() => {
		if (restaurant) {
			restName = restaurant.name || '';
			restDomain = restaurant.domain || '';
			restCategory = restaurant.category || '';
			restMotto = restaurant.motto || '';
			restDescription = restaurant.description || '';
			restOpeningTime = restaurant.openingTime || '';
			restClosingTime = restaurant.closingTime || '';
			restPhone = restaurant.phone || restaurant.phoneNumber || '';
			restAddress = restaurant.address || restaurant.restaurantAddress || '';
			restState = restaurant.state || '';
			restLGA = restaurant.localGovernment || '';
			restImageUrl = restaurant.imageUrl || '';
			restLogoUrl = restaurant.logoUrl || '';
			restBannerUrl = restaurant.bannerUrl || '';
			originalRestaurantInfo = {
				name: restaurant.name || '',
				domain: restaurant.domain || '',
				category: restaurant.category || '',
				motto: restaurant.motto || '',
				description: restaurant.description || '',
				openingTime: restaurant.openingTime || '',
				closingTime: restaurant.closingTime || '',
				phone: restaurant.phone || restaurant.phoneNumber || '',
				address: restaurant.address || restaurant.restaurantAddress || '',
				state: restaurant.state || '',
				localGovernment: restaurant.localGovernment || '',
				imageUrl: restaurant.imageUrl || '',
				logoUrl: restaurant.logoUrl || '',
				bannerUrl: restaurant.bannerUrl || ''
			};
		}
	});

	$effect(() => {
		tableServiceEnabled = orderServices.tableService;
		pickupEnabled = orderServices.pickup;
		homeDeliveryEnabled = orderServices.homeDelivery;
		originalOrderServices = { ...orderServices };
	});

	let successAlert = $state(false);
	let errorAlert = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let selectedStoreByUser = $state<Record<string, string>>({});
	let storesExpanded = $state(true);
	let usersExpanded = $state(true);
	let storeSearchQuery = $state('');
	let userSearchQuery = $state('');

	let filteredManagedStores = $derived(
		storeSearchQuery.trim()
			? managedStores.filter(
					(s: any) =>
						s.name?.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
						s.domain?.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
						s.type?.toLowerCase().includes(storeSearchQuery.toLowerCase())
				)
			: managedStores
	);

	let filteredGlobalUsers = $derived(
		userSearchQuery.trim()
			? globalUsers.filter(
					(u: any) =>
						u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
						u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
						u.role?.toLowerCase().includes(userSearchQuery.toLowerCase())
				)
			: globalUsers
	);

	$effect(() => {
		if (isSuper && managedStores.length > 0 && globalUsers.length > 0) {
			const fallbackStoreId = currentRestaurantId || managedStores[0]?.id || '';
			selectedStoreByUser = Object.fromEntries(
				globalUsers.map((member: any) => [
					member.id,
					member.adminRestaurants?.[0]?.id || fallbackStoreId
				])
			);
		}
	});

	function switchRestaurant(restaurantId: string) {
		const baseUrl = window.location.pathname;
		window.location.href = `${baseUrl}?restaurantId=${restaurantId}`;
	}

	async function submitOrderServices(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const response = await fetch('?/updateOrderServices', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (result.type === 'success') {
			successAlert = true;
			successMessage = result.data?.message || 'Settings saved successfully!';
			setTimeout(() => {
				successAlert = false;
			}, 3000);
			// Refresh original values
			originalOrderServices = {
				tableService: tableServiceEnabled,
				pickup: pickupEnabled,
				homeDelivery: homeDeliveryEnabled
			};
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to save settings';
			setTimeout(() => {
				errorAlert = false;
			}, 3000);
		}
	}

	async function submitRestaurantInfo(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const response = await fetch('?/updateRestaurantInfo', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (result.type === 'success') {
			successAlert = true;
			successMessage = result.data?.message || 'Store info saved successfully!';
			setTimeout(() => {
				successAlert = false;
			}, 3000);
			// Refresh original values
			originalRestaurantInfo = {
				name: restName,
				domain: restDomain,
				category: restCategory,
				motto: restMotto,
				description: restDescription,
				openingTime: restOpeningTime,
				closingTime: restClosingTime,
				phone: restPhone,
				address: restAddress,
				state: restState,
				localGovernment: restLGA,
				imageUrl: restImageUrl,
				logoUrl: restLogoUrl,
				bannerUrl: restBannerUrl
			};
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to save store info';
			setTimeout(() => {
				errorAlert = false;
			}, 3000);
		}
	}

	$effect(() => {
		if ($page.form?.success) {
			successAlert = true;
			successMessage = $page.form?.message || 'Settings saved successfully!';
			setTimeout(() => {
				successAlert = false;
			}, 3000);
		} else if ($page.form?.error) {
			errorAlert = true;
			errorMessage = $page.form.error;
			setTimeout(() => {
				errorAlert = false;
			}, 3000);
		}
	});

	function getRoleBadgeClass(role: string) {
		switch (role) {
			case 'owner':
				return 'bg-purple-100 text-purple-800 border-purple-200';
			case 'manager':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'kitchen':
				return 'bg-orange-100 text-orange-800 border-orange-200';
			case 'waiter':
				return 'bg-green-100 text-green-800 border-green-200';
			default:
				return 'bg-slate-100 text-slate-800 border-slate-200';
		}
	}

	async function updateRole(userId: string, role: string) {
		const formData = new FormData();
		formData.append('userId', userId);
		formData.append('role', role);

		const response = await fetch('?/updateUserRole', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (result.type === 'success') {
			successAlert = true;
			successMessage = 'Role updated successfully!';
			setTimeout(() => {
				successAlert = false;
			}, 3000);
			await invalidateAll();
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to update role';
			setTimeout(() => {
				errorAlert = false;
			}, 3000);
		}
	}

	async function removeTeamMember(userId: string) {
		if (
			!confirm(
				'Are you sure you want to remove this team member? They will no longer have access to this store.'
			)
		) {
			return;
		}

		const formData = new FormData();
		formData.append('userId', userId);

		const response = await fetch('?/removeTeamMember', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();

		if (result.type === 'success') {
			successAlert = true;
			successMessage = 'Team member removed successfully!';
			setTimeout(() => {
				successAlert = false;
			}, 3000);
			await invalidateAll();
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to remove team member';
			setTimeout(() => {
				errorAlert = false;
			}, 3000);
		}
	}

	async function updateGlobalAdminAccess(userId: string, mode: 'grant' | 'remove') {
		const restaurantId = selectedStoreByUser[userId];
		if (!restaurantId) {
			errorAlert = true;
			errorMessage = 'Select a store first';
			setTimeout(() => (errorAlert = false), 3000);
			return;
		}

		const formData = new FormData();
		formData.append('userId', userId);
		formData.append('restaurantId', restaurantId);
		formData.append('mode', mode);

		const response = await fetch('?/updateUserAdminAccess', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		if (result.type === 'success') {
			successAlert = true;
			successMessage = result.data?.message || 'Admin access updated successfully!';
			setTimeout(() => (successAlert = false), 3000);
			await invalidateAll();
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to update admin access';
			setTimeout(() => (errorAlert = false), 3000);
		}
	}

	async function toggleStoreSuperStatus(restaurantId: string, nextValue: boolean) {
		const formData = new FormData();
		formData.append('restaurantId', restaurantId);
		formData.append('isSuper', String(nextValue));

		const response = await fetch('?/toggleSuperStore', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		if (result.type === 'success') {
			successAlert = true;
			successMessage = result.data?.message || 'Store tier updated successfully!';
			setTimeout(() => (successAlert = false), 3000);
			await invalidateAll();
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to update store tier';
			setTimeout(() => (errorAlert = false), 3000);
		}
	}

	async function toggleGlobalSuperUser(userId: string, nextValue: boolean) {
		const formData = new FormData();
		formData.append('userId', userId);
		formData.append('isSuper', String(nextValue));

		const response = await fetch('?/toggleSuperUser', {
			method: 'POST',
			body: formData
		});

		const result = await response.json();
		if (result.type === 'success') {
			successAlert = true;
			successMessage = result.data?.message || 'Super access updated successfully!';
			setTimeout(() => (successAlert = false), 3000);
			await invalidateAll();
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to update super access';
			setTimeout(() => (errorAlert = false), 3000);
		}
	}
</script>

<svelte:head>
	<title>Store Settings - {restaurant?.name || 'Proxifeast'} Admin</title>
</svelte:head>

<Notification show={successAlert} type="success" title="Success!" message={successMessage} />

<Notification show={errorAlert} type="error" title="Error" message={errorMessage} />

<div class="min-h-screen bg-slate-50">
	<header class="bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-2xl font-bold text-slate-900">Store Settings</h1>
					<p class="mt-1 text-sm text-slate-600">Manage your store's configuration and team</p>
				</div>
				<div class="flex items-center gap-3">
					{#if isSuper}
						<button
							type="button"
							onclick={() => (showNewRestaurantModal = true)}
							class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
						>
							+ Add Store
						</button>
						{#if restaurants.length > 1}
							<select
								value={currentRestaurantId}
								onchange={(e) => switchRestaurant(e.currentTarget.value)}
								class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							>
								{#each restaurants as rest}
									<option value={rest.id}>{rest.name}</option>
								{/each}
							</select>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
		{#if !restaurant}
			<div class="rounded-lg bg-white p-6 text-center shadow">
				<p class="text-slate-600">Unable to load store settings.</p>
			</div>
		{:else}
			<!-- Order Services Section -->
			<div class="rounded-lg bg-white shadow">
				<div class="border-b border-slate-200 px-6 py-4">
					<h2 class="text-lg font-semibold text-slate-900">Order Services</h2>
					<p class="mt-1 text-sm text-slate-600">
						Configure which order services your store offers to customers
					</p>
				</div>

				<form
					method="POST"
					action="?/updateOrderServices"
					onsubmit={submitOrderServices}
					class="p-6"
				>
					<input type="hidden" name="restaurantId" value={currentRestaurantId} />
					<div class="space-y-6">
						<div class="flex items-center justify-between rounded-lg border border-slate-200 p-4">
							<div>
								<h3 class="font-medium text-slate-900">Table Service</h3>
								<p class="text-sm text-slate-600">Customers can order from their table</p>
							</div>
							<label class="relative inline-flex cursor-pointer items-center">
								<input
									type="checkbox"
									name="tableService"
									class="peer sr-only"
									bind:checked={tableServiceEnabled}
								/>
								<div
									class="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-amber-500 peer-focus:ring-2 peer-focus:ring-amber-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
								></div>
							</label>
						</div>

						<div class="flex items-center justify-between rounded-lg border border-slate-200 p-4">
							<div>
								<h3 class="font-medium text-slate-900">Pickup</h3>
								<p class="text-sm text-slate-600">
									Customers can order for pickup at the store
								</p>
							</div>
							<label class="relative inline-flex cursor-pointer items-center">
								<input
									type="checkbox"
									name="pickup"
									class="peer sr-only"
									bind:checked={pickupEnabled}
								/>
								<div
									class="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-amber-500 peer-focus:ring-2 peer-focus:ring-amber-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
								></div>
							</label>
						</div>

						<div class="flex items-center justify-between rounded-lg border border-slate-200 p-4">
							<div>
								<h3 class="font-medium text-slate-900">Home Delivery</h3>
								<p class="text-sm text-slate-600">
									Customers can order for delivery to their address
								</p>
							</div>
							<label class="relative inline-flex cursor-pointer items-center">
								<input
									type="checkbox"
									name="homeDelivery"
									class="peer sr-only"
									bind:checked={homeDeliveryEnabled}
								/>
								<div
									class="peer h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-amber-500 peer-focus:ring-2 peer-focus:ring-amber-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
								></div>
							</label>
						</div>
					</div>

					<div class="mt-6 flex justify-end">
						<button
							type="submit"
							disabled={!orderServicesChanged}
							class="rounded-lg px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 {orderServicesChanged
								? 'bg-amber-500 text-white hover:bg-amber-600'
								: 'cursor-not-allowed bg-slate-200 text-slate-400'}"
						>
							Save Settings
						</button>
					</div>
				</form>
			</div>

			{#if isSuper}
				<!-- Super Stores Management -->
				<div class="rounded-2xl bg-white shadow">
					<button
						type="button"
						onclick={() => (storesExpanded = !storesExpanded)}
						class="flex w-full items-center justify-between border-b border-slate-200 px-6 py-4 text-left transition-colors hover:bg-slate-50"
					>
						<div>
							<h2 class="text-lg font-semibold text-slate-900">Super Stores Management</h2>
							<p class="mt-1 text-sm text-slate-600">Review every registered store, its tier, and the admins assigned to it.</p>
						</div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 {storesExpanded ? 'rotate-180' : ''}"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>

					{#if storesExpanded}
						<div class="space-y-6 p-6">
							<div class="grid gap-4 sm:grid-cols-3">
								<div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
									<p class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Registered Stores</p>
									<p class="mt-2 text-3xl font-bold text-slate-900">{managedStores.length}</p>
								</div>
								<div class="rounded-xl border border-purple-200 bg-purple-50 p-4">
									<p class="text-xs font-semibold tracking-wider text-purple-500 uppercase">Super Stores</p>
									<p class="mt-2 text-3xl font-bold text-purple-900">{managedStores.filter((s) => s.isSuper).length}</p>
								</div>
								<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
									<p class="text-xs font-semibold tracking-wider text-emerald-500 uppercase">Admin Assignments</p>
									<p class="mt-2 text-3xl font-bold text-emerald-900">{managedStores.reduce((sum, s) => sum + s.adminCount, 0)}</p>
								</div>
							</div>

							{#if managedStores.length > 4}
								<div class="relative">
									<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
									</svg>
									<input
										type="text"
										bind:value={storeSearchQuery}
										placeholder="Search stores by name, domain, or type..."
										class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
									/>
								</div>
							{/if}

							{#if managedStores.length === 0}
								<p class="py-8 text-center text-slate-400">No stores registered yet.</p>
							{:else}
								<div class="grid gap-4 md:grid-cols-2">
									{#each filteredManagedStores as store}
										<div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
											<div class="flex items-start justify-between gap-3">
												<div class="min-w-0 flex-1">
													<div class="flex items-center gap-2">
														<h3 class="truncate text-base font-semibold text-slate-900">{store.name}</h3>
														{#if store.isSuper}
															<span class="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">SUPER</span>
														{/if}
													</div>
													<p class="mt-0.5 truncate text-sm text-slate-500">{store.domain || 'No domain set'}</p>
												</div>
												<label class="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200">
													<input
														type="checkbox"
														checked={store.isSuper}
														onchange={(e) => toggleStoreSuperStatus(store.id, e.currentTarget.checked)}
														class="toggle toggle-xs"
													/>
													<span>{store.isSuper ? 'Super' : 'Regular'}</span>
												</label>
											</div>

											<div class="mt-3 flex items-center gap-4 text-sm">
												<span class="text-slate-400">{store.type}</span>
												<span class="text-slate-300">|</span>
												<span class="text-slate-600">{store.adminCount} admin{store.adminCount !== 1 ? 's' : ''}</span>
												<span class="text-slate-300">|</span>
												<span class="text-slate-600">{store.memberCount} member{store.memberCount !== 1 ? 's' : ''}</span>
											</div>

											{#if store.adminUsers.length > 0}
												<div class="mt-3 flex flex-wrap gap-1.5">
													{#each store.adminUsers as admin}
														<span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">{admin.name} <span class="text-emerald-600">&middot; {admin.role}</span></span>
													{/each}
												</div>
											{:else}
												<p class="mt-3 text-xs text-slate-400">No admin assigned yet</p>
											{/if}
										</div>
									{/each}
								</div>

								{#if storeSearchQuery && filteredManagedStores.length === 0}
									<p class="py-4 text-center text-sm text-slate-400">No stores match "{storeSearchQuery}"</p>
								{/if}
							{/if}
						</div>
					{/if}
				</div>

				<!-- Global User Access -->
				<div class="rounded-2xl bg-white shadow">
					<button
						type="button"
						onclick={() => (usersExpanded = !usersExpanded)}
						class="flex w-full items-center justify-between border-b border-slate-200 px-6 py-4 text-left transition-colors hover:bg-slate-50"
					>
						<div>
							<h2 class="text-lg font-semibold text-slate-900">Global User Access</h2>
							<p class="mt-1 text-sm text-slate-600">View every user, promote them into store admins, and manage super-admin access.</p>
						</div>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 {usersExpanded ? 'rotate-180' : ''}"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>

					{#if usersExpanded}
						<div class="space-y-5 p-6">
							{#if globalUsers.length > 3}
								<div class="relative">
									<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
									</svg>
									<input
										type="text"
										bind:value={userSearchQuery}
										placeholder="Search users by name, email, or role..."
										class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
									/>
								</div>
							{/if}

							{#if globalUsers.length === 0}
								<p class="py-8 text-center text-slate-400">No users found.</p>
							{:else if userSearchQuery && filteredGlobalUsers.length === 0}
								<p class="py-4 text-center text-sm text-slate-400">No users match "{userSearchQuery}"</p>
							{:else}
								{#each filteredGlobalUsers as member}
									<div class="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
										<div class="flex items-start gap-4">
											<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-white">
												{member.name?.charAt(0).toUpperCase() || 'U'}
											</div>
											<div class="min-w-0 flex-1">
												<div class="flex flex-wrap items-center gap-2">
													<p class="font-semibold text-slate-900">{member.name || 'Unnamed User'}</p>
													{#if member.id === currentUserId}
														<span class="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white">You</span>
													{/if}
													{#if member.isSuperUser}
														<span class="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">Super Admin</span>
													{/if}
													<span class="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600">{member.role}</span>
												</div>
												<p class="mt-0.5 text-sm text-slate-500">{member.email || 'No email'}</p>

												<div class="mt-3 space-y-2">
													{#if member.adminRestaurants.length > 0}
														<div>
															<p class="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Admin Stores</p>
															<div class="flex flex-wrap gap-1.5">
																{#each member.adminRestaurants as store}
																	<span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">{store.name}</span>
																{/each}
															</div>
														</div>
													{/if}
													{#if member.memberRestaurants.length > 0}
														<div>
															<p class="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Memberships</p>
															<div class="flex flex-wrap gap-1.5">
																{#each member.memberRestaurants as store}
																	<span class="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">{store.name}</span>
																{/each}
															</div>
														</div>
													{/if}
												</div>
											</div>
										</div>

										<div class="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
											<div class="flex-1">
												<p class="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Target Store</p>
												<select
													bind:value={selectedStoreByUser[member.id]}
													aria-label={`Target store for ${member.name || member.email}`}
													class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
												>
													{#each managedStores as store}
														<option value={store.id}>{store.name}</option>
													{/each}
												</select>
											</div>

											<div class="flex items-center gap-2">
												<button
													type="button"
													onclick={() => updateGlobalAdminAccess(member.id, 'grant')}
													class="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
												>
													Make Admin
												</button>
												<button
													type="button"
													onclick={() => updateGlobalAdminAccess(member.id, 'remove')}
													class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
												>
													Remove Admin
												</button>
											</div>

											<label class="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
												<input
													type="checkbox"
													checked={member.isSuperUser}
													onchange={(e) => toggleGlobalSuperUser(member.id, e.currentTarget.checked)}
													class="toggle toggle-xs"
												/>
												<span>Super</span>
											</label>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class="rounded-2xl bg-white shadow">
					<div class="border-b border-slate-200 px-6 py-4">
						<h2 class="text-lg font-semibold text-slate-900">Team Management</h2>
						<p class="mt-1 text-sm text-slate-600">See every admin on this store, review their role, and keep your team organized.</p>
					</div>

					<div class="grid gap-4 p-6 md:grid-cols-4">
						<div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
							<p class="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">Admin Team Size</p>
							<p class="mt-2 text-3xl font-bold text-slate-900">{teamMembers.length}</p>
						</div>
						<div class="rounded-2xl border border-blue-200 bg-blue-50 p-4">
							<p class="text-xs font-semibold tracking-[0.18em] text-blue-500 uppercase">Owners</p>
							<p class="mt-2 text-3xl font-bold text-blue-900">{teamMembers.filter((member) => member.role === 'owner').length}</p>
						</div>
						<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
							<p class="text-xs font-semibold tracking-[0.18em] text-emerald-500 uppercase">Managers</p>
							<p class="mt-2 text-3xl font-bold text-emerald-900">{teamMembers.filter((member) => member.role === 'manager').length}</p>
						</div>
					</div>

					<div class="grid gap-4 px-6 pb-6 lg:grid-cols-2">
						{#if teamMembers.length === 0}
							<p class="py-6 text-center text-slate-500 lg:col-span-2">No team members found.</p>
						{:else}
							{#each teamMembers as member}
								<div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
									<div class="flex items-start justify-between gap-4">
										<div class="flex items-center gap-3">
											<div class="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 font-medium text-amber-700">{member.name?.charAt(0).toUpperCase() || 'U'}</div>
											<div>
												<p class="font-semibold text-slate-900">{member.name || 'Unknown'} {#if member.id === currentUserId}<span class="text-xs text-slate-500">(You)</span>{/if}</p>
												<p class="text-sm text-slate-500">{member.email || 'N/A'}</p>
											</div>
										</div>
										<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold {getRoleBadgeClass(member.role)}">{member.role || 'manager'}</span>
									</div>

									<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										{#if member.id === currentUserId}
											<p class="text-sm text-slate-500">You can see your permissions but cannot change your own role here.</p>
										{:else}
											<select value={member.role || 'manager'} onchange={(e) => updateRole(member.id, e.currentTarget.value)} class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none">
												<option value="owner">Owner</option>
												<option value="manager">Manager</option>
												<option value="kitchen">Kitchen</option>
												<option value="waiter">Waiter</option>
											</select>
											<button onclick={() => removeTeamMember(member.id)} class="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Remove from Team</button>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>

					<div class="mx-6 mb-6 rounded-2xl bg-slate-50 p-4">
						<h3 class="mb-2 text-sm font-medium text-slate-900">Role Permissions</h3>
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
							<div><p class="font-medium text-purple-700">Owner</p><p class="text-slate-600">Full access, can manage billing, remove team members</p></div>
							<div><p class="font-medium text-blue-700">Manager</p><p class="text-slate-600">Can manage orders, menu, team roles, analytics</p></div>
							<div><p class="font-medium text-orange-700">Kitchen</p><p class="text-slate-600">Can view/manage orders, view menu, today's menu</p></div>
							<div><p class="font-medium text-green-700">Waiter</p><p class="text-slate-600">Can view/manage orders, view menu</p></div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Setup Inquiries Section (Super Admin Only) -->
			{#if isSuper && setupInquiries.length > 0}
				<div class="rounded-lg bg-white shadow">
					<div class="border-b border-slate-200 px-6 py-4">
						<h2 class="text-lg font-semibold text-slate-900">Setup Inquiries</h2>
						<p class="mt-1 text-sm text-slate-600">Hardware setup requests from stores</p>
					</div>
					<div class="p-6">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b border-slate-200">
										<th class="pb-3 text-left text-sm font-medium text-slate-600">Store</th>
										<th class="pb-3 text-left text-sm font-medium text-slate-600">Contact</th>
										<th class="pb-3 text-left text-sm font-medium text-slate-600">Package</th>
										<th class="pb-3 text-left text-sm font-medium text-slate-600">Status</th>
										<th class="pb-3 text-left text-sm font-medium text-slate-600">Date</th>
										<th class="pb-3 text-right text-sm font-medium text-slate-600">Actions</th>
									</tr>
								</thead>
								<tbody>
									{#each setupInquiries as inquiry}
										<tr class="border-b border-slate-100">
											<td class="py-3">
												<p class="font-medium text-slate-900">{inquiry.restaurantName}</p>
												<p class="text-xs text-slate-500">{inquiry.location}</p>
											</td>
											<td class="py-3">
												<p class="text-sm text-slate-700">{inquiry.contactName}</p>
												<p class="text-xs text-slate-500">{inquiry.phone}</p>
											</td>
											<td class="py-3">
												<span
													class="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 capitalize"
												>
													{inquiry.package}
												</span>
											</td>
											<td class="py-3">
												<span
													class="rounded-full px-2 py-1 text-xs font-medium capitalize {inquiry.status ===
													'pending'
														? 'bg-yellow-100 text-yellow-700'
														: inquiry.status === 'contacted'
															? 'bg-blue-100 text-blue-700'
															: 'bg-green-100 text-green-700'}"
												>
													{inquiry.status}
												</span>
											</td>
											<td class="py-3 text-sm text-slate-500">
												{new Date(inquiry.created).toLocaleDateString()}
											</td>
											<td class="py-3 text-right">
												<select
													value={inquiry.status}
													onchange={(e) => updateInquiryStatus(inquiry.id, e.currentTarget.value)}
													class="rounded border border-slate-300 px-2 py-1 text-xs"
												>
													<option value="pending">Pending</option>
													<option value="contacted">Contacted</option>
													<option value="completed">Completed</option>
													<option value="cancelled">Cancelled</option>
												</select>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			{/if}

			<!-- Store Info Section -->
			<div class="rounded-lg bg-white shadow">
				<div class="border-b border-slate-200 px-6 py-4">
					<h2 class="text-lg font-semibold text-slate-900">Store Information</h2>
					<p class="mt-1 text-sm text-slate-600">Edit your store details</p>
				</div>

				<form
					method="POST"
					action="?/updateRestaurantInfo"
					onsubmit={submitRestaurantInfo}
					class="p-6"
				>
					<input type="hidden" name="restaurantId" value={currentRestaurantId} />
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label for="name" class="block text-sm font-medium text-slate-700"
								>Store Name</label
							>
							<input
								type="text"
								name="name"
								id="name"
								bind:value={restName}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="domain" class="block text-sm font-medium text-slate-700">Domain</label>
							<input
								type="text"
								name="domain"
								id="domain"
								bind:value={restDomain}
								placeholder="e.g., mystore.com"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="category" class="block text-sm font-medium text-slate-700">Category</label
							>
							<input
								type="text"
								name="category"
								id="category"
								bind:value={restCategory}
								placeholder="e.g., Italian, Chinese, Fast Food"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="motto" class="block text-sm font-medium text-slate-700">Motto</label>
							<input
								type="text"
								name="motto"
								id="motto"
								bind:value={restMotto}
								placeholder="e.g., Best food in town"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div class="sm:col-span-2">
							<label for="description" class="block text-sm font-medium text-slate-700"
								>Description</label
							>
							<textarea
								name="description"
								id="description"
								bind:value={restDescription}
								rows="3"
								placeholder="Tell customers about your store..."
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							></textarea>
						</div>
						<div>
							<label for="openingTime" class="block text-sm font-medium text-slate-700"
								>Opening Time</label
							>
							<input
								type="time"
								name="openingTime"
								id="openingTime"
								bind:value={restOpeningTime}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="closingTime" class="block text-sm font-medium text-slate-700"
								>Closing Time</label
							>
							<input
								type="time"
								name="closingTime"
								id="closingTime"
								bind:value={restClosingTime}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="phone" class="block text-sm font-medium text-slate-700"
								>Phone Number</label
							>
							<input
								type="tel"
								name="phone"
								id="phone"
								bind:value={restPhone}
								placeholder="e.g., +1234567890"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="address" class="block text-sm font-medium text-slate-700">Address</label>
							<input
								type="text"
								name="address"
								id="address"
								bind:value={restAddress}
								placeholder="Store address"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="state" class="block text-sm font-medium text-slate-700">State</label>
							<input
								type="text"
								name="state"
								id="state"
								bind:value={restState}
								placeholder="e.g., Lagos"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="localGovernment" class="block text-sm font-medium text-slate-700"
								>Local Government Area</label
							>
							<input
								type="text"
								name="localGovernment"
								id="localGovernment"
								bind:value={restLGA}
								placeholder="e.g., Ikeja"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
						<p class="block text-sm font-medium text-slate-700">Image</p>
							{#if restImageUrl}
								<div class="relative mt-1 mb-2">
									<img
										src={restImageUrl}
									alt="Store"
										class="h-32 w-full rounded-lg object-cover"
									/>
									<div class="absolute right-2 bottom-2 flex gap-1">
										<button
											type="button"
											onclick={() => openImageCropper('image')}
											class="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white"
										>
											Change
										</button>
										<button
											type="button"
											onclick={() => removeImage('image')}
											class="rounded-lg bg-red-500/90 px-2 py-1 text-xs font-medium text-white shadow hover:bg-red-600"
										>
											Remove
										</button>
									</div>
								</div>
							{:else}
								<button
									type="button"
									id="restaurant-image-trigger"
									onclick={() => openImageCropper('image')}
									class="mt-1 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-amber-500 hover:text-amber-500"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mr-2 h-5 w-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									Upload Image (600×600)
								</button>
							{/if}
							<input type="hidden" name="imageUrl" value={restImageUrl} />
						</div>
						<div>
						<p class="block text-sm font-medium text-slate-700">Logo</p>
							{#if restLogoUrl}
								<div class="relative mt-1 mb-2 flex justify-center">
									<img
										src={restLogoUrl}
										alt="Logo"
										class="h-24 w-24 rounded-lg bg-slate-50 object-contain"
									/>
									<div class="absolute right-2 bottom-2 flex gap-1">
										<button
											type="button"
											onclick={() => openImageCropper('logo')}
											class="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white"
										>
											Change
										</button>
										<button
											type="button"
											onclick={() => removeImage('logo')}
											class="rounded-lg bg-red-500/90 px-2 py-1 text-xs font-medium text-white shadow hover:bg-red-600"
										>
											Remove
										</button>
									</div>
								</div>
							{:else}
								<button
									type="button"
									id="restaurant-logo-trigger"
									onclick={() => openImageCropper('logo')}
									class="mt-1 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-amber-500 hover:text-amber-500"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mr-2 h-5 w-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									Upload Logo (600×600)
								</button>
							{/if}
							<input type="hidden" name="logoUrl" value={restLogoUrl} />
						</div>
						<div class="sm:col-span-2">
							<p class="block text-sm font-medium text-slate-700">Banner</p>
							{#if restBannerUrl}
								<div class="relative mt-1 mb-2">
									<img
										src={restBannerUrl}
										alt="Banner"
										class="h-32 w-full rounded-lg object-cover"
									/>
									<div class="absolute right-2 bottom-2 flex gap-1">
										<button
											type="button"
											onclick={() => openImageCropper('banner')}
											class="rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow hover:bg-white"
										>
											Change
										</button>
										<button
											type="button"
											onclick={() => removeImage('banner')}
											class="rounded-lg bg-red-500/90 px-2 py-1 text-xs font-medium text-white shadow hover:bg-red-600"
										>
											Remove
										</button>
									</div>
								</div>
							{:else}
								<button
									type="button"
									id="restaurant-banner-trigger"
									onclick={() => openImageCropper('banner')}
									class="mt-1 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-amber-500 hover:text-amber-500"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="mr-2 h-5 w-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									Upload Banner (1920×1080)
								</button>
							{/if}
							<input type="hidden" name="bannerUrl" value={restBannerUrl} />
						</div>
					</div>

					<!-- Save Button -->
					<div class="mt-6 flex justify-end">
						<button
							type="submit"
							class="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
							disabled={!restaurantInfoChanged}
						>
							Save Changes
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Gallery Section -->
		{#if restaurant}
			<div class="mt-8 rounded-xl border border-slate-200 bg-white p-6">
				<div class="mb-6 flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-slate-900">Gallery Images</h2>
						<p class="mt-1 text-sm text-slate-600">
							Add photos to showcase your store ambiance
						</p>
					</div>
					{#if galleryChanged}
						<button
							type="submit"
							form="gallery-form"
							class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
						>
							Save Gallery
						</button>
					{/if}
				</div>

				<form id="gallery-form" onsubmit={submitGallery}>
					<input type="hidden" name="restaurantId" value={currentRestaurantId} />
					<input type="hidden" name="galleryImages" value={JSON.stringify(galleryImages)} />
				</form>

				<!-- Gallery Grid -->
				<div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{#each galleryImages as image, index}
						<div
							class="group relative aspect-square overflow-hidden rounded-lg border border-slate-200"
						>
							<img src={image} alt="Gallery {index + 1}" class="h-full w-full object-cover" />
							<button
								type="button"
								onclick={() => removeGalleryImage(index)}
								aria-label={`Remove gallery image ${index + 1}`}
								class="absolute top-1 right-1 rounded-full bg-red-500 p-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-white"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M18 6L6 18M6 6l12 12" />
								</svg>
							</button>
						</div>
					{/each}

					<!-- Add Image Button -->
					<button
						type="button"
						onclick={openGalleryCropper}
						class="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mb-2 h-8 w-8"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 5v14M5 12h14" />
						</svg>
						<span class="text-sm">Add Photo</span>
					</button>
				</div>

				<p class="text-xs text-slate-500">
					Tip: Add up to 12 photos. Recommended size: 800x600 pixels.
				</p>
			</div>
		{/if}
	</main>

	<!-- Image Cropper Modal -->
	{#if showImageCropper}
		<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
			<div class="w-full max-w-2xl rounded-2xl bg-white p-6">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-slate-900">
						{cropperType === 'image'
							? 'Upload Restaurant Image'
							: cropperType === 'logo'
								? 'Upload Logo'
								: cropperType === 'gallery'
									? 'Add Gallery Image'
									: 'Upload Banner'}
					</h3>
					<button
						onclick={() => (showImageCropper = false)}
						aria-label="Close image cropper"
						class="rounded-lg p-2 hover:bg-slate-100"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				<ImageCropper
					uploadType={cropperType === 'logo' || cropperType === 'gallery' ? 'gallery' : cropperType}
					initialImage={cropperType === 'image'
						? restImageUrl
						: cropperType === 'logo'
							? restLogoUrl
							: cropperType === 'gallery'
								? ''
								: restBannerUrl}
					onCropComplete={handleImageCropWithGallery}
					onCancel={() => (showImageCropper = false)}
				/>
			</div>
		</div>
	{/if}

	<Footer restaurant={$page.data.restaurant} />
</div>

<!-- New Restaurant Modal -->
{#if showNewRestaurantModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
			<div class="sticky top-0 border-b border-slate-200 bg-white px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-bold text-slate-900">Add New Store</h2>
						<p class="mt-1 text-sm text-slate-500">Fill in the store details below</p>
					</div>
					<button
						onclick={() => (showNewRestaurantModal = false)}
						aria-label="Close new store modal"
						class="rounded-lg p-2 hover:bg-slate-100"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<form onsubmit={createRestaurant} class="p-6">
				<!-- Basic Information Section -->
				<div class="mb-6">
					<h3 class="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
						Basic Information
					</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="md:col-span-2">
							<label for="new-name" class="block text-sm font-medium text-slate-700"
								>Store Name <span class="text-red-500">*</span></label
							>
							<input
								type="text"
								id="new-name"
								bind:value={newRestaurantForm.name}
								required
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., The Italian Bistro"
							/>
						</div>

						<div>
							<label for="new-type" class="block text-sm font-medium text-slate-700"
								>Store Type <span class="text-red-500">*</span></label
							>
							<select
								id="new-type"
								bind:value={newRestaurantForm.type}
								required
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
							>
								<option value="restaurant">Restaurant</option>
								<option value="hotel">Hotel</option>
								<option value="bar">Bar</option>
								<option value="cafe">Café</option>
							</select>
						</div>

						<div>
							<label for="new-domain" class="block text-sm font-medium text-slate-700"
								>Domain <span class="text-red-500">*</span></label
							>
							<input
								type="text"
								id="new-domain"
								bind:value={newRestaurantForm.domain}
								required
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., italianbistro.com"
							/>
							<p class="mt-1 text-xs text-slate-500">
								The domain name for the store's website
							</p>
						</div>

						<div>
							<label for="new-slug" class="block text-sm font-medium text-slate-700">Slug</label>
							<input
								type="text"
								id="new-slug"
								bind:value={newRestaurantForm.slug}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., italian-bistro"
							/>
						</div>

						<div>
							<label for="new-category" class="block text-sm font-medium text-slate-700"
								>Category</label
							>
							<input
								type="text"
								id="new-category"
								bind:value={newRestaurantForm.category}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., Italian, Chinese, Fast Food"
							/>
						</div>

						<div>
							<label for="new-motto" class="block text-sm font-medium text-slate-700">Motto</label>
							<input
								type="text"
								id="new-motto"
								bind:value={newRestaurantForm.motto}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., Authentic Italian Cuisine"
							/>
						</div>

						<div class="md:col-span-2">
							<label for="new-description" class="block text-sm font-medium text-slate-700"
								>Description</label
							>
							<textarea
								id="new-description"
								bind:value={newRestaurantForm.description}
								rows="3"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="Describe your store..."
							></textarea>
						</div>
					</div>
				</div>

				<!-- Contact Information Section -->
				<div class="mb-6 border-t border-slate-200 pt-6">
					<h3 class="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
						Contact Information
					</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="new-email" class="block text-sm font-medium text-slate-700">Email</label>
							<input
								type="email"
								id="new-email"
								bind:value={newRestaurantForm.email}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., info@italianbistro.com"
							/>
						</div>

						<div>
							<label for="new-phone" class="block text-sm font-medium text-slate-700">Phone</label>
							<input
								type="tel"
								id="new-phone"
								bind:value={newRestaurantForm.phone}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., +2348012345678"
							/>
						</div>

						<div>
							<label for="new-state" class="block text-sm font-medium text-slate-700">State</label>
							<input
								type="text"
								id="new-state"
								bind:value={newRestaurantForm.state}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., Lagos"
							/>
						</div>

						<div>
							<label for="new-lga" class="block text-sm font-medium text-slate-700"
								>Local Government Area</label
							>
							<input
								type="text"
								id="new-lga"
								bind:value={newRestaurantForm.localGovernment}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="e.g., Ikeja"
							/>
						</div>

						<div class="md:col-span-2">
							<label for="new-address" class="block text-sm font-medium text-slate-700"
								>Address</label
							>
							<textarea
								id="new-address"
								bind:value={newRestaurantForm.address}
								rows="2"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="Full store address"
							></textarea>
						</div>
					</div>
				</div>

				<!-- Business Hours Section -->
				<div class="mb-6 border-t border-slate-200 pt-6">
					<h3 class="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
						Business Hours
					</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="new-openingTime" class="block text-sm font-medium text-slate-700"
								>Opening Time</label
							>
							<input
								type="time"
								id="new-openingTime"
								bind:value={newRestaurantForm.openingTime}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
							/>
						</div>

						<div>
							<label for="new-closingTime" class="block text-sm font-medium text-slate-700"
								>Closing Time</label
							>
							<input
								type="time"
								id="new-closingTime"
								bind:value={newRestaurantForm.closingTime}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<!-- Pricing & Delivery Section -->
				<div class="mb-6 border-t border-slate-200 pt-6">
					<h3 class="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
						Pricing & Delivery
					</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							<label for="new-serviceFee" class="block text-sm font-medium text-slate-700"
								>Service Fee (₦)</label
							>
							<input
								type="number"
								id="new-serviceFee"
								bind:value={newRestaurantForm.serviceFee}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="0"
								min="0"
							/>
						</div>

						<div>
							<label for="new-deliveryFeePerKm" class="block text-sm font-medium text-slate-700"
								>Delivery Fee per Km (₦)</label
							>
							<input
								type="number"
								id="new-deliveryFeePerKm"
								bind:value={newRestaurantForm.deliveryFeePerKm}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="0"
								min="0"
							/>
						</div>

						<div>
							<label for="new-maxDeliveryRadius" class="block text-sm font-medium text-slate-700"
								>Max Delivery Radius (km)</label
							>
							<input
								type="number"
								id="new-maxDeliveryRadius"
								bind:value={newRestaurantForm.maxDeliveryRadius}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
								placeholder="10"
								min="0"
							/>
						</div>
					</div>
				</div>

				<!-- Services Section -->
				<div class="mb-6 border-t border-slate-200 pt-6">
					<h3 class="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
						Services
					</h3>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<input
								type="checkbox"
								id="new-hasReservation"
								bind:checked={newRestaurantForm.hasReservation}
								class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
							/>
							<label for="new-hasReservation" class="text-sm text-slate-700"
								>Accept Table Reservations</label
							>
						</div>
						<div class="flex items-center gap-3">
							<input
								type="checkbox"
								id="new-hasRoomService"
								bind:checked={newRestaurantForm.hasRoomService}
								class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
							/>
							<label for="new-hasRoomService" class="text-sm text-slate-700"
								>Room Service (for Hotels)</label
							>
						</div>
					</div>
				</div>

				<!-- Settings Section -->
				<div class="mb-6 border-t border-slate-200 pt-6">
					<h3 class="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
						Settings
					</h3>
					<div class="flex items-center gap-3">
						<input
							type="checkbox"
							id="new-isSuper"
							bind:checked={newRestaurantForm.isSuper}
							class="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
						/>
						<label for="new-isSuper" class="text-sm text-slate-700"
							>This is a Super Store (can manage other stores)</label
						>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex justify-end gap-3 border-t border-slate-200 pt-6">
					<button
						type="button"
						onclick={() => (showNewRestaurantModal = false)}
						class="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={creatingRestaurant}
						class="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
					>
						{creatingRestaurant ? 'Creating...' : 'Create Store'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
