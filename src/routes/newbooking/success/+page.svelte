<script lang="ts">
  import { Fade, Card } from '@sveltestrap/sveltestrap';
  import { MailQuestion, HelpCircle } from 'lucide-svelte';

  let showEmailHelp = false;
  let showBookingHelp = false;

  let emailTimer: NodeJS.Timeout;
  let helpTimer: NodeJS.Timeout;

  function toggleEmailHelp() {
    clearTimeout(emailTimer);
    showEmailHelp = true;
    emailTimer = setTimeout(() => showEmailHelp = false, 7000);
  }

  function toggleBookingHelp() {
    clearTimeout(helpTimer);
    showBookingHelp = true;
    helpTimer = setTimeout(() => showBookingHelp = false, 7000);
  }
</script>

<main class="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/80 text-white">
  <article class="max-w-lg w-full text-center bg-black/60 backdrop-blur-md p-6 rounded-xl shadow-md">
    <hgroup class="mb-6">
      <h1 class="text-3xl sm:text-4xl font-bold text-yellow-400">✅ Successfully Booked</h1>
      <h2 class="text-lg sm:text-xl text-blue-100">Please check your email for payment instructions.</h2>
    </hgroup>

    <div class="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6 mb-6">
      <button
        on:click={toggleEmailHelp}
        class="flex items-center justify-center gap-2 px-5 py-3 border-2 border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition"
      >
        <MailQuestion class="w-5 h-5" />
        Didn't get our email?
      </button>

      <button
        on:click={toggleBookingHelp}
        class="flex items-center justify-center gap-2 px-5 py-3 border-2 border-cyan-400 text-cyan-400 rounded-md hover:bg-cyan-400 hover:text-black transition"
      >
        <HelpCircle class="w-5 h-5" />
        Need help with your booking?
      </button>
    </div>

    <Fade isOpen={showEmailHelp}>
      <Card body class="bg-white text-gray-800 mb-4">Check your spam or junk folder.</Card>
    </Fade>

    <Fade isOpen={showBookingHelp}>
      <Card body class="bg-white text-gray-800 mb-4">Send us an email at <strong>help@grandfeast.eu</strong></Card>
    </Fade>

    <div class="mt-4 space-x-4 text-sm">
      <a href="/newbooking" class="text-blue-400 hover:underline">Book Another</a>
      <span class="text-gray-500">|</span>
      <a href="/" class="text-blue-400 hover:underline">Home</a>
    </div>
  </article>
</main>
