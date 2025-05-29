<script lang="ts">
  import type { ServerData } from "./+page.server";

  export let data: ServerData;

  const tickets = data?.tickets ? data.tickets : [];
</script>

<main class="min-h-screen px-4 py-10 bg-gradient-to-br from-slate-900 to-gray-800 text-white">
  <article class="max-w-4xl mx-auto text-center mb-6">
    <h1 class="text-3xl sm:text-4xl font-bold text-yellow-400">Tickets List</h1>
    <h2 class="text-lg sm:text-xl text-blue-200">Count: {tickets.length}</h2>
  </article>

  <section class="max-w-4xl mx-auto space-y-6">
    {#each tickets as ticket, i}
      <div class="bg-black/60 backdrop-blur-md p-4 rounded-lg shadow-md">
        <p class="text-sm text-yellow-300 mb-1 font-semibold">[{i + 1}] Ticket ID:</p>
        <p class="text-white">
          <a href="/api/v0/ticket/{ticket.ticket_id}/details" class="text-blue-400 hover:underline">{ticket.ticket_id}</a>
        </p>
        <p class="text-blue-100">{ticket.name} | {ticket.ticket_type} | Status: {ticket.status}</p>
        <p class="text-sm text-white">
          Booking Ref:
          <a href="/api/v0/booking/{ticket.booking_reference_no}/details" class="text-blue-400 hover:underline">
            {ticket.booking_reference_no}
          </a>
        </p>
      </div>
    {/each}
  </section>

  <div class="max-w-4xl mx-auto mt-8 text-center">
    <a href="/api" class="text-blue-400 hover:underline">Admin Home</a>
  </div>
</main>
