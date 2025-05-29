<script lang="ts">
  import type { Booking } from "$lib/entities/models";
  import type { ServerData } from "./+page.server";

  export let data: ServerData;
  const bookings = data?.bookings ?? [];
</script>

<main class="min-h-screen px-4 py-10 bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/80 text-white">
  <article class="max-w-4xl mx-auto text-center mb-10">
    <hgroup>
      <h1 class="text-3xl sm:text-4xl font-bold text-yellow-400">Bookings List</h1>
      <h2 class="text-lg sm:text-xl text-blue-200">Count: {bookings.length}</h2>
    </hgroup>
  </article>

  <div class="max-w-4xl mx-auto space-y-6">
    {#each bookings as booking, i}
      <article class="bg-black/60 backdrop-blur rounded-lg p-5 shadow-md">
        <p class="mb-1 text-sm text-yellow-300 font-semibold">
          [{bookings.length - i}] reference_no:
          <a
            class="text-blue-300 hover:underline"
            href={`/api/v0/booking/${booking.reference_no}/details`}
          >
            {booking.reference_no}
          </a>
          —
          <span class="text-white">{booking.email}</span>
        </p>

        <p class="text-blue-100 text-sm mb-1">
          🎟 {booking.guests.length} {booking.ticket_type} tickets |
          💰 {booking.amount_total} EUR |
          🧾 {booking.payment_status}
        </p>

        <p class="text-sm text-blue-200">
          ticket_ids:
          <span class="text-white">
            [
            {#each booking.ticket_ids as ticket_id}
              <a
                class="text-blue-400 hover:underline"
                href={`/api/v0/ticket/${ticket_id}/details`}
              >
                {ticket_id}
              </a>{' '}
            {/each}]
          </span>
        </p>
      </article>
    {/each}
  </div>

  <footer class="mt-10 text-center">
    <a
      href="/api"
      class="text-blue-400 hover:underline font-semibold text-sm"
    >
      ← back to admin home
    </a>
  </footer>
</main>