<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import BackLinks from '$lib/components/admin/BackLinks.svelte';
	import DangerConfirmation from '$lib/components/admin/DangerConfirmation.svelte';
	import DetailRow from '$lib/components/admin/DetailRow.svelte';
	import type { Booking } from '$lib/domain/booking';
	import { canCancelBooking } from '$lib/domain/booking';

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
	backHref={`/api/v0/booking/${booking.reference_no}/details`}
	backLabel="Back to booking details"
>
	<div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
		<AdminCard title="Reservation">
			<dl>
				<DetailRow label="Reference No" value={booking.reference_no} />
				<DetailRow label="Name">{booking.name} ({booking.email})</DetailRow>
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
					href={`/api/v0/booking/${booking.reference_no}/details`}
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
			{ href: `/api/v0/booking/${booking.reference_no}/details`, label: 'Booking details' },
			{ href: '/api/v0/booking/list', label: 'List bookings' },
			{ href: '/api/v0/booking/search', label: 'Search' },
			{ href: '/api', label: 'Admin home' }
		]}
	/>
</AdminPage>
