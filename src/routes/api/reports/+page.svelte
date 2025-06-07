<script lang="ts">
  import type { ServerData } from "./+page.server";

  export let data: ServerData;
  const topCities = data?.topCities ? data.topCities : [];
</script>

<main class="min-h-screen px-4 py-10 bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
     <div class="mt-8 text-center">
      <a href="/api" class="text-blue-600 font-medium hover:underline dark:text-blue-400">← Back to Admin Home</a>
    </div>

  <article class="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
    <hgroup class="text-center mb-8">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Top Ticket Sales</h1>
      <h2 class="text-base sm:text-lg text-gray-600 font-semibold dark:text-gray-300">By City</h2>
    </hgroup>

    <div class="space-y-6">
      {#each topCities as cityStat, i}
        <div class="p-4 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-700 dark:border-gray-600">
          <p class="text-lg font-bold text-gray-800 dark:text-yellow-300">
            {i + 1}. {cityStat.cityName} — {(cityStat.percentOfThisCitysBookingsOverAllBookings * 100).toFixed(2)}%
          </p>
          <ul class="text-sm text-gray-700 leading-relaxed dark:text-gray-200 px-4 py-2">
            <li>Tickets Booked: {cityStat.totalBookings}</li>
            <li>Paid: {cityStat.totalPaidBookings} | Unpaid: {cityStat.totalUnpaidBookings}</li>
            <li>Sold: {(cityStat.percentOfPaidBookings * 100).toFixed(0)}%</li>
          </ul>
        </div>
      {/each}
    </div>

    <div class="mt-8 text-center">
      <a href="/api" class="text-blue-600 font-medium hover:underline dark:text-blue-400">← Back to Admin Home</a>
    </div>
  </article>
</main>


