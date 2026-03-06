<script lang="ts">
	import { onMount } from 'svelte';
	import jsQR from 'jsqr';

	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let fileInput: HTMLInputElement;
	let scanning = $state(false);
	let scanningMode: 'camera' | 'image' = $state('camera');
	let scanResult = $state<any>(null);
	let scanError = $state('');
	let isProcessing = $state(false);
	let uploadedImage: string | null = $state(null);

	onMount(() => {
		return () => {
			stopScanning();
		};
	});

	async function startScanning() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			});
			videoElement.srcObject = stream;
			await videoElement.play();
			scanning = true;
			scanResult = null;
			scanError = '';

			// Start scanning loop
			scanFrame();
		} catch (err) {
			console.error('Failed to start camera:', err);
			scanError = 'Failed to access camera. Please grant camera permission.';
		}
	}

	function stopScanning() {
		if (videoElement?.srcObject) {
			const tracks = (videoElement.srcObject as MediaStream).getTracks();
			tracks.forEach((track) => track.stop());
		}
		scanning = false;
	}

	async function scanFrame() {
		if (!scanning || !videoElement || isProcessing) return;

		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;

		const ctx = canvasElement.getContext('2d');
		if (ctx) {
			ctx.drawImage(videoElement, 0, 0);

			// Use BarcodeDetector if available (Chrome)
			if ('BarcodeDetector' in window) {
				try {
					const barcodeDetector = new (window as any).BarcodeDetector({
						formats: ['qr_code']
					});
					const barcodes = await barcodeDetector.detect(canvasElement);

					if (barcodes.length > 0) {
						const qrValue = barcodes[0].rawValue;
						console.log('QR Code detected:', qrValue);
						await validateQR(qrValue);
						return;
					}
				} catch (e) {
					console.log('Barcode detection failed:', e);
				}
			}
		}

		// Continue scanning
		if (scanning) {
			requestAnimationFrame(scanFrame);
		}
	}

	async function handleImageUpload(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		isProcessing = true;
		scanError = '';

		const reader = new FileReader();
		reader.onload = async (e) => {
			uploadedImage = e.target?.result as string;

			// Create image and scan
			const img = new Image();
			img.onload = async () => {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(img, 0, 0);
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

					// Use jsQR to decode
					const code = jsQR(imageData.data, imageData.width, imageData.height);

					if (code) {
						console.log('QR Code from image:', code.data);
						await validateQR(code.data);
					} else {
						scanError = 'No QR code found in the image. Please try another image.';
					}
				}
				isProcessing = false;
			};
			img.src = uploadedImage;
		};
		reader.readAsDataURL(file);
	}

	async function validateQR(qrValue: string) {
		if (isProcessing) return;

		isProcessing = true;
		stopScanning();

		try {
			// Try to parse as our QR data format
			let qrToken = qrValue;
			try {
				const parsed = JSON.parse(qrValue);
				// If it's our format, get the token
				if (parsed.t) {
					qrToken = parsed.t;
				}
			} catch {
				// Not JSON, use as-is (might be raw token)
			}

			const formData = new FormData();
			formData.append('qrToken', qrToken);
			formData.append('action', 'lookup');

			const response = await fetch('/api/validate-qr', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.success) {
				scanResult = result.reservation;
				scanError = '';
			} else {
				scanError = result.error || 'Invalid QR code';
				scanResult = null;
			}
		} catch (err) {
			scanError = 'Failed to validate QR code';
			scanResult = null;
		} finally {
			isProcessing = false;
		}
	}

	async function checkInGuest() {
		if (!scanResult || isProcessing) return;

		isProcessing = true;

		try {
			const formData = new FormData();
			formData.append('qrToken', scanResult.qrToken);
			formData.append('action', 'checkin');

			const response = await fetch('/api/validate-qr', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.success) {
				scanResult = result.reservation;
				alert('Guest checked in successfully!');
			} else {
				alert(result.error || 'Failed to check in');
			}
		} catch (err) {
			alert('Failed to check in guest');
		} finally {
			isProcessing = false;
		}
	}

	function resetScan() {
		scanResult = null;
		scanError = '';
		uploadedImage = null;
		if (scanningMode === 'camera') {
			startScanning();
		}
	}

	function switchMode(mode: 'camera' | 'image') {
		stopScanning();
		scanningMode = mode;
		scanResult = null;
		scanError = '';
		uploadedImage = null;
		if (mode === 'camera') {
			startScanning();
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'confirmed':
				return 'bg-blue-100 text-blue-800';
			case 'checked_in':
				return 'bg-green-100 text-green-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getTypeLabel(type: string): string {
		switch (type) {
			case 'table':
				return 'Table Reservation';
			case 'hotel_room':
				return 'Hotel Room';
			case 'event':
				return 'Event';
			default:
				return type;
		}
	}
</script>

<svelte:head>
	<title>QR Scanner | Proxifeast Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<div class="mx-auto max-w-2xl px-4 py-8">
		<!-- Header -->
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900">QR Scanner</h1>
			<p class="text-gray-600">Scan QR codes to verify reservations and grant access</p>
		</div>

		<!-- Mode Selection -->
		<div class="mb-4 flex gap-2">
			<button
				onclick={() => switchMode('camera')}
				class="flex-1 rounded-lg px-4 py-2 font-medium transition {scanningMode === 'camera'
					? 'bg-orange-500 text-white'
					: 'bg-white text-gray-700 hover:bg-gray-50'}"
			>
				📷 Camera Scan
			</button>
			<button
				onclick={() => switchMode('image')}
				class="flex-1 rounded-lg px-4 py-2 font-medium transition {scanningMode === 'image'
					? 'bg-orange-500 text-white'
					: 'bg-white text-gray-700 hover:bg-gray-50'}"
			>
				🖼️ Upload Image
			</button>
		</div>

		<!-- Scanner Card -->
		<div class="overflow-hidden rounded-lg bg-white shadow">
			{#if scanningMode === 'camera'}
				<!-- Video/Canvas Container -->
				<div class="relative aspect-square bg-gray-900">
					<video bind:this={videoElement} class="h-full w-full object-cover" playsinline muted
					></video>
					<canvas bind:this={canvasElement} class="hidden"></canvas>

					{#if !scanning && !scanResult}
						<div class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
							<svg
								class="h-20 w-20 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
								/>
							</svg>
							<p class="mt-4 text-gray-400">Camera not active</p>
						</div>
					{/if}

					{#if scanning}
						<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
							<div class="h-64 w-64 rounded-lg border-4 border-orange-500 opacity-75"></div>
						</div>
					{/if}
				</div>

				<!-- Controls -->
				<div class="p-4">
					{#if !scanning && !scanResult}
						<button
							onclick={startScanning}
							class="w-full rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white hover:bg-orange-600"
						>
							Start Scanning
						</button>
					{:else if scanning}
						<button
							onclick={stopScanning}
							class="w-full rounded-lg bg-gray-500 px-4 py-3 font-semibold text-white hover:bg-gray-600"
						>
							Stop Scanning
						</button>
					{/if}
				</div>
			{:else}
				<!-- Image Upload Mode -->
				<div class="p-4">
					{#if !uploadedImage && !scanResult}
						<div
							class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12"
						>
							<svg
								class="h-16 w-16 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<p class="mt-4 text-gray-500">Upload a QR code image</p>
							<button
								onclick={() => fileInput.click()}
								class="mt-4 rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600"
							>
								Select Image
							</button>
							<input
								bind:this={fileInput}
								type="file"
								accept="image/*"
								onchange={handleImageUpload}
								class="hidden"
							/>
						</div>
					{:else if uploadedImage && !scanResult}
						<div class="flex flex-col items-center">
							<img
								src={uploadedImage}
								alt="Uploaded QR"
								class="max-h-64 rounded-lg object-contain"
							/>
							{#if isProcessing}
								<p class="mt-4 text-gray-500">Scanning...</p>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Error Message -->
		{#if scanError}
			<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-red-800">{scanError}</p>
				<button onclick={resetScan} class="mt-2 text-sm text-red-600 hover:underline">
					Try Again
				</button>
			</div>
		{/if}

		<!-- Scan Result -->
		{#if scanResult}
			<div class="mt-6 overflow-hidden rounded-lg bg-white shadow">
				<div class="border-b border-gray-200 bg-green-50 px-4 py-3">
					<h2 class="text-lg font-semibold text-green-900">Reservation Found</h2>
				</div>

				<div class="space-y-4 p-4">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-xs text-gray-500">Guest Name</p>
							<p class="font-semibold text-gray-900">{scanResult.guestName}</p>
						</div>
						<div>
							<p class="text-xs text-gray-500">Type</p>
							<p class="font-semibold text-gray-900">{getTypeLabel(scanResult.type)}</p>
						</div>
						<div>
							<p class="text-xs text-gray-500">Date</p>
							<p class="font-semibold text-gray-900">
								{new Date(scanResult.reservationDate).toLocaleDateString()}
							</p>
						</div>
						<div>
							<p class="text-xs text-gray-500">Time</p>
							<p class="font-semibold text-gray-900">{scanResult.checkInTime}</p>
						</div>
						<div>
							<p class="text-xs text-gray-500">Store</p>
							<p class="font-semibold text-gray-900">{scanResult.storeName}</p>
						</div>
						<div>
							<p class="text-xs text-gray-500">Party Size</p>
							<p class="font-semibold text-gray-900">{scanResult.partySize || 2} guests</p>
						</div>
						{#if scanResult.roomNumber}
							<div>
								<p class="text-xs text-gray-500">Room</p>
								<p class="font-semibold text-gray-900">{scanResult.roomNumber}</p>
							</div>
						{/if}
						<div>
							<p class="text-xs text-gray-500">Status</p>
							<span
								class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {getStatusColor(
									scanResult.status
								)}"
							>
								{scanResult.status}
							</span>
						</div>
					</div>

					<!-- Action Buttons -->
					{#if scanResult.status === 'pending' || scanResult.status === 'confirmed'}
						<button
							onclick={checkInGuest}
							disabled={isProcessing}
							class="w-full rounded-lg bg-green-500 px-4 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-50"
						>
							{isProcessing ? 'Processing...' : 'Grant Access (Check In)'}
						</button>
					{:else if scanResult.status === 'checked_in'}
						<div class="rounded-lg bg-green-100 p-3 text-center text-green-800">
							✓ Already Checked In
							{#if scanResult.checkedInAt}
								<p class="text-sm">at {new Date(scanResult.checkedInAt).toLocaleString()}</p>
							{/if}
						</div>
					{/if}

					<button
						onclick={resetScan}
						class="w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
					>
						Scan Another
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
