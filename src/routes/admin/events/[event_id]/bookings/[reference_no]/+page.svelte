<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import BackLinks from '$lib/ui/components/admin/BackLinks.svelte';
	import DetailRow from '$lib/ui/components/admin/DetailRow.svelte';
	import type { Booking } from '$lib/domain/booking';
	import { canCancelBooking, canGenerateTickets, canMarkBookingPaid } from '$lib/domain/booking';
	import { BookingPaymentStatus, formatTicketTypeLabel } from '$lib/domain/shared/enums';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';

	export let data: { aRecord: Booking };

	const booking = data.aRecord;
	const canMarkAsPaid = canMarkBookingPaid(booking);
	const canGenerateTicketsAction = canGenerateTickets(booking);
	const canCancel = canCancelBooking(booking);
	const isPaid = booking.payment_status === BookingPaymentStatus.PAID;
	const allTicketsGenerated = booking.ticket_ids.length >= booking.guests.length;
	const canViewSummary = isPaid && allTicketsGenerated;
	const canSendTicketsEmail = canViewSummary;
	const canSendPaymentReminderEmail = booking.payment_status === BookingPaymentStatus.UNPAID;
	const bookDate = new Intl.DateTimeFormat('en', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(booking.book_date));
	const proofUrl = booking.payment_proof_url ?? '';
	const proofUrlPath = proofUrl.split('?')[0].toLowerCase();
	const isImageProof = /\.(png|jpe?g|gif|webp|avif)$/.test(proofUrlPath);

	$: routes = adminRoutes($page.params.event_id);
</script>

<AdminPage
	title="Booking Details"
	subtitle={`Reference ${booking.reference_no}`}
	backHref={routes.booking.list}
	backLabel="Back to booking list"
>
	<AdminButton
		slot="actions"
		href={routes.booking.summary(booking.reference_no)}
		disabled={!canViewSummary}
	>
		View summary
	</AdminButton>

	<div class="grid gap-6 lg:grid-cols-[1fr_18rem]">
		<AdminCard title="Reservation">
			<dl>
				<DetailRow label="Reference No" value={booking.reference_no} />
				<DetailRow label="Name">{booking.name} ({booking.email})</DetailRow>
				<DetailRow label="City" value={booking.city} />
				<DetailRow label="Book Date" value={bookDate} />
				<DetailRow label="Payment Status" value={booking.payment_status} />
				<DetailRow label="Ticket Type" value={formatTicketTypeLabel(booking.ticket_type)} />
				<DetailRow label="Amount Total" value={`EUR ${booking.amount_total}`} />
				<DetailRow label="Guests">{booking.guests.join(', ')}</DetailRow>
				<DetailRow label="Ticket IDs">
					{#if booking.ticket_ids.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each booking.ticket_ids as ticketId}
								<a
									href={routes.ticket.details(ticketId)}
									class="font-semibold text-blue-700 hover:underline"
								>
									{ticketId}
								</a>
							{/each}
						</div>
					{:else}
						<span class="text-slate-500">No tickets generated yet</span>
					{/if}
				</DetailRow>
			</dl>
		</AdminCard>

		<div class="lg:col-span-2">
			<AdminCard title="Payment Proof" subtitle="Uploaded bank-transfer receipt.">
				{#if booking.payment_proof_url}
					<div class="space-y-4">
						<div class="overflow-hidden rounded-md border border-slate-200 bg-white">
							{#if isImageProof}
								<img
									src={booking.payment_proof_url}
									alt={`Payment proof for ${booking.reference_no}`}
									class="max-h-[40rem] w-full object-contain"
								/>
							{:else}
								<iframe
									src={booking.payment_proof_url}
									title={`Payment proof for ${booking.reference_no}`}
									class="h-[28rem] w-full"
								/>
							{/if}
						</div>
						<a
							href={booking.payment_proof_url}
							target="_blank"
							rel="noreferrer"
							class="inline-flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
						>
							Open proof in new tab
						</a>
					</div>
				{:else}
					<p class="text-sm text-slate-600">No proof has been uploaded.</p>
				{/if}
			</AdminCard>
		</div>

		<div class="lg:col-span-2">
			<AdminCard title="Actions" subtitle="Use these when the booking changes state.">
				<div class="space-y-3">
					{#if canSendPaymentReminderEmail}
						<form action="?/sendPaymentReminderEmail" method="POST">
							<AdminButton type="submit" variant="warning" fullWidth
								>Send payment reminder</AdminButton
							>
						</form>
					{/if}

					<form action="?/markPaid" method="POST">
						<AdminButton type="submit" variant="success" disabled={!canMarkAsPaid} fullWidth
							>Mark paid</AdminButton
						>
					</form>

					{#if canGenerateTicketsAction}
						<form action="?/generateTickets" method="POST">
							<AdminButton type="submit" fullWidth>Generate tickets</AdminButton>
						</form>
					{/if}

					{#if canSendTicketsEmail}
						<form action="?/sendTicketsEmail" method="POST">
							<AdminButton type="submit" fullWidth>Email tickets</AdminButton>
						</form>
					{/if}

					{#if canCancel}
						<AdminButton
							href={routes.booking.cancel(booking.reference_no)}
							variant="danger"
							fullWidth
						>
							Cancel reservation
						</AdminButton>
					{/if}
				</div>
			</AdminCard>
		</div>
	</div>

	<BackLinks
		links={[
			{ href: routes.booking.list, label: 'List bookings' },
			{ href: routes.booking.search(), label: 'Search' },
			{ href: routes.home, label: 'Admin home' }
		]}
	/>
</AdminPage>
