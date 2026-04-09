<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/admin/billing', { replaceState: true });
	});
</script>

<div class="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Redirecting to billing...</div>
