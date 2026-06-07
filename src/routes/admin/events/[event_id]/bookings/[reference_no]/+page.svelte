<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import AuditHistorySection from '$lib/ui/components/admin/AuditHistorySection.svelte';
	import BackLinks from '$lib/ui/components/admin/BackLinks.svelte';
	import DetailRow from '$lib/ui/components/admin/DetailRow.svelte';
	import {
		canCancelBooking,
		canGenerateTickets,
		canMarkBookingPaid,
		getPaymentProofDisplayType
	} from '$lib/domain/booking';
	import {
		BookingConfirmationEmailStatus,
		BookingPaymentStatus,
		formatTicketTypeLabel
	} from '$lib/domain/shared/enums';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	const booking = data.aRecord;
	const canMarkAsPaid = canMarkBookingPaid(booking);
	const canGenerateTicketsAction = canGenerateTickets(booking);
	const canCancel = canCancelBooking(booking);
	const isPaid = booking.payment_status === BookingPaymentStatus.PAID;
	const allTicketsGenerated = booking.ticket_ids.length >= booking.guests.length;
	const canViewSummary = isPaid && allTicketsGenerated;
	const bookingEmailDeliveryFailed =
		booking.booking_confirmation_email_status === BookingConfirmationEmailStatus.FAILED;
	const emailActionBlockedReason = bookingEmailDeliveryFailed
		? `Email actions are blocked because the confirmation email failed${
				booking.booking_confirmation_email_error
					? `: ${booking.booking_confirmation_email_error}`
					: '.'
			}`
		: '';
	const canSendTicketsEmail = canViewSummary && !bookingEmailDeliveryFailed;
	const canSendPaymentReminderEmail =
		booking.payment_status === BookingPaymentStatus.UNPAID && !bookingEmailDeliveryFailed;
	const confirmationEmailStatus = formatConfirmationEmailStatus(
		booking.booking_confirmation_email_status
	);
	const confirmationEmailStatusDetail = formatConfirmationEmailStatusDetail(
		booking.booking_confirmation_email_status,
		booking.booking_confirmation_email_provider_id
	);
	const confirmationEmailAttemptedAt = booking.booking_confirmation_email_attempted_at
		? new Intl.DateTimeFormat('en', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(booking.booking_confirmation_email_attempted_at))
		: '';
	const confirmationEmailStatusUpdatedAt = booking.booking_confirmation_email_status_updated_at
		? new Intl.DateTimeFormat('en', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(booking.booking_confirmation_email_status_updated_at))
		: '';
	const bookDate = new Intl.DateTimeFormat('en', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(booking.book_date));
	const proofUrl = booking.payment_proof_url ?? '';
	const proofDisplayType = getPaymentProofDisplayType(proofUrl);
	const isImageProof = proofDisplayType === 'image';
	const isPdfProof = proofDisplayType === 'pdf';

	function bookingDetailsHref(options: {
		loadHistory?: boolean;
		showPaymentProofImage?: boolean;
		hash?: string;
	}) {
		const params = new URLSearchParams();
		if (options.loadHistory) {
			params.set('load_history', 'true');
		}
		if (options.showPaymentProofImage) {
			params.set('show_payment_proof_image', 'true');
		}

		const query = params.toString();
		return `${routes.booking.details(booking.reference_no)}${query ? `?${query}` : ''}${
			options.hash ?? ''
		}`;
	}

	$: routes = adminRoutes($page.params.event_id);
	$: loadHistoryHref = bookingDetailsHref({
		loadHistory: true,
		showPaymentProofImage: data.paymentProofImageLoaded,
		hash: '#history'
	});
	$: loadPaymentProofImageHref = bookingDetailsHref({
		loadHistory: data.historyLoaded,
		showPaymentProofImage: true,
		hash: '#payment-proof'
	});
	$: paymentProofHref = routes.booking.paymentProof(booking.reference_no);

	function formatConfirmationEmailStatus(status: string) {
		switch (status) {
			case 'SENT':
				return 'Accepted by email provider';
			case 'DELIVERED':
				return 'Delivered';
			case 'FAILED':
				return 'Failed';
			case 'SKIPPED':
				return 'Not sent';
			case 'PENDING':
				return 'Pending';
			case 'UNKNOWN':
				return 'Unknown';
			default:
				return status;
		}
	}

	function formatConfirmationEmailStatusDetail(status: string, providerId: string | undefined) {
		switch (status) {
			case 'SENT':
				return providerId
					? 'Waiting for the provider delivery result.'
					: 'Delivery result is unavailable for this email.';
			case 'DELIVERED':
				return 'The provider reported this email as delivered.';
			case 'FAILED':
				return 'The provider rejected delivery or reported a delivery failure.';
			case 'SKIPPED':
				return 'Email sending is not configured for this environment.';
			case 'PENDING':
				return 'Email sending has not completed yet.';
			default:
				return '';
		}
	}
</script>

<AdminPage
	title="Booking Details"
	subtitle={`Reference ${booking.reference_no}`}
	backHref={routes.booking.list}
	backLabel="Back to Bookings"
>
	<div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
		<div class="min-w-0 [&>.admin-card]:h-full">
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
					<DetailRow
						label="Tickets Email Sent"
						value={booking.tickets_sent_to_client ? 'Yes' : 'No'}
					/>
					<DetailRow label="Confirmation Email">
						<div class="space-y-1">
							<p class="font-semibold">{confirmationEmailStatus}</p>
							{#if confirmationEmailStatusDetail}
								<p class="text-xs text-slate-500">{confirmationEmailStatusDetail}</p>
							{/if}
							{#if confirmationEmailAttemptedAt}
								<p class="text-xs text-slate-500">Send attempted: {confirmationEmailAttemptedAt}</p>
							{/if}
							{#if confirmationEmailStatusUpdatedAt}
								<p class="text-xs text-slate-500">
									Status updated: {confirmationEmailStatusUpdatedAt}
								</p>
							{/if}
							{#if booking.booking_confirmation_email_error}
								<p class="text-xs font-semibold text-red-700">
									{booking.booking_confirmation_email_error}
								</p>
							{/if}
						</div>
					</DetailRow>
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
		</div>

		<div class="min-w-0 [&>.admin-card]:h-full">
			<AdminCard title="Actions" subtitle="Use these when the booking changes state.">
				<div class="space-y-3">
					{#if emailActionBlockedReason}
						<p
							class="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800"
						>
							{emailActionBlockedReason}
						</p>
					{/if}

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

		<div id="payment-proof" class="min-w-0 scroll-mt-6 lg:col-span-2">
			<AdminCard title="Payment Proof" subtitle="Uploaded bank-transfer receipt.">
				{#if booking.payment_proof_url}
					<div class="min-w-0 space-y-4">
						{#if data.paymentProofImageLoaded}
							<div class="overflow-hidden rounded-md border border-slate-200 bg-white">
								{#if isImageProof}
									<img
										src={paymentProofHref}
										alt={`Payment proof for ${booking.reference_no}`}
										class="max-h-[40rem] w-full object-contain"
									/>
								{:else if isPdfProof}
									<object
										data={paymentProofHref}
										type="application/pdf"
										aria-label={`Payment proof PDF for ${booking.reference_no}`}
										data-testid="payment-proof-pdf-preview"
										class="h-[32rem] w-full"
									>
										<div class="p-4 text-sm text-slate-600">
											PDF preview is unavailable in this browser. Use the open link below to view
											the uploaded proof.
										</div>
									</object>
								{:else}
									<div class="p-4 text-sm text-slate-600">
										This uploaded proof type cannot be previewed inline. Use the open link below to
										view it.
									</div>
								{/if}
							</div>
						{:else}
							<div class="rounded-md border border-slate-200 bg-slate-50 p-4">
								<p class="text-sm text-slate-600">
									Preview is not loaded to save data. Load it only when you need to inspect the
									uploaded proof.
								</p>
								<div class="mt-4">
									<AdminButton href={loadPaymentProofImageHref} variant="secondary">
										Load proof preview
									</AdminButton>
								</div>
							</div>
						{/if}
						<a
							href={paymentProofHref}
							target="_blank"
							rel="noreferrer"
							class="inline-flex min-w-0 break-words text-sm font-semibold text-blue-700 underline underline-offset-4 transition hover:text-blue-900"
						>
							Open proof in new tab
						</a>
					</div>
				{:else}
					<p class="text-sm text-slate-600">No proof has been uploaded.</p>
				{/if}
			</AdminCard>
		</div>

		<div class="min-w-0 lg:col-span-2">
			<AuditHistorySection
				title="Booking History"
				subtitle="Audit events related to this booking."
				events={data.auditEvents}
				historyLoaded={data.historyLoaded}
				{loadHistoryHref}
			/>
		</div>
	</div>

	<BackLinks
		links={[
			{ href: routes.booking.list, label: 'Bookings' },
			{ href: routes.booking.search(), label: 'Search' },
			{ href: routes.home, label: 'Dashboard' }
		]}
	/>
</AdminPage>
