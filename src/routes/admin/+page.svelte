<script>
	import { page } from '$app/stores';
	export let data;
	const user = data.user;
</script>

<h1 class="mb-4 flex items-center justify-center text-center text-3xl font-bold md:text-4xl">
	Welcome to Admin Dashboard
</h1>
<h3 class="text-secondary flex justify-center text-center text-2xl">{user?.name || ''}</h3>
<div class="mt-4 flex justify-center">
	<!-- Sidebar -->
	<!-- <aside class="w-64 p-4"> -->
	<nav class="flex gap-2">
		<a href="/admin" class="hover:underline">Dashboard</a>
		<a href="/admin/admin-menu" class="hover:underline">Menu</a>
		<a href="/admin/admin-order" class="hover:underline">Orders</a>
		<a href="/admin/admin-reservation" class="hover:underline">Reservations</a>
	</nav>
	<!-- </aside> -->
</div>
