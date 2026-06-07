<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import AuditHistorySection from '$lib/ui/components/admin/AuditHistorySection.svelte';
	import BackLinks from '$lib/ui/components/admin/BackLinks.svelte';
	import DetailRow from '$lib/ui/components/admin/DetailRow.svelte';
	import { formatTicketTypeLabel } from '$lib/domain/shared/enums';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: routes = adminRoutes($page.params.event_id);
	$: editNameHref = `${routes.ticket.details(data.aTicket.ticket_id)}?edit_name=true`;
	$: loadHistoryHref = `${routes.ticket.details(data.aTicket.ticket_id)}?load_history=true#history`;
</script>

<AdminPage
	title="Ticket Details"
	subtitle={`Ticket ${data.aTicket.ticket_id}`}
	backHref={routes.ticket.list}
	backLabel="Back to ticket list"
>
	<div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
				<DetailRow label="Name">
					{#if data.nameEditMode}
						<form action="?/updateName" method="POST" class="min-w-0 space-y-3">
							<label for="ticket-name" class="sr-only">Ticket holder name</label>
							<input
								id="ticket-name"
								name="name"
								value={data.aTicket.name}
								required
								maxlength="160"
								class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
							/>
							<div class="flex flex-wrap gap-2">
								<AdminButton type="submit" variant="success" loadingText="Saving...">
									Save name
								</AdminButton>
								<AdminButton
									href={routes.ticket.details(data.aTicket.ticket_id)}
									variant="secondary"
								>
									Cancel
								</AdminButton>
							</div>
						</form>
					{:else}
						<div class="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<span class="min-w-0">{data.aTicket.name}</span>
							<AdminButton href={editNameHref} variant="secondary">Change</AdminButton>
						</div>
					{/if}
				</DetailRow>
				<DetailRow label="Ticket Type" value={formatTicketTypeLabel(data.aTicket.ticket_type)} />
				<DetailRow label="Status" value={data.aTicket.status} />
			</dl>
		</AdminCard>

		<AdminCard title="Check-in QR Code">
			<div class="min-w-0 space-y-3 text-center">
				<img
					src={data.checkin.imageData}
					alt="QR Code"
					class="mx-auto h-48 w-48 rounded border border-slate-300"
				/>
				<p class="break-all text-xs text-slate-600">{data.checkin.targetURL}</p>
				<AdminButton href={routes.ticket.checkin(data.aTicket.ticket_id)} fullWidth>
					View check-in
				</AdminButton>
			</div>
		</AdminCard>

		<div class="min-w-0 lg:col-span-2">
			<AuditHistorySection
				title="Ticket History"
				subtitle="Audit events related to this ticket."
				events={data.auditEvents}
				historyLoaded={data.historyLoaded}
				{loadHistoryHref}
			/>
		</div>
	</div>

	<BackLinks
		links={[
			{ href: routes.ticket.list, label: 'List tickets' },
			{ href: routes.home, label: 'Dashboard' }
		]}
	/>
</AdminPage>
