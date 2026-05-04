<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;
	const topCities = data.topCities ?? [];
</script>

<AdminPage title="Top Ticket Sales" subtitle="By city">
	<AdminCard>
		<div class="space-y-4">
			{#each topCities as cityStat, index}
				<article class="rounded-md border border-slate-200 bg-slate-50 p-4">
					<div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
						<h2 class="text-lg font-bold text-slate-950">{index + 1}. {cityStat.cityName}</h2>
						<p class="text-sm font-semibold text-blue-700">
							{(cityStat.percentOfThisCitysBookingsOverAllBookings * 100).toFixed(2)}% of all
							bookings
						</p>
					</div>
					<dl class="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
						<div>
							<dt class="font-semibold text-slate-500">Tickets Booked</dt>
							<dd>{cityStat.totalBookings}</dd>
						</div>
						<div>
							<dt class="font-semibold text-slate-500">Paid / Unpaid</dt>
							<dd>{cityStat.totalPaidBookings} / {cityStat.totalUnpaidBookings}</dd>
						</div>
						<div>
							<dt class="font-semibold text-slate-500">Sold</dt>
							<dd>{(cityStat.percentOfPaidBookings * 100).toFixed(0)}%</dd>
						</div>
					</dl>
				</article>
			{:else}
				<p class="text-sm text-slate-600">No report data available yet.</p>
			{/each}
		</div>
	</AdminCard>
</AdminPage>
