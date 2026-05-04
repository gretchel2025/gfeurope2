<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import BackLinks from '$lib/components/admin/BackLinks.svelte';
	import DetailRow from '$lib/components/admin/DetailRow.svelte';
	import type { Booking } from '$lib/domain/booking';
	import { canCancelBooking, canGenerateTickets, canMarkBookingPaid } from '$lib/domain/booking';
	import { BookingPaymentStatus } from '$lib/domain/shared/enums';

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
</script>

<AdminPage
	title="Booking Details"
	subtitle={`Reference ${booking.reference_no}`}
	backHref="/api/v0/booking/list"
	backLabel="Back to booking list"
>
	<AdminButton
		slot="actions"
		href={`/api/v0/booking/${booking.reference_no}/summary`}
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
				<DetailRow label="Amount Total" value={`EUR ${booking.amount_total}`} />
				<DetailRow label="Guests">{booking.guests.join(', ')}</DetailRow>
				<DetailRow label="Ticket IDs">
					{#if booking.ticket_ids.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each booking.ticket_ids as ticketId}
								<a
									href={`/api/v0/ticket/${ticketId}/details`}
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
						href={`/api/v0/booking/${booking.reference_no}/cancel`}
						variant="danger"
						fullWidth
					>
						Cancel reservation
					</AdminButton>
				{/if}
			</div>
		</AdminCard>
	</div>

	<BackLinks
		links={[
			{ href: '/api/v0/booking/list', label: 'List bookings' },
			{ href: '/api/v0/booking/search', label: 'Search' },
			{ href: '/api', label: 'Admin home' }
		]}
	/>
</AdminPage>
