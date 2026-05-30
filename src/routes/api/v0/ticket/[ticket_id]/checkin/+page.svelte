<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import BackLinks from '$lib/components/admin/BackLinks.svelte';
	import DetailRow from '$lib/components/admin/DetailRow.svelte';
	import { formatTicketTypeLabel } from '$lib/domain/shared/enums';
	import { canCheckInTicket, canCheckOutTicket } from '$lib/domain/ticket';
	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	const canDoCheckIn = canCheckInTicket(data.aBooking, data.aTicket);
	const canDoCheckOut = canCheckOutTicket(data.aBooking, data.aTicket);
</script>

<AdminPage
	title="Ticket Check-In"
	subtitle={`Ticket ${data.aTicket.ticket_id}`}
	backHref={adminRoutes.ticket.list}
	backLabel="Back to ticket list"
>
	<div class="grid gap-6 lg:grid-cols-[1fr_18rem]">
		<AdminCard title="Ticket">
			<dl>
				<DetailRow label="Ticket ID">
					<a class="font-semibold text-blue-700 hover:underline" href="details"
						>{data.aTicket.ticket_id}</a
					>
				</DetailRow>
				<DetailRow label="Booking Ref">
					<a
						class="font-semibold text-blue-700 hover:underline"
						href={adminRoutes.booking.details(data.aTicket.booking_reference_no)}
					>
						{data.aTicket.booking_reference_no}
					</a>
				</DetailRow>
				<DetailRow label="Name" value={data.aTicket.name} />
				<DetailRow label="Ticket Type" value={formatTicketTypeLabel(data.aTicket.ticket_type)} />
				<DetailRow label="Status" value={data.aTicket.status} />
			</dl>
		</AdminCard>

		<AdminCard
			title="Check-in actions"
			subtitle="Buttons follow the current ticket and booking state."
		>
			<div class="space-y-3">
				<form action="?/checkIn" method="POST">
					<AdminButton type="submit" variant="success" disabled={!canDoCheckIn} fullWidth
						>Check in</AdminButton
					>
				</form>

				<form action="?/checkOut" method="POST">
					<AdminButton type="submit" variant="danger" disabled={!canDoCheckOut} fullWidth
						>Check out</AdminButton
					>
				</form>
			</div>
		</AdminCard>
	</div>

	<BackLinks
		links={[
			{ href: adminRoutes.ticket.list, label: 'List tickets' },
			{ href: adminRoutes.home, label: 'Admin home' }
		]}
	/>
</AdminPage>
