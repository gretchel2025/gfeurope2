<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import BackLinks from '$lib/components/admin/BackLinks.svelte';
	import DangerConfirmation from '$lib/components/admin/DangerConfirmation.svelte';
	import DetailRow from '$lib/components/admin/DetailRow.svelte';
	import type { Booking } from '$lib/domain/booking';
	import { canCancelBooking } from '$lib/domain/booking';
	import { formatTicketTypeLabel } from '$lib/domain/shared/enums';
	import { adminRoutes } from '$lib/navigation/adminRoutes';

	export let data: {
		aRecord: Booking;
	};

	const booking = data.aRecord;
	const bookingCanBeCancelled = canCancelBooking(booking);

	let userHasConfirmed = false;
	let userHasUnderstood = false;

	$: canDoCancel = bookingCanBeCancelled && userHasConfirmed && userHasUnderstood;
</script>

<AdminPage
	title="Cancel Booking"
	subtitle="Returns reserved tickets to available inventory."
	backHref={adminRoutes.booking.details(booking.reference_no)}
	backLabel="Back to booking details"
>
	<div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
		<AdminCard title="Reservation">
			<dl>
				<DetailRow label="Reference No" value={booking.reference_no} />
				<DetailRow label="Name">{booking.name} ({booking.email})</DetailRow>
				<DetailRow label="Payment Status" value={booking.payment_status} />
				<DetailRow label="Ticket Type" value={formatTicketTypeLabel(booking.ticket_type)} />
				<DetailRow label="Amount Total" value={`EUR ${booking.amount_total}`} />
				<DetailRow label="Guests">{booking.guests.join(', ')}</DetailRow>
				<DetailRow label="Ticket IDs">
					{#if booking.ticket_ids.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each booking.ticket_ids as ticketId}
								<a
									href={adminRoutes.ticket.details(ticketId)}
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

		<AdminCard title="Confirm cancellation" subtitle="Use this only for unpaid reservations.">
			<div class="space-y-4">
				<DangerConfirmation
					bind:firstChecked={userHasConfirmed}
					bind:secondChecked={userHasUnderstood}
					firstLabel="I confirm that I wish to cancel this booking."
					secondLabel="I understand that cancelled bookings cannot be restored."
				/>

				<form action="?/cancelBooking" method="POST">
					<AdminButton type="submit" variant="danger" disabled={!canDoCancel} fullWidth>
						Proceed with cancellation
					</AdminButton>
				</form>

				<AdminButton
					href={adminRoutes.booking.details(booking.reference_no)}
					variant="secondary"
					fullWidth
				>
					No, back to safety
				</AdminButton>
			</div>
		</AdminCard>
	</div>

	<BackLinks
		links={[
			{ href: adminRoutes.booking.details(booking.reference_no), label: 'Booking details' },
			{ href: adminRoutes.booking.list, label: 'List bookings' },
			{ href: adminRoutes.booking.search(), label: 'Search' },
			{ href: adminRoutes.home, label: 'Admin home' }
		]}
	/>
</AdminPage>
