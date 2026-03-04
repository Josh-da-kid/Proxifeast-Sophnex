<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	const inquiries = data?.setupInquiries || [];

	let updating = $state<string | null>(null);
	let successMessage = $state('');
	let errorMessage = $state('');

	async function updateStatus(inquiryId: string, status: string) {
		updating = inquiryId;
		successMessage = '';
		errorMessage = '';

		const formData = new FormData();
		formData.append('inquiryId', inquiryId);
		formData.append('status', status);

		try {
			const response = await fetch('?/updateStatus', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				successMessage = 'Status updated successfully';
				await invalidateAll();
				setTimeout(() => (successMessage = ''), 3000);
			} else {
				errorMessage = result.data?.error || 'Failed to update status';
				setTimeout(() => (errorMessage = ''), 3000);
			}
		} catch (err) {
			errorMessage = 'An error occurred';
			setTimeout(() => (errorMessage = ''), 3000);
		} finally {
			updating = null;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'in_progress':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'completed':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Setup Inquiries | Proxifeast Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Setup Inquiries</h1>
			<p class="mt-2 text-gray-600">Manage and track restaurant setup requests</p>
		</div>

		<!-- Alerts -->
		{#if successMessage}
			<div class="mb-6 rounded-md border border-green-200 bg-green-50 p-4">
				<div class="flex">
					<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<p class="ml-3 text-sm font-medium text-green-800">{successMessage}</p>
				</div>
			</div>
		{/if}

		{#if errorMessage}
			<div class="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
				<div class="flex">
					<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
					<p class="ml-3 text-sm font-medium text-red-800">{errorMessage}</p>
				</div>
			</div>
		{/if}

		<!-- Content Card -->
		<div class="rounded-lg bg-white shadow">
			{#if inquiries.length === 0}
				<div class="p-12 text-center">
					<svg
						class="mx-auto h-16 w-16 text-gray-300"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
					<h3 class="mt-4 text-lg font-medium text-gray-900">No inquiries yet</h3>
					<p class="mt-2 text-sm text-gray-500">
						Setup inquiries will appear here when customers submit requests.
					</p>
				</div>
			{:else}
				<!-- Table -->
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Date
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Restaurant
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Contact Name
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Email
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Phone
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Package
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Location
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Notes
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Status
								</th>
								<th
									scope="col"
									class="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-600 uppercase"
								>
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each inquiries as inquiry (inquiry.id)}
								<tr class="transition-colors hover:bg-gray-50">
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
										{formatDate(inquiry.created)}
									</td>
									<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
										{inquiry.restaurantName}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
										{inquiry.contactName}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap">
										<a
											href="mailto:{inquiry.email}"
											class="text-blue-600 hover:text-blue-800 hover:underline"
										>
											{inquiry.email}
										</a>
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
										{inquiry.phone || '-'}
									</td>
									<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
										<span
											class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
										>
											{inquiry.selectedPackage}
										</span>
									</td>
									<td
										class="max-w-xs truncate px-6 py-4 text-sm whitespace-nowrap text-gray-600"
										title={inquiry.location}
									>
										{inquiry.location}
									</td>
									<td
										class="max-w-xs truncate px-6 py-4 text-sm text-gray-600"
										title={inquiry.notes}
									>
										{#if inquiry.notes && inquiry.notes !== '-'}
											<span class="line-clamp-2">{inquiry.notes}</span>
										{:else}
											-
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span
											class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold {getStatusColor(
												inquiry.status
											)}"
										>
											{inquiry.status || 'pending'}
										</span>
									</td>
									<td class="px-6 py-4 text-right whitespace-nowrap">
										<select
											value={inquiry.status || 'pending'}
											onchange={(e) => updateStatus(inquiry.id, e.currentTarget.value)}
											disabled={updating === inquiry.id}
											class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
										>
											<option value="pending">Pending</option>
											<option value="in_progress">In Progress</option>
											<option value="completed">Completed</option>
											<option value="cancelled">Cancelled</option>
										</select>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Footer Stats -->
		{#if inquiries.length > 0}
			<div class="mt-6 flex items-center justify-between text-sm text-gray-500">
				<p>Showing {inquiries.length} inquiry{inquiries.length !== 1 ? 's' : ''}</p>
				<p>Last updated: {new Date().toLocaleTimeString()}</p>
			</div>
		{/if}
	</div>
</div>
