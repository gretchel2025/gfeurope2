<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import { formatTicketTypeLabel } from '$lib/domain/shared/enums';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;
	const bookings = data.bookings ?? [];

	$: routes = adminRoutes($page.params.event_id);
</script>

<AdminPage title="Bookings" subtitle={`Count: ${bookings.length}`}>
	<AdminButton slot="actions" href={routes.booking.search()} variant="secondary"
		>Search bookings</AdminButton
	>

	<div class="space-y-4">
		{#each bookings as booking, index}
			<AdminCard>
				<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p class="text-sm font-semibold text-slate-500">
							{bookings.length - index}. {booking.reference_no}
						</p>
						<h2 class="mt-1 text-lg font-semibold text-slate-950">{booking.name}</h2>
						<p class="mt-2 text-sm text-slate-600">
							{booking.guests.length}
							{formatTicketTypeLabel(booking.ticket_type)} tickets | {booking.amount_total} EUR |
							{booking.payment_status}
						</p>

						{#if booking.ticket_ids.length > 0}
							<div class="mt-3 flex flex-wrap gap-2 text-sm">
								{#each booking.ticket_ids as ticketId}
									<a
										href={routes.ticket.details(ticketId)}
										class="font-semibold text-blue-700 hover:underline"
									>
										{ticketId}
									</a>
								{/each}
							</div>
						{/if}
					</div>

					<AdminButton href={routes.booking.details(booking.reference_no)} variant="secondary"
						>Details</AdminButton
					>
				</div>
			</AdminCard>
		{:else}
			<AdminCard>
				<p class="text-sm text-slate-600">No bookings found.</p>
			</AdminCard>
		{/each}
	</div>
</AdminPage>
