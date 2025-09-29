<script>
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';

	// Mock Data (replace with API/PocketBase)
	let stats = {
		customers: 120,
		orders: 340,
		revenue: 850000,
		recurringRate: '35%'
	};

	let ordersOverTime = {
		labels: ['Sept 1', 'Sept 2', 'Sept 3', 'Sept 4'],
		datasets: [
			{
				label: 'Orders',
				data: [12, 19, 8, 25],
				borderColor: '#FACC15',
				backgroundColor: 'rgba(250, 204, 21, 0.3)',
				tension: 0.3,
				fill: true
			}
		]
	};

	let orderBreakdown = {
		labels: ['Cash', 'Card', 'Transfer'],
		datasets: [
			{
				label: 'Payments',
				data: [180, 120, 40],
				backgroundColor: ['#FACC15', '#60A5FA', '#34D399']
			}
		]
	};

	let recurringCustomers = [
		{ name: 'John Doe', orders: 12, avatar: 'https://i.pravatar.cc/50?img=1' },
		{ name: 'Mary Jane', orders: 9, avatar: 'https://i.pravatar.cc/50?img=2' },
		{ name: 'Femi Andrew', orders: 7, avatar: 'https://i.pravatar.cc/50?img=3' },
		{ name: 'Blessing Okoro', orders: 5, avatar: 'https://i.pravatar.cc/50?img=4' }
	];

	let activityFeed = [
		{
			time: '09:15',
			text: 'John Doe placed an order ₦4,500',
			avatar: 'https://i.pravatar.cc/40?img=5'
		},
		{ time: '10:20', text: 'Mary Jane reordered ₦2,300', avatar: 'https://i.pravatar.cc/40?img=6' }
	];

	let lineChart;
	let pieChart;

	onMount(() => {
		const lineCtx = document.getElementById('ordersChart').getContext('2d');
		const pieCtx = document.getElementById('breakdownChart').getContext('2d');

		lineChart = new Chart(lineCtx, {
			type: 'line',
			data: ordersOverTime,
			options: { responsive: true, plugins: { legend: { display: false } } }
		});

		pieChart = new Chart(pieCtx, {
			type: 'pie',
			data: orderBreakdown,
			options: { responsive: true }
		});
	});
</script>

<div class="space-y-8 p-6">
	<!-- KPI Cards -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
		<div class="card bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Customers</h2>
				<p class="text-3xl font-bold">{stats.customers}</p>
			</div>
		</div>
		<div class="card bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Orders</h2>
				<p class="text-3xl font-bold">{stats.orders}</p>
			</div>
		</div>
		<div class="card bg-gradient-to-r from-green-400 to-green-500 text-white shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Revenue</h2>
				<p class="text-3xl font-bold">₦{stats.revenue.toLocaleString()}</p>
			</div>
		</div>
		<div class="card bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Returning</h2>
				<p class="text-3xl font-bold">{stats.recurringRate}</p>
			</div>
		</div>
	</div>

	<!-- Orders Over Time (Chart) -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">📈 Orders Over Time</h2>
			<canvas id="ordersChart" height="120"></canvas>
		</div>
	</div>

	<!-- Order Breakdown (Pie) -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">💳 Order Breakdown</h2>
			<!-- <canvas id="breakdownChart" height="12"></canvas> -->
			<div class="mx-auto w-64 md:w-[450px]">
				<canvas id="breakdownChart"></canvas>
			</div>
		</div>
	</div>

	<!-- Recurring Customers -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">🔁 Recurring Customers</h2>
			<div class="overflow-x-auto">
				<table class="table-zebra table">
					<thead>
						<tr>
							<th>Customer</th>
							<th>Orders</th>
						</tr>
					</thead>
					<tbody>
						{#each recurringCustomers as customer}
							<tr>
								<td class="flex items-center space-x-3">
									<div class="avatar">
										<div class="w-10 rounded-full">
											<img src={customer.avatar} alt={customer.name} />
										</div>
									</div>
									<span>{customer.name}</span>
								</td>
								<td>
									<span class="badge badge-accent">{customer.orders}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">📰 Recent Activity</h2>
			<ul class="space-y-4">
				{#each activityFeed as a}
					<li class="flex items-center space-x-3">
						<div class="avatar">
							<div class="w-10 rounded-full">
								<img src={a.avatar} alt="user" />
							</div>
						</div>
						<div>
							<p class="text-sm font-semibold">{a.text}</p>
							<span class="text-xs opacity-70">{a.time}</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
