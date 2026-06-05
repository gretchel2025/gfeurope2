<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import DetailRow from '$lib/components/admin/DetailRow.svelte';
	import type { TicketCounter } from '$lib/domain/ticketCounter';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	type CounterSummary = {
		title: string;
		href: string;
		counter: TicketCounter;
	};

	$: routes = adminRoutes($page.params.event_id);
	$: counters = [
		{
			title: 'Standard Tickets',
			href: routes.ticketCounter.details('STANDARD'),
			counter: data.standardTicketCounter
		},
		{
			title: 'GrandFeast Plus Tickets',
			href: routes.ticketCounter.details('GRAND_FEAST_PLUS'),
			counter: data.grandFeastPlusTicketCounter
		}
	] satisfies CounterSummary[];
</script>

<AdminPage
	title="Admin Dashboard"
	subtitle="Operational tools for bookings, tickets, reports, and event setup."
>
	<div class="grid gap-4 md:grid-cols-3">
		<AdminCard title="Bookings" subtitle="Find reservations and manage payment state.">
			<div class="flex flex-wrap gap-2">
				<AdminButton href={routes.booking.list}>List bookings</AdminButton>
				<AdminButton href={routes.booking.search()} variant="secondary">Search</AdminButton>
			</div>
		</AdminCard>

		<AdminCard title="Tickets" subtitle="Inspect generated tickets and QR links.">
			<div class="flex flex-wrap gap-2">
				<AdminButton href={routes.ticket.list}>List tickets</AdminButton>
				<AdminButton href={routes.booking.search()} variant="secondary">Search</AdminButton>
			</div>
		</AdminCard>

		<AdminCard title="Reports" subtitle="Review sales and booking breakdowns.">
			<AdminButton href={routes.reports}>All reports</AdminButton>
		</AdminCard>
	</div>

	<AdminCard title="Ticket Counters" subtitle="Current inventory by ticket type.">
		<div class="grid gap-4 md:grid-cols-2">
			{#each counters as item}
				<article class="rounded-md border border-slate-200 bg-slate-50 p-4">
					<h3 class="font-semibold text-slate-950">{item.title}</h3>
					<dl class="mt-3">
						<DetailRow label="Available" value={item.counter.available} />
						<DetailRow label="Reserved" value={item.counter.reserved} />
						<DetailRow label="Sold" value={item.counter.sold} />
					</dl>
					<div class="mt-4">
						<AdminButton href={item.href} variant="secondary">Update</AdminButton>
					</div>
				</article>
			{/each}
		</div>
	</AdminCard>

	<AdminCard title="System" subtitle="Super-user operations and booking availability.">
		<AdminButton href={routes.system} variant="secondary">System settings</AdminButton>
	</AdminCard>
</AdminPage>
