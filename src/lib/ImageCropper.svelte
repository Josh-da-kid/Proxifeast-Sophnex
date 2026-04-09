<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		aspectRatio?: number;
		outputWidth?: number;
		outputHeight?: number;
		initialImage?: string;
		onCropComplete?: (blob: Blob, base64: string) => void;
		onCancel?: () => void;
		uploadType?: 'dish' | 'gallery' | 'banner';
	}

	let {
		aspectRatio = 4 / 3,
		outputWidth = 800,
		outputHeight = 600,
		initialImage = '',
		onCropComplete,
		onCancel,
		uploadType = 'dish'
	}: Props = $props();

	const presets = {
		dish: { aspectRatio: 4 / 3, outputWidth: 800, outputHeight: 600 },
		gallery: { aspectRatio: 1 / 1, outputWidth: 600, outputHeight: 600 },
		banner: { aspectRatio: 16 / 9, outputWidth: 1920, outputHeight: 1080 }
	};

	$effect(() => {
		if (presets[uploadType]) {
			aspectRatio = presets[uploadType].aspectRatio;
			outputWidth = presets[uploadType].outputWidth;
			outputHeight = presets[uploadType].outputHeight;
		}
	});

	let containerRef = $state<HTMLDivElement | undefined>(undefined);
	let imageRef = $state<HTMLImageElement | undefined>(undefined);
	let fileInputRef = $state<HTMLInputElement | undefined>(undefined);

	let originalImage: string = $state(initialImage || '');
	let isDragging = $state(false);
	let isLoading = $state(false);
	let showPreview = $state(false);
	let previewBlob: Blob | null = $state(null);
	let previewBase64: string = $state('');

	let imageX = $state(0);
	let imageY = $state(0);
	let scale = $state(1);
	let minScale = $state(1);
	let rotation = $state(0);

	let containerWidth = $state(0);
	let containerHeight = $state(0);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let imageStartX = $state(0);
	let imageStartY = $state(0);

	let naturalWidth = $state(0);
	let naturalHeight = $state(0);

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		isLoading = true;
		const reader = new FileReader();
		reader.onload = (e) => {
			originalImage = e.target?.result as string;
			isLoading = false;
			resetCrop();
		};
		reader.readAsDataURL(file);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		const input = fileInputRef;
		if (file && file.type.startsWith('image/') && input) {
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			input.files = dataTransfer.files;
			handleFileSelect({ target: input } as any);
		}
	}

	function triggerFileInput() {
		fileInputRef?.click();
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function resetCrop() {
		imageX = 0;
		imageY = 0;
		scale = 1;
		rotation = 0;
		showPreview = false;
		previewBlob = null;
		previewBase64 = '';

		if (imageRef && containerRef) {
			setTimeout(calculateMinScale, 100);
		}
	}

	function calculateMinScale() {
		if (!containerRef || !imageRef) return;

		const containerRect = containerRef.getBoundingClientRect();
		containerWidth = containerRect.width;
		containerHeight = containerRect.height;

		naturalWidth = imageRef.naturalWidth;
		naturalHeight = imageRef.naturalHeight;

		const viewfinderWidth = containerWidth - 40;
		const viewfinderHeight = viewfinderWidth / aspectRatio;

		if (viewfinderHeight > containerHeight - 120) {
			const adjustedHeight = containerHeight - 120;
			minScale =
				adjustedHeight / Math.min(naturalWidth, (naturalHeight / aspectRatio) * adjustedHeight);
		} else {
			minScale = viewfinderWidth / Math.min(naturalWidth, naturalHeight);
		}

		scale = Math.max(minScale, 1);
	}

	function handleImageLoad() {
		calculateMinScale();
	}

	function startDrag(event: MouseEvent | TouchEvent) {
		isDragging = true;
		dragStartX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		dragStartY = 'touches' in event ? event.touches[0].clientY : event.clientY;
		imageStartX = imageX;
		imageStartY = imageY;
	}

	function onDrag(event: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		event.preventDefault();

		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

		const deltaX = clientX - dragStartX;
		const deltaY = clientY - dragStartY;

		const maxX = (containerWidth * scale - (containerWidth / aspectRatio) * scale) / 2;
		const maxY = (containerHeight * scale - containerHeight * scale) / 2;

		imageX = Math.min(maxX, Math.max(-maxX, imageStartX + deltaX));
		imageY = Math.min(maxY, Math.max(-maxY, imageStartY + deltaY));
	}

	function stopDrag() {
		isDragging = false;
	}

	function handleZoom(event: Event) {
		const input = event.target as HTMLInputElement;
		scale = parseFloat(input.value);
	}

	function rotate90() {
		rotation = (rotation + 90) % 360;
		const temp = naturalWidth;
		naturalWidth = naturalHeight;
		naturalHeight = temp;
		calculateMinScale();
	}

	async function generateCrop() {
		if (!imageRef) return;

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvas.width = outputWidth;
		canvas.height = outputHeight;

		const img = new Image();
		img.src = originalImage;
		await new Promise((resolve) => (img.onload = resolve));

		const viewfinderWidth = containerWidth - 40;
		const viewfinderHeight = viewfinderWidth / aspectRatio;

		const scaleX = (outputWidth / viewfinderWidth) * scale;
		const scaleY = (outputHeight / viewfinderHeight) * scale;

		const scaledWidth = naturalWidth * scale;
		const scaledHeight = naturalHeight * scale;

		const centerX = viewfinderWidth / 2;
		const centerY = viewfinderHeight / 2;

		const imageCenterX = scaledWidth / 2;
		const imageCenterY = scaledHeight / 2;

		const offsetX = (imageCenterX - centerX - imageX) * scaleX;
		const offsetY = (imageCenterY - centerY - imageY) * scaleY;

		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate((rotation * Math.PI) / 180);
		ctx.translate(-canvas.width / 2, -canvas.height / 2);

		ctx.drawImage(img, offsetX, offsetY, naturalWidth * scaleX, naturalHeight * scaleY);

		canvas.toBlob(
			(blob) => {
				if (blob) {
					previewBlob = blob;
					previewBase64 = canvas.toDataURL('image/jpeg', 0.9);
					showPreview = true;
					onCropComplete?.(blob, previewBase64);
				}
			},
			'image/jpeg',
			0.9
		);
	}

	function confirmCrop() {
		if (previewBlob && previewBase64) {
			onCropComplete?.(previewBlob, previewBase64);
		}
	}

	onMount(() => {
		if (initialImage) {
			resetCrop();
		}
	});
</script>

<div class="flex flex-col gap-4">
	<!-- File Input / Drop Zone -->
	{#if !originalImage}
		<div
			class="flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-amber-500 hover:bg-amber-50"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			onclick={triggerFileInput}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && triggerFileInput()}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-12 w-12 text-slate-400"
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
			<p class="mt-2 text-sm text-slate-600">Click or drag image here</p>
			<p class="text-xs text-slate-400">Supports: JPG, PNG, WebP</p>
		</div>
		<input
			bind:this={fileInputRef}
			type="file"
			accept="image/*"
			class="hidden"
			onchange={handleFileSelect}
		/>
	{/if}

	<!-- Cropping Interface -->
	{#if originalImage && !showPreview}
		<div class="space-y-4">
			<!-- Viewfinder -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				bind:this={containerRef}
				class="relative mx-auto overflow-hidden rounded-xl bg-slate-900"
				style="width: 100%; max-width: 600px; aspect-ratio: {aspectRatio}; touch-action: none;"
				onmousedown={startDrag}
				onmousemove={onDrag}
				onmouseup={stopDrag}
				onmouseleave={stopDrag}
				ontouchstart={startDrag}
				ontouchmove={onDrag}
				ontouchend={stopDrag}
				role="application"
				aria-label="Image crop viewfinder"
			>
				<!-- Image -->
				<img
					bind:this={imageRef}
					src={originalImage}
					alt="Crop preview"
					class="absolute cursor-move select-none"
					style="
						transform: translate(-50%, -50%) translate({imageX}px, {imageY}px) scale({scale}) rotate({rotation}deg);
						transform-origin: center center;
						max-width: none;
						left: 50%;
						top: 50%;
					"
					ondragstart={(e) => e.preventDefault()}
					onload={handleImageLoad}
				/>

				<!-- Semi-transparent overlay -->
				<div class="pointer-events-none absolute inset-0">
					<!-- Top overlay -->
					<div class="absolute inset-0 bg-black/60"></div>

					<!-- Clear viewfinder window -->
					<div
						class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg"
						style="
							width: calc(100% - 40px);
							aspect-ratio: {aspectRatio};
						"
					></div>
				</div>

				{#if isLoading}
					<div class="absolute inset-0 flex items-center justify-center bg-black/50">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"
						></div>
					</div>
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
				<!-- Zoom Slider -->
				<div class="flex items-center gap-3">
					<span class="text-xs font-medium text-slate-600">Zoom</span>
					<input
						type="range"
						min={minScale}
						max={minScale * 4}
						step="0.1"
						value={scale}
						oninput={handleZoom}
						class="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-amber-500"
					/>
					<span class="w-12 text-right text-xs text-slate-500">{Math.round(scale * 100)}%</span>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-2">
					<button
						type="button"
						onclick={rotate90}
						class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
							/>
						</svg>
						Rotate
					</button>
					<button
						type="button"
						onclick={resetCrop}
						class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
							<path d="M3 3v5h5" />
						</svg>
						Reset
					</button>
					<button
						type="button"
						onclick={() => {
							originalImage = '';
							resetCrop();
							if (onCancel) onCancel();
						}}
						class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
						Cancel
					</button>
				</div>

				<!-- Crop Button -->
				<button
					type="button"
					onclick={generateCrop}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M5.5 5.5A2.5 2.5 0 108 8a2.5 2.5 0 00-2.5-2.5z" />
						<path d="M19.5 14.5A2.5 2.5 0 1017 17a2.5 2.5 0 002.5-2.5z" />
						<path d="M19.5 5.5A2.5 2.5 0 1017 3a2.5 2.5 0 002.5 2.5z" />
						<path d="M5.5 19.5A2.5 2.5 0 103 22a2.5 2.5 0 002.5-2.5z" />
						<path d="M14 14l6 6M20 4l-6 6" />
					</svg>
					Crop Image
				</button>
			</div>

			<!-- Hidden file input for changing image -->
			<input
				bind:this={fileInputRef}
				type="file"
				accept="image/*"
				class="hidden"
				onchange={handleFileSelect}
			/>
		</div>
	{/if}

	<!-- Preview -->
	{#if showPreview && previewBase64}
		<div class="space-y-4 rounded-xl bg-white p-4 shadow-sm">
			<h4 class="text-sm font-medium text-slate-700">Preview</h4>

			<div class="overflow-hidden rounded-lg border border-slate-200">
				<img
					src={previewBase64}
					alt="Cropped preview"
					class="w-full object-cover"
					style="aspect-ratio: {aspectRatio};"
				/>
			</div>

			<div class="flex items-center justify-between text-xs text-slate-500">
				<span>Output: {outputWidth} × {outputHeight}px</span>
				<span>{previewBlob ? (previewBlob.size / 1024).toFixed(1) : 0} KB</span>
			</div>

			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => {
						showPreview = false;
						previewBlob = null;
						previewBase64 = '';
					}}
					class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					Recrop
				</button>
				<button
					type="button"
					onclick={confirmCrop}
					class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
				>
					Confirm & Upload
				</button>
			</div>
		</div>
	{/if}
</div>
