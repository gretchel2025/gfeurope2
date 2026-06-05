<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import { formatTicketTypeLabel } from '$lib/domain/shared/enums';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	const tickets = data.tickets ?? [];

	$: routes = adminRoutes($page.params.event_id);
</script>

<AdminPage title="Tickets" subtitle={`Count: ${tickets.length}`}>
	<div class="space-y-4">
		{#each tickets as ticket, index}
			<AdminCard>
				<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p class="text-sm font-semibold text-slate-500">{index + 1}. {ticket.ticket_id}</p>
						<h2 class="mt-1 text-lg font-semibold text-slate-950">{ticket.name}</h2>
						<p class="mt-2 text-sm text-slate-600">
							{formatTicketTypeLabel(ticket.ticket_type)} | Status: {ticket.status}
						</p>
						<p class="mt-1 text-sm text-slate-600">
							Booking Ref:
							<a
								href={routes.booking.details(ticket.booking_reference_no)}
								class="font-semibold text-blue-700 hover:underline"
							>
								{ticket.booking_reference_no}
							</a>
						</p>
					</div>

					<AdminButton href={routes.ticket.details(ticket.ticket_id)} variant="secondary"
						>Details</AdminButton
					>
				</div>
			</AdminCard>
		{:else}
			<AdminCard>
				<p class="text-sm text-slate-600">No tickets found.</p>
			</AdminCard>
		{/each}
	</div>
</AdminPage>
