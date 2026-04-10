<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
	<div class="mb-6">
		<div class="text-[120px] leading-none">🔍</div>
	</div>
	
	<h1 class="mb-4 text-4xl font-bold text-gray-900">Page Not Found</h1>
	
	<p class="mb-8 max-w-md text-lg text-gray-600">
		{#if $page.data.error}
			{$page.data.error}
		{:else}
			Sorry, we couldn't find the restaurant or page you're looking for.
		{/if}
	</p>
	
	<div class="flex gap-4">
		<a 
			href="/" 
			class="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white transition-all hover:bg-amber-600"
		>
			Go Home
		</a>
		<a 
			href="/stores" 
			class="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
		>
			Browse Stores
		</a>
	</div>
</div>