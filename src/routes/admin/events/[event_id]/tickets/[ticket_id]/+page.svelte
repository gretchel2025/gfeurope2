<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import BackLinks from '$lib/ui/components/admin/BackLinks.svelte';
	import DetailRow from '$lib/ui/components/admin/DetailRow.svelte';
	import { formatTicketTypeLabel } from '$lib/domain/shared/enums';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: routes = adminRoutes($page.params.event_id);
</script>

<AdminPage
	title="Ticket Details"
	subtitle={`Ticket ${data.aTicket.ticket_id}`}
	backHref={routes.ticket.list}
	backLabel="Back to ticket list"
>
	<div class="grid gap-6 lg:grid-cols-[1fr_18rem]">
		<AdminCard title="Ticket">
			<dl>
				<DetailRow label="Ticket ID" value={data.aTicket.ticket_id} />
				<DetailRow label="Booking Ref">
					<a
						href={routes.booking.details(data.aTicket.booking_reference_no)}
						class="font-semibold text-blue-700 hover:underline"
					>
						{data.aTicket.booking_reference_no}
					</a>
				</DetailRow>
				<DetailRow label="Name" value={data.aTicket.name} />
				<DetailRow label="Type" value={formatTicketTypeLabel(data.aTicket.ticket_type)} />
				<DetailRow label="Status" value={data.aTicket.status} />
			</dl>
		</AdminCard>

		<AdminCard title="Check-in QR Code">
			<div class="space-y-3 text-center">
				<img
					src={data.checkin.imageData}
					alt="QR Code"
					class="mx-auto h-48 w-48 rounded border border-slate-300"
				/>
				<p class="break-all text-xs text-slate-600">{data.checkin.targetURL}</p>
				<AdminButton href="./checkin" fullWidth>View check-in</AdminButton>
			</div>
		</AdminCard>
	</div>

	<BackLinks
		links={[
			{ href: routes.ticket.list, label: 'List tickets' },
			{ href: routes.home, label: 'Admin home' }
		]}
	/>
</AdminPage>
