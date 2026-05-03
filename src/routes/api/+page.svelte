<script lang="ts">
    import type { ServerData } from "./+page.server";
    export let data: ServerData;
    import '@picocss/pico'
    import { signIn, signOut } from "@auth/sveltekit/client"
    import { page } from "$app/stores"

    async function signOutCurrentUser() {
      await signOut();
    }
</script>

<main class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <section class="max-w-4xl mx-auto px-6 sm:px-10 py-8 space-y-10 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">


   <header class="text-center">
      <h1 class="text-3xl font-bold text-[#1b2c2d] dark:text-yellow-300 mb-2">Admin Dashboard</h1>

      {#if $page.data.session?.user}
        <p class="text-gray-700 dark:text-gray-300 text-lg">
          Welcome {$page.data.session.user.email} 
        </p>
        <div class="mt-4 flex justify-center">
          <button
            on:click={signOutCurrentUser}
            class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Sign out
          </button>
        </div>

      {:else}
        <p class="text-sm text-gray-600 dark:text-gray-400">Welcome to the app admin homepage</p>
        <button
          on:click={() => signIn('google')}
          class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign in
        </button>
      {/if}
    </header>

    <!-- BOOKINGS & TICKETS -->
    <section>
      <h2 class="text-xl font-semibold mb-2">Bookings</h2>
      <ul class="space-y-2 list-disc list-inside text-blue-600 dark:text-blue-400">
        <li><a href="/api/v0/booking/list" class="hover:underline">List</a></li>
        <li><a href="/api/v0/booking/search" class="hover:underline">Search</a></li>
        <!-- <li><a href="/newbooking" class="hover:underline">Create</a></li> -->
      </ul>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-2">Tickets</h2>
      <ul class="space-y-2 list-disc list-inside text-blue-600 dark:text-blue-400">
        <li><a href="/api/v0/ticket/list" class="hover:underline">List</a></li>
      </ul>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-2">Reports</h2>
      <ul class="space-y-2 list-disc list-inside text-blue-600 dark:text-blue-400">
        <li><a href="/api/reports" class="hover:underline">All Reports</a></li>
      </ul>
    </section>

    <!-- TICKET COUNTERS -->
    <section>
      <h2 class="text-xl font-semibold mb-4">Ticket Counters</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <div class="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 class="font-semibold text-[#1b2c2d] dark:text-white">Standard Tickets</h3>
          <p>{data.standardTicketCounter.available} available</p>
          <p>{data.standardTicketCounter.reserved} reserved</p>
          <p>{data.standardTicketCounter.sold} sold</p>
          <a href="/api/v0/ticket_counter/standard_tickets/details" class="text-blue-600 dark:text-blue-400 hover:underline">Update</a>
        </div>

        <div class="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 class="font-semibold text-[#1b2c2d] dark:text-white">VIP Tickets</h3>
          <p>{data.vipTicketCounter.available} available</p>
          <p>{data.vipTicketCounter.reserved} reserved</p>
          <p>{data.vipTicketCounter.sold} sold</p>
          <a href="/api/v0/ticket_counter/vip_tickets/details" class="text-blue-600 dark:text-blue-400 hover:underline">Update</a>
        </div>

        <div class="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 class="font-semibold text-[#1b2c2d] dark:text-white">Youth Tickets</h3>
          <p>{data.youthTicketCounter.available} available</p>
          <p>{data.youthTicketCounter.reserved} reserved</p>
          <p>{data.youthTicketCounter.sold} sold</p>
          <a href="/api/v0/ticket_counter/youth_tickets/details" class="text-blue-600 dark:text-blue-400 hover:underline">Update</a>
        </div>
      </div>
    </section>

    <!-- OTHERS -->
    <section>
      <h2 class="text-xl font-semibold mb-2">Others</h2>
      <ul class="space-y-2 list-disc list-inside text-blue-600 dark:text-blue-400">
        <li><a href="/api/system" class="hover:underline">System Settings</a></li>
      </ul>
   </section>
</main>
