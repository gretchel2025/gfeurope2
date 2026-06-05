<script lang="ts">
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;
	const topTicketSalesByCity = data.topTicketSalesByCity ?? [];
	const unpaidBookingsByCity = data.unpaidBookingsByCity ?? [];

	function formatPercent(value: number): string {
		return `${(value * 100).toFixed(1)}%`;
	}

	$: routes = adminRoutes($page.params.event_id);
</script>

<AdminPage
	title="Reports"
	subtitle="City-level ticket sales and payment follow-up reports for the active event."
>
	<AdminCard title="Top Ticket Sales by City" subtitle="Ranked by paid tickets sold.">
		<div class="space-y-3">
			{#each topTicketSalesByCity as cityStat, index}
				<article
					class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200"
				>
					<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<p class="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
								Rank {index + 1}
							</p>
							<h2 class="mt-1 text-xl font-black text-slate-950">{cityStat.cityName}</h2>
						</div>
						<p class="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
							{formatPercent(cityStat.percentOfPaidTickets)} of paid tickets
						</p>
					</div>

					<dl class="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
						<div class="rounded-md bg-slate-50 p-3">
							<dt class="font-semibold text-slate-500">Tickets sold</dt>
							<dd class="mt-1 text-2xl font-black text-slate-950">{cityStat.ticketsSold}</dd>
						</div>
						<div class="rounded-md bg-slate-50 p-3">
							<dt class="font-semibold text-slate-500">Paid bookings</dt>
							<dd class="mt-1 text-2xl font-black text-slate-950">{cityStat.paidBookings}</dd>
						</div>
						<div class="rounded-md bg-slate-50 p-3">
							<dt class="font-semibold text-slate-500">Paid amount</dt>
							<dd class="mt-1 text-2xl font-black text-slate-950">
								€{cityStat.amountPaid.toFixed(2)}
							</dd>
						</div>
					</dl>
				</article>
			{:else}
				<p class="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
					No paid ticket sales yet.
				</p>
			{/each}
		</div>
	</AdminCard>

	<AdminCard
		title="Unpaid Bookings by City"
		subtitle="Use this for payment reminders and city-level follow-up."
	>
		<div class="space-y-4">
			{#each unpaidBookingsByCity as cityStat}
				<article class="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h2 class="text-xl font-black text-slate-950">{cityStat.cityName}</h2>
							<p class="mt-1 text-sm text-slate-600">
								{cityStat.unpaidBookings}
								unpaid booking{cityStat.unpaidBookings === 1 ? '' : 's'}
							</p>
						</div>
						<p class="rounded-full bg-white px-3 py-1 text-sm font-bold text-amber-700">
							€{cityStat.amountPending.toFixed(2)} pending
						</p>
					</div>

					<dl class="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
						<div class="rounded-md bg-white p-3">
							<dt class="font-semibold text-slate-500">Unpaid tickets</dt>
							<dd class="mt-1 text-2xl font-black text-slate-950">{cityStat.unpaidTickets}</dd>
						</div>
						<div class="rounded-md bg-white p-3">
							<dt class="font-semibold text-slate-500">Unpaid bookings</dt>
							<dd class="mt-1 text-2xl font-black text-slate-950">{cityStat.unpaidBookings}</dd>
						</div>
						<div class="rounded-md bg-white p-3">
							<dt class="font-semibold text-slate-500">Booking refs</dt>
							<dd class="mt-2 flex flex-wrap gap-2">
								{#each cityStat.referenceNumbers as referenceNo}
									<a
										href={routes.booking.details(referenceNo)}
										class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
									>
										{referenceNo}
									</a>
								{/each}
							</dd>
						</div>
					</dl>
				</article>
			{:else}
				<p class="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
					No unpaid bookings.
				</p>
			{/each}
		</div>
	</AdminCard>
</AdminPage>
