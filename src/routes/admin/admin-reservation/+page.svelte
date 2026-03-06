<script lang="ts">
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';
	import { fly, fade } from 'svelte/transition';
	import pb from '$lib/pb';

	export const isLoggedIn = derived(page, ($page) => $page.data.user !== null);

	let { data } = $props();

	let activeTab = $state<'table' | 'hotel_room' | 'event'>('table');
	let selectedReservation = $state<any>(null);
	let updateStatus = $state('');
	let isUpdating = $state(false);

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800',
		confirmed: 'bg-blue-100 text-blue-800',
		checked_in: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800'
	};

	const typeLabels: Record<string, string> = {
		table: 'Table Reservation',
		hotel_room: 'Room Service',
		event: 'Event Reservation'
	};

	$effect(() => {
		// Filter reservations by type
	});

	async function updateReservationStatus(reservationId: string, newStatus: string) {
		isUpdating = true;
		try {
			await pb.collection('reservations').update(reservationId, {
				status: newStatus
			});
			// Refresh data
			window.location.reload();
		} catch (err) {
			console.error('Failed to update reservation:', err);
		} finally {
			isUpdating = false;
		}
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(timeStr: string): string {
		if (!timeStr) return '-';
		const [hours, minutes] = timeStr.split(':');
		const h = parseInt(hours);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const h12 = h % 12 || 12;
		return `${h12}:${minutes} ${ampm}`;
	}

	function getStoreName(storeId: string): string {
		const store = data.stores?.find((s: any) => s.id === storeId);
		return store?.name || 'Unknown Store';
	}
</script>

<svelte:head>
	<title>Reservations - Proxifeast</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<!-- Header -->
	<section class="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-700 py-8 text-white">
		<div class="container mx-auto px-4">
			<h1
				class="font-playfair mb-2 text-2xl font-bold md:text-3xl"
				in:fly={{ y: 20, duration: 400 }}
			>
				Reservations
			</h1>
			<p class="text-sm text-slate-300" in:fade={{ duration: 400, delay: 100 }}>
				Manage customer reservations and room service orders
			</p>
		</div>
	</section>

	<main class="container mx-auto px-4 py-8">
		{#if $isLoggedIn}
			<!-- Tabs -->
			<div class="mb-6 flex flex-wrap gap-2">
				<button
					onclick={() => (activeTab = 'table')}
					class="rounded-lg px-4 py-2 text-sm font-medium transition {activeTab === 'table'
						? 'bg-amber-500 text-white'
						: 'bg-white text-slate-600 hover:bg-slate-100'}"
				>
					Table Reservations
				</button>
				<button
					onclick={() => (activeTab = 'hotel_room')}
					class="rounded-lg px-4 py-2 text-sm font-medium transition {activeTab === 'hotel_room'
						? 'bg-amber-500 text-white'
						: 'bg-white text-slate-600 hover:bg-slate-100'}"
				>
					Room Service
				</button>
				<button
					onclick={() => (activeTab = 'event')}
					class="rounded-lg px-4 py-2 text-sm font-medium transition {activeTab === 'event'
						? 'bg-amber-500 text-white'
						: 'bg-white text-slate-600 hover:bg-slate-100'}"
				>
					Events
				</button>
			</div>

			<!-- Reservations List -->
			{#if data.reservations && data.reservations.length > 0}
				{@const filteredReservations = data.reservations.filter((r: any) => r.type === activeTab)}

				{#if filteredReservations.length > 0}
					<div class="overflow-x-auto rounded-2xl bg-white shadow-lg">
						<table class="w-full">
							<thead class="bg-slate-50">
								<tr>
									<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
										>Guest</th
									>
									<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
										>Date</th
									>
									<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
										>Time</th
									>
									<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
										>Party Size</th
									>
									<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
										>Status</th
									>
									<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
										>Room #</th
									>
									<th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase"
										>Actions</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								{#each filteredReservations as reservation}
									<tr class="hover:bg-slate-50">
										<td class="px-4 py-4">
											<div class="font-medium text-slate-800">
												{reservation.guestName || 'Guest'}
											</div>
											<div class="text-sm text-slate-500">
												{reservation.guestEmail || reservation.guestPhone || '-'}
											</div>
										</td>
										<td class="px-4 py-4 text-sm text-slate-600">
											{formatDate(reservation.reservationDate)}
										</td>
										<td class="px-4 py-4 text-sm text-slate-600">
											{formatTime(reservation.checkInTime)}
										</td>
										<td class="px-4 py-4 text-sm text-slate-600">
											{reservation.partySize || '-'}
										</td>
										<td class="px-4 py-4">
											<span
												class="rounded-full px-3 py-1 text-xs font-medium {statusColors[
													reservation.status
												] || 'bg-slate-100 text-slate-600'}"
											>
												{reservation.status || 'pending'}
											</span>
										</td>
										<td class="px-4 py-4 text-sm text-slate-600">
											{reservation.roomNumber || '-'}
										</td>
										<td class="px-4 py-4">
											<div class="flex gap-2">
												{#if reservation.status === 'pending'}
													<button
														onclick={() => updateReservationStatus(reservation.id, 'confirmed')}
														disabled={isUpdating}
														class="rounded-lg bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
													>
														Confirm
													</button>
												{/if}
												{#if reservation.status === 'confirmed'}
													<button
														onclick={() => updateReservationStatus(reservation.id, 'checked_in')}
														disabled={isUpdating}
														class="rounded-lg bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
													>
														Check In
													</button>
												{/if}
												{#if reservation.status !== 'cancelled' && reservation.status !== 'checked_in'}
													<button
														onclick={() => updateReservationStatus(reservation.id, 'cancelled')}
														disabled={isUpdating}
														class="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
													>
														Cancel
													</button>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="py-16 text-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mx-auto h-16 w-16 text-slate-300"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" />
							<line x1="16" x2="16" y1="2" y2="6" />
							<line x1="8" x2="8" y1="2" y2="6" />
							<line x1="3" x2="21" y1="10" y2="10" />
						</svg>
						<h3 class="text-slate- font-medium700 mt-4 text-lg">No {typeLabels[activeTab]}s</h3>
						<p class="mt-1 text-slate-500">Reservations will appear here when customers book.</p>
					</div>
				{/if}
			{:else}
				<div class="py-16 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto h-16 w-16 text-slate-300"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<rect x="3" y="4" width="18" height="18" rx="2" />
						<line x1="16" x2="16" y1="2" y2="6" />
						<line x1="8" x2="8" y1="2" y2="6" />
						<line x1="3" x2="21" y1="10" y2="10" />
					</svg>
					<h3 class="text-slate- font-medium700 mt-4 text-lg">No Reservations Yet</h3>
					<p class="mt-1 text-slate-500">Reservations will appear here when customers book.</p>
				</div>
			{/if}
		{:else}
			<div class="py-16 text-center">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mx-auto h-16 w-16 text-slate-300"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
					<polyline points="10 17 15 12 10 7" />
					<line x1="15" y1="12" x2="3" y2="12" />
				</svg>
				<h3 class="text-slate- font-medium700 mt-4 text-lg">Login Required</h3>
				<p class="mt-1 text-slate-500">Please login to view reservations.</p>
				<a href="/login" class="btn-primary-custom mt-4 inline-block !px-6 !py-2"> Login </a>
			</div>
		{/if}
	</main>
</div>
