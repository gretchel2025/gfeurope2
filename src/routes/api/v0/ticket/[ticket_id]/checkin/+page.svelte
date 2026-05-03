<script lang="ts">
    import type { ServerData } from "./+page.server";
    import { canCheckInTicket, canCheckOutTicket } from "$lib/domain/ticket";

    export let data: ServerData;

    const canDoCheckIn = canCheckInTicket(data.aBooking, data.aTicket);
    const canDoCheckOut = canCheckOutTicket(data.aBooking, data.aTicket);
</script>

<main class="min-h-screen px-4 py-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
  {#if data.aTicket}
    <article class="max-w-xl mx-auto bg-white text-gray-900 rounded-lg shadow-md p-6 dark:bg-slate-800 dark:text-white">
      <h1 class="text-2xl font-bold text-black-400 mb-4">Ticket Check-In</h1>

      <div class="space-y-2 text-sm">
        <p><strong>Ticket ID:</strong> <a class="text-blue-600 underline" href="details">{data.aTicket.ticket_id}</a></p>
        <p><strong>Booking Ref:</strong> <a class="text-blue-600 underline" href="/api/v0/booking/{data.aTicket.booking_reference_no}/details">{data.aTicket.booking_reference_no}</a></p>
        <p><strong>Name:</strong> {data.aTicket.name}</p>
        <p><strong>Ticket Type:</strong> {data.aTicket.ticket_type}</p>
        <p><strong>Status:</strong> {data.aTicket.status}</p>
      </div>

      <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-start">
        <form action="?/checkIn" method="POST">
          <button type="submit" class="w-full sm:w-auto px-4 py-2 rounded-md font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-40" disabled={!canDoCheckIn}>
            ✅ Check-In
          </button>
        </form>

        <form action="?/checkOut" method="POST">
          <button type="submit" class="w-full sm:w-auto px-4 py-2 rounded-md font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40" disabled={!canDoCheckOut}>
            🔄 Check-Out
          </button>
        </form>
      </div>

      <div class="mt-6 text-sm">
        <a href="/api/v0/ticket/list" class="text-blue-800 hover:underline">Back to Tickets List</a>
      </div>
    </article>
  {/if}

  <div class="text-center mt-6 text-sm">
    <a href="/api" class="text-blue-300 hover:underline"> Back to Admin Home</a>
  </div>
</main>
