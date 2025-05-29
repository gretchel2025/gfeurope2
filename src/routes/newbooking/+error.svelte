<script lang="ts">
  function refreshPage() {
    location.reload();
  }
</script>

<main class="container min-h-screen flex items-center justify-center px-4">
  <article class="text-center max-w-md w-full bg-black/60 p-6 rounded-xl shadow-lg backdrop-blur-md">
    <hgroup class="mb-6 space-y-1">
      <h1 class="text-3xl sm:text-4xl font-bold text-white">🚧 Server Busy</h1>
      <h2 class="text-lg sm:text-xl text-yellow-300">Please refresh and try again</h2>
    </hgroup>

    <div class="flex flex-col sm:flex-row justify-center gap-4">
      <button
        on:click={refreshPage}
        class="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-md transition"
      >
        🔄 Refresh
      </button>

      <a
        href="/api"
        class="px-6 py-3 bg-white text-gray-900 font-semibold rounded-md hover:bg-gray-100 transition text-center"
      >
        🏠 Admin Home
      </a>
    </div>
  </article>
</main>

