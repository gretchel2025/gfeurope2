<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import DetailRow from '$lib/components/admin/DetailRow.svelte';
	import type { TicketCounter } from '$lib/domain/ticketCounter';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	type CounterSummary = {
		title: string;
		href: string;
		counter: TicketCounter;
	};

	const counters: CounterSummary[] = [
		{
			title: 'Standard Tickets',
			href: '/api/v0/ticket_counter/standard_tickets/details',
			counter: data.standardTicketCounter
		},
		{
			title: 'VIP Tickets',
			href: '/api/v0/ticket_counter/vip_tickets/details',
			counter: data.vipTicketCounter
		},
		{
			title: 'Youth Tickets',
			href: '/api/v0/ticket_counter/youth_tickets/details',
			counter: data.youthTicketCounter
		}
	];
</script>

<AdminPage
	title="Admin Dashboard"
	subtitle="Operational tools for bookings, tickets, reports, and event setup."
>
	<div class="grid gap-4 md:grid-cols-3">
		<AdminCard title="Bookings" subtitle="Find reservations and manage payment state.">
			<div class="flex flex-wrap gap-2">
				<AdminButton href="/api/v0/booking/list">List bookings</AdminButton>
				<AdminButton href="/api/v0/booking/search" variant="secondary">Search</AdminButton>
			</div>
		</AdminCard>

		<AdminCard title="Tickets" subtitle="Inspect generated tickets and QR links.">
			<AdminButton href="/api/v0/ticket/list">List tickets</AdminButton>
		</AdminCard>

		<AdminCard title="Reports" subtitle="Review sales and booking breakdowns.">
			<AdminButton href="/api/reports">All reports</AdminButton>
		</AdminCard>
	</div>

	<AdminCard title="Ticket Counters" subtitle="Current inventory by ticket type.">
		<div class="grid gap-4 md:grid-cols-3">
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
		<AdminButton href="/api/system" variant="secondary">System settings</AdminButton>
	</AdminCard>
</AdminPage>
