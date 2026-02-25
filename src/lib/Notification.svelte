<script lang="ts">
	import { fly } from 'svelte/transition';

	interface Props {
		show: boolean;
		type?: 'success' | 'error' | 'warning' | 'info';
		title: string;
		message?: string;
		button?: { label: string; href?: string; onclick?: () => void };
		onclose?: () => void;
		duration?: number;
	}

	let {
		show = false,
		type = 'success',
		title,
		message = '',
		button,
		onclose,
		duration = 3000
	}: Props = $props();

	$effect(() => {
		if (show && duration > 0) {
			const timer = setTimeout(() => {
				show = false;
				onclose?.();
			}, duration);
			return () => clearTimeout(timer);
		}
	});

	const colors = {
		success: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
		error: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
		warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
		info: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }
	};

	const icons = {
		success: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>`,
		error: `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>`,
		warning: `<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>`,
		info: `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>`
	};
</script>

{#if show}
	<div
		class="toast toast-top toast-center z-50"
		in:fly={{ y: -50, duration: 300 }}
		out:fly={{ y: -50, duration: 300 }}
	>
		<div
			class="alert gap-3 rounded-2xl border-0 {type === 'error'
				? 'bg-red-900'
				: type === 'warning'
					? 'bg-amber-900'
					: type === 'info'
						? 'bg-blue-900'
						: 'bg-gray-900'} px-5 py-3 text-white shadow-2xl"
		>
			<div class="rounded-full {colors[type].bg} p-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5 {colors[type].text}"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					{@html icons[type]}
				</svg>
			</div>
			<div class="flex flex-col">
				<p class="text-sm font-semibold">{title}</p>
				{#if message}
					<p class="text-xs text-gray-400">{message}</p>
				{/if}
				{#if button}
					{#if button.href}
						<a
							href={button.href}
							class="btn btn-sm btn-primary mt-2 self-start rounded-lg bg-blue-600 text-white hover:bg-blue-700"
						>
							{button.label}
						</a>
					{:else if button.onclick}
						<button
							onclick={button.onclick}
							class="btn btn-sm btn-primary mt-2 self-start rounded-lg bg-blue-600 text-white hover:bg-blue-700"
						>
							{button.label}
						</button>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if}
