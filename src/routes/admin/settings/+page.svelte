<script lang="ts">
	import RestaurantSettingsPage from '../restaurant-settings/+page.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Store Settings - Proxifeast Admin</title>
</svelte:head>

<RestaurantSettingsPage {data} {form} />
