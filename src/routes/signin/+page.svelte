<script lang="ts">
  import { signIn, signOut } from "@auth/sveltekit/client";
  import { page } from "$app/stores";
</script>

<main class="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/80 text-white">
  <article class="w-full max-w-md bg-black/70 rounded-xl shadow-lg p-8 text-center space-y-6">
    <h1 class="text-3xl font-bold text-yellow-400">Log In</h1>

    {#if $page.data.session?.user}
      <div class="space-y-4">
        <p class="text-blue-100">Signed in as <span class="font-semibold text-white">{$page.data.session.user.email}</span></p>
        <button
          on:click={signOut}
          class="w-full py-3 px-6 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition"
        >
          Sign Out
        </button>
        <a href="/api" class="text-blue-400 hover:underline">Go to Admin Page</a>
      </div>
    {:else}
      <div class="space-y-4">
        <p class="text-blue-100">Not signed in</p>
        <button
          on:click={() => signIn('google')}
          class="w-full py-3 px-6 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition"
        >
          Sign in with Google
        </button>
      </div>
    {/if}
  </article>
</main>
