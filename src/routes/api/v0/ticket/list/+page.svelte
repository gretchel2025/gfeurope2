<script lang="ts">
  import type { ServerData } from "./+page.server";

  export let data: ServerData;

  const tickets = data?.tickets ? data.tickets : [];
</script>

<main class="min-h-screen px-4 py-10 bg-gradient-to-br from-slate-900 to-gray-800 text-white">
  <div class="max-w-4xl mx-auto mt-8 text-center">
    <a href="/api" class="text-blue-400 hover:underline">Back to Admin Home</a>
  </div>
  <article class="max-w-4xl mx-auto text-center mb-6">
    <h1 class="text-3xl sm:text-4xl font-bold text-black-400">Tickets List</h1>
    <h2 class="text-lg sm:text-xl text-blue-700">Count: {tickets.length}</h2>
  </article>

  <section class="max-w-4xl mx-auto space-y-6 bg-white text-gray-800 p-6 rounded-md shadow">
  {#each tickets as ticket, i}
    <div class="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
      <p class="text-sm text-[#4b2e16] mb-1 font-semibold">{i + 1}. Ticket ID:
        <a href="/api/v0/ticket/{ticket.ticket_id}/details" class="text-blue-700 hover:underline">
          {ticket.ticket_id}
        </a>
      </p>
      <p class="text-gray-700 mb-0 leading-tight">{ticket.name} | {ticket.ticket_type} | Status: {ticket.status}</p>

      <p class="text-sm text-gray-700">
        Booking Ref:
        <a href="/api/v0/booking/{ticket.booking_reference_no}/details" class="text-blue-700 hover:underline">
          {ticket.booking_reference_no}
        </a>
      </p>
    </div>
  {/each}
</section>

  <div class="max-w-4xl mx-auto mt-8 text-center">
    <a href="/api" class="text-blue-400 hover:underline">Back to Admin Home</a>
  </div>

</main>
