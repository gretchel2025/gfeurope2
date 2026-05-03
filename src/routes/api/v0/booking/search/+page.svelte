<script lang="ts">
    export let data

    let searchValue: string = ""
</script>

<main class="min-h-screen px-4 py-10 bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <section class="max-w-xl mx-auto">
    <h1 class="text-2xl sm:text-3xl font-bold text-center mb-6 text-yellow-500">Search Booking Reference</h1>

    <div class="space-y-4">
      <label for="referenceNo" class="block font-medium">Booking Reference Number:</label>
      <input
        type="text"
        id="referenceNo"
        placeholder="Enter booking reference number"
        bind:value={searchValue}
        class="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
      <a href={`/api/v0/booking/search?reference_no=${searchValue}`}
        class="block w-full text-center bg-[#1b2c2d] hover:bg-[#083c40] text-white hover:text-[#fae6c8] font-bold py-2 rounded-md transition">
        Search
      </a>
    </div>

    {#if data?.noneFound}
      <p class="mt-6 text-red-500 font-semibold text-center">Booking reference number not found.</p>
    {/if}

    {#if data?.bookings?.length > 0}
      <div class="mt-8 space-y-6">
        <h2 class="text-xl font-semibold text-blue-700 dark:text-blue-300">Search Results</h2>
        {#each data.bookings as booking}
          <div class="p-4 border rounded-md bg-gray-100 dark:bg-gray-800">
            <p><strong>Reference No:</strong> {booking.reference_no}</p>
            <p><strong>Name:</strong> {booking.name}</p>
            <p><strong>Status:</strong> {booking.payment_status}</p>
            <a
              href={`/api/v0/booking/${booking.reference_no}/details`}
              class="mt-3 inline-block bg-[#1b2c2d] hover:bg-[#083c40] text-white hover:text-[#fae6c8] font-semibold px-4 py-2 rounded-md"
            >
              View Details
            </a>
          </div>
        {/each}
      </div>
    {/if}

    <div class="mt-10 text-center">
      <a href="/api" class="text-blue-500 hover:underline">Admin Home</a>
    </div>
  </section>
</main>
