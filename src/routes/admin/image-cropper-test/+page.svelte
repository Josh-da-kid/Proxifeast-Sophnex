<script lang="ts">
	import ImageCropper from '$lib/ImageCropper.svelte';

	let uploadedImage = $state('');
	let isModalOpen = $state(false);

	// Example usage for different upload types
	type UploadType = 'dish' | 'gallery' | 'banner';
	let currentUploadType: UploadType = $state('dish');

	function handleCropComplete(blob: Blob, base64: string) {
		uploadedImage = base64;
		isModalOpen = false;

		// Example: Upload to server
		// const formData = new FormData();
		// formData.append('image', blob, 'dish-image.jpg');
		// await fetch('/api/upload', { method: 'POST', body: formData });

		console.log('Image cropped and ready for upload:', {
			size: blob.size,
			type: blob.type,
			dimensions:
				currentUploadType === 'dish'
					? '800x600'
					: currentUploadType === 'gallery'
						? '600x600'
						: '1920x1080'
		});
	}

	function openCropper(type: UploadType) {
		currentUploadType = type;
		isModalOpen = true;
	}
</script>

<div class="min-h-screen bg-slate-50 p-8">
	<h1 class="mb-8 text-2xl font-bold text-slate-900">Image Cropper Examples</h1>

	<div class="grid gap-8 md:grid-cols-3">
		<!-- Dish Image Example -->
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-slate-900">Dish Image</h2>
			<p class="mb-4 text-sm text-slate-600">4:3 aspect ratio, 800×600px output</p>

			{#if uploadedImage && currentUploadType === 'dish'}
				<img src={uploadedImage} alt="Dish" class="mb-4 w-full rounded-lg object-cover" />
			{/if}

			<button
				onclick={() => openCropper('dish')}
				class="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
			>
				Upload Dish Image
			</button>
		</div>

		<!-- Gallery Image Example -->
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-slate-900">Gallery Image</h2>
			<p class="mb-4 text-sm text-slate-600">1:1 aspect ratio, 600×600px output</p>

			{#if uploadedImage && currentUploadType === 'gallery'}
				<img src={uploadedImage} alt="Gallery" class="mb-4 w-full rounded-lg object-cover" />
			{/if}

			<button
				onclick={() => openCropper('gallery')}
				class="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
			>
				Upload Gallery Image
			</button>
		</div>

		<!-- Banner Image Example -->
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-slate-900">Banner Image</h2>
			<p class="mb-4 text-sm text-slate-600">16:9 aspect ratio, 1920×1080px output</p>

			{#if uploadedImage && currentUploadType === 'banner'}
				<img src={uploadedImage} alt="Banner" class="mb-4 w-full rounded-lg object-cover" />
			{/if}

			<button
				onclick={() => openCropper('banner')}
				class="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
			>
				Upload Banner
			</button>
		</div>
	</div>

	<!-- Cropper Modal -->
	{#if isModalOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
			<div class="w-full max-w-2xl rounded-2xl bg-white p-6">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-slate-900">
						{currentUploadType === 'dish'
							? 'Upload Dish Image'
							: currentUploadType === 'gallery'
								? 'Upload Gallery Image'
								: 'Upload Banner Image'}
					</h3>
					<button onclick={() => (isModalOpen = false)} class="rounded-lg p-2 hover:bg-slate-100">
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
					uploadType={currentUploadType}
					onCropComplete={handleCropComplete}
					onCancel={() => (isModalOpen = false)}
				/>
			</div>
		</div>
	{/if}
</div>
