<script lang="ts">
	import { page } from '$app/stores';
	import Notification from '$lib/Notification.svelte';
	import Footer from '$lib/Footer.svelte';

	let { data } = $props();
	const restaurant = data?.restaurant;
	const orderServices = data?.orderServices ?? {
		tableService: true,
		pickup: true,
		homeDelivery: true
	};
	const teamMembers = data?.teamMembers ?? [];
	const currentUserId = $page.data.user?.id;

	let successAlert = $state(false);
	let errorAlert = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

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
			window.location.reload();
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
				'Are you sure you want to remove this team member? They will no longer have access to this restaurant.'
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
			window.location.reload();
		} else {
			errorAlert = true;
			errorMessage = result.data?.error || 'Failed to remove team member';
			setTimeout(() => {
				errorAlert = false;
			}, 3000);
		}
	}
</script>

<svelte:head>
	<title>Restaurant Settings - {restaurant?.name || 'Proxifeast'} Admin</title>
</svelte:head>

<Notification show={successAlert} type="success" title="Success!" message={successMessage} />

<Notification show={errorAlert} type="error" title="Error" message={errorMessage} />

<div class="min-h-screen bg-slate-50">
	<header class="bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-slate-900">Restaurant Settings</h1>
			<p class="mt-1 text-sm text-slate-600">Manage your restaurant's configuration and team</p>
		</div>
	</header>

	<main class="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
		{#if !restaurant}
			<div class="rounded-lg bg-white p-6 text-center shadow">
				<p class="text-slate-600">Unable to load restaurant settings.</p>
			</div>
		{:else}
			<!-- Order Services Section -->
			<div class="rounded-lg bg-white shadow">
				<div class="border-b border-slate-200 px-6 py-4">
					<h2 class="text-lg font-semibold text-slate-900">Order Services</h2>
					<p class="mt-1 text-sm text-slate-600">
						Configure which order services your restaurant offers to customers
					</p>
				</div>

				<form method="POST" action="?/updateOrderServices" class="p-6">
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
									checked={orderServices.tableService}
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
									Customers can order for pickup at the restaurant
								</p>
							</div>
							<label class="relative inline-flex cursor-pointer items-center">
								<input
									type="checkbox"
									name="pickup"
									class="peer sr-only"
									checked={orderServices.pickup}
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
									checked={orderServices.homeDelivery}
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
							class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
						>
							Save Settings
						</button>
					</div>
				</form>
			</div>

			<!-- Team Management Section -->
			<div class="rounded-lg bg-white shadow">
				<div class="border-b border-slate-200 px-6 py-4">
					<h2 class="text-lg font-semibold text-slate-900">Team Management</h2>
					<p class="mt-1 text-sm text-slate-600">
						Manage team members and their roles for this restaurant
					</p>
				</div>

				<div class="p-6">
					{#if teamMembers.length === 0}
						<p class="py-4 text-center text-slate-500">No team members found.</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-slate-200">
								<thead class="bg-slate-50">
									<tr>
										<th
											class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
										>
											Member
										</th>
										<th
											class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
										>
											Email
										</th>
										<th
											class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
										>
											Role
										</th>
										<th
											class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
										>
											Actions
										</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-200 bg-white">
									{#each teamMembers as member}
										<tr>
											<td class="px-4 py-3 whitespace-nowrap">
												<div class="flex items-center">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 font-medium text-amber-700"
													>
														{member.name?.charAt(0).toUpperCase() || 'U'}
													</div>
													<span class="ml-3 text-sm font-medium text-slate-900">
														{member.name || 'Unknown'}
														{#if member.id === currentUserId}
															<span class="ml-1 text-xs text-slate-500">(You)</span>
														{/if}
													</span>
												</div>
											</td>
											<td class="px-4 py-3 text-sm whitespace-nowrap text-slate-600">
												{member.email || 'N/A'}
											</td>
											<td class="px-4 py-3 whitespace-nowrap">
												{#if member.id === currentUserId}
													<span
														class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold {getRoleBadgeClass(
															member.role
														)}"
													>
														{member.role || 'manager'}
													</span>
												{:else}
													<select
														value={member.role || 'manager'}
														onchange={(e) => updateRole(member.id, e.currentTarget.value)}
														class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
													>
														<option value="owner">Owner</option>
														<option value="manager">Manager</option>
														<option value="kitchen">Kitchen</option>
														<option value="waiter">Waiter</option>
													</select>
												{/if}
											</td>
											<td class="px-4 py-3 whitespace-nowrap">
												{#if member.id !== currentUserId}
													<button
														onclick={() => removeTeamMember(member.id)}
														class="text-sm font-medium text-red-600 hover:text-red-800"
													>
														Remove
													</button>
												{:else}
													<span class="text-sm text-slate-400">-</span>
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}

					<div class="mt-6 rounded-lg bg-slate-50 p-4">
						<h3 class="mb-2 text-sm font-medium text-slate-900">Role Permissions</h3>
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
							<div>
								<p class="font-medium text-purple-700">Owner</p>
								<p class="text-slate-600">Full access, can manage billing, remove team members</p>
							</div>
							<div>
								<p class="font-medium text-blue-700">Manager</p>
								<p class="text-slate-600">Can manage orders, menu, team roles, analytics</p>
							</div>
							<div>
								<p class="font-medium text-orange-700">Kitchen</p>
								<p class="text-slate-600">Can view/manage orders, view menu, today's menu</p>
							</div>
							<div>
								<p class="font-medium text-green-700">Waiter</p>
								<p class="text-slate-600">Can view/manage orders, view menu</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Restaurant Info Section -->
			<div class="rounded-lg bg-white shadow">
				<div class="border-b border-slate-200 px-6 py-4">
					<h2 class="text-lg font-semibold text-slate-900">Restaurant Information</h2>
					<p class="mt-1 text-sm text-slate-600">Edit your restaurant details</p>
				</div>

				<form method="POST" action="?/updateRestaurantInfo" class="p-6">
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<label for="name" class="block text-sm font-medium text-slate-700"
								>Restaurant Name</label
							>
							<input
								type="text"
								name="name"
								id="name"
								value={restaurant.name || ''}
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="domain" class="block text-sm font-medium text-slate-700">Domain</label>
							<input
								type="text"
								name="domain"
								id="domain"
								value={restaurant.domain || ''}
								placeholder="e.g., myrestaurant.com"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
						<div>
							<label for="openingTime" class="block text-sm font-medium text-slate-700"
								>Opening Time</label
							>
							<input
								type="time"
								name="openingTime"
								id="openingTime"
								value={restaurant.openingTime || ''}
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
								value={restaurant.closingTime || ''}
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
								value={restaurant.phone || ''}
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
								value={restaurant.address || ''}
								placeholder="Restaurant address"
								class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
							/>
						</div>
					</div>

					<div class="mt-6 flex justify-end">
						<button
							type="submit"
							class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
						>
							Save Restaurant Info
						</button>
					</div>
				</form>
			</div>
		{/if}
	</main>

	<Footer restaurant={$page.data.restaurant} />
</div>
