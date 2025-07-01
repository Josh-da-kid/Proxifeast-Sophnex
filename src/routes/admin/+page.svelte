<script>
	import { page } from '$app/stores';
</script>

<h1 class="mb-4 flex items-center justify-center text-3xl font-bold md:text-4xl">
	Welcome to Admin Dashboard
</h1>
<div class="flex justify-center">
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
