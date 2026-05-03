<script lang="ts">
  import type { Booking } from "$lib/domain/booking";
  import {
    canCancelBooking,
    canGenerateTickets,
    canMarkBookingPaid
  } from "$lib/domain/booking";
  import { BookingPaymentStatus } from "$lib/domain/shared/enums";

  export let data: { aRecord: Booking };

  const booking = data.aRecord;
  const canMarkAsPaid = canMarkBookingPaid(booking);
  const canGenerateTicketsAction = canGenerateTickets(booking);
  const canCancel = canCancelBooking(booking);

  const isPaid = booking.payment_status === BookingPaymentStatus.PAID;
  const allTicketsGenerated = booking.ticket_ids.length >= booking.guests.length;
  const canViewSummary = isPaid && allTicketsGenerated;
  const canSendTicketsEmail = canViewSummary;

  const isUnpaid = booking.payment_status === BookingPaymentStatus.UNPAID;
  const canSendPaymentReminderEmail = isUnpaid;
  const truncatedBookDate = String(booking.book_date).substring(0, 21);
</script>

<main class="min-h-screen bg-gradient-to-b from-[#0f172a]/80 to-[#1e293b]/80 text-white p-6">
  <article class="bg-white text-[#1e293b] rounded-lg p-5 shadow-md">
    <h1 class="text-2xl sm:text-3xl font-bold text-black mb-4">Booking Details</h1>

    <div class="space-y-2 text-sm text-gray-800">
      <p><strong>Reference No:</strong> {booking.reference_no}</p>
      <p><strong>Name:</strong> {booking.name} ({booking.email})</p>
      <p><strong>City:</strong> {booking.city}</p>
      <p><strong>Book Date:</strong> {truncatedBookDate}</p>
      <p><strong>Payment Status:</strong> {booking.payment_status}</p>
      <p><strong>Amount Total:</strong> €{booking.amount_total}</p>
      <p><strong>Guests:</strong> {booking.guests.join(", ")}</p>
      <p><strong>Ticket IDs:</strong></p>
      <ul class="list-disc list-inside text-blue-800  pl-4 py-2">
        {#each booking.ticket_ids as ticket_id}
          <li>
            <a href="/api/v0/ticket/{ticket_id}/details" class="text-blue-700 hover:underline">{ticket_id}</a>
          </li>
        {/each}
      </ul>
    </div>

    <div class="mt-6 space-y-4">
      {#if canSendPaymentReminderEmail}
        <form action="?/sendPaymentReminderEmail" method="POST">
          <button class="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md">
            Send Payment Reminder Email
          </button>
        </form>
      {/if}

      <form action="?/markPaid" method="POST">
        <button
          type="submit"
          class="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-100 disabled:cursor-not-allowed"
          disabled={!canMarkAsPaid}
        >
          Mark Paid
        </button>
      </form>

      {#if canGenerateTicketsAction}
        <form action="?/generateTickets" method="POST">
          <button type="submit" class="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-md">
            Generate Tickets
          </button>
        </form>
      {/if}

      {#if canSendTicketsEmail}
        <form action="?/sendTicketsEmail" method="POST">
          <button class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md">
            Email Tickets
          </button>
        </form>
      {/if}

      {#if canCancel}
        <form action="/api/v0/booking/{booking.reference_no}/cancel">
          <button class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md">
            Cancel Reservation
          </button>
        </form>
      {/if}

      {#if canViewSummary}
        <a href="/api/v0/booking/{booking.reference_no}/summary" class="block text-center text-cyan-700 hover:underline">
          View Booking Summary
        </a>
      {/if}
    </div>

    <div class="mt-6 text-center space-x-4">
      <a href="/api/v0/booking/list" class="text-blue-700 hover:underline">List Bookings</a>
      <span class="text-gray-500">|</span>
      <a href="/api/v0/booking/search" class="text-blue-700 hover:underline">Search</a>
    </div>

    <div class="mt-4 text-center">
      <a href="/api" class="text-blue-700 hover:underline">Admin Home</a>
    </div>
  </article>
</main>
