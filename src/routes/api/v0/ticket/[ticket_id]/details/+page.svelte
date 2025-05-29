<script lang="ts">
    import type { ServerData } from "./+page.server";

    export let data: ServerData;
</script>

<main class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4 py-8">
  {#if data.aTicket}
    <article class="max-w-xl mx-auto bg-black/60 backdrop-blur-md rounded-lg shadow-md p-6 space-y-6">
      <header class="text-center space-y-1">
        <h1 class="text-3xl font-bold text-yellow-400">Ticket Details</h1>
      </header>

      <div class="text-blue-100 text-sm space-y-1">
        <p><strong>Ticket ID:</strong> {data.aTicket.ticket_id}</p>
        <p><strong>Booking Ref:</strong>
          <a href="/api/v0/booking/{data.aTicket.booking_reference_no}/details" class="text-cyan-400 hover:underline">
            {data.aTicket.booking_reference_no}
          </a>
        </p>
        <p><strong>Name:</strong> {data.aTicket.name}</p>
        <p><strong>Type:</strong> {data.aTicket.ticket_type}</p>
        <p><strong>Status:</strong> {data.aTicket.status}</p>
      </div>

      <div class="space-y-2 text-center">
        <h2 class="text-lg font-semibold text-yellow-300">Check-in QR Code</h2>
        <img src="{data.checkin.imageData}" alt="QR Code" class="mx-auto w-48 h-48 rounded border border-white"/>
        <p class="text-sm text-blue-200">QR code target: <strong class="text-white">{data.checkin.targetURL}</strong></p>
      </div>

      <div class="text-center space-x-4">
        <a href="./checkin" class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md">
          View Check-In
        </a>
        <a href="/api/v0/ticket/list" class="text-sm text-cyan-300 hover:underline">List Tickets</a>
      </div>
    </article>
  {/if}

  <div class="mt-8 text-center">
    <a href="/api" class="text-blue-300 hover:underline text-sm">Admin Home</a>
  </div>
</main>
