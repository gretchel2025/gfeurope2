<script lang="ts">
	import { HelpCircle, MailQuestion } from 'lucide-svelte';

	let showEmailHelp = false;
	let showBookingHelp = false;
</script>

<main
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/80 px-4 py-10 text-white"
>
	<article
		class="w-full max-w-lg rounded-xl bg-black/60 p-6 text-center shadow-md backdrop-blur-md"
	>
		<hgroup class="mb-6">
			<h1 class="text-3xl font-bold text-yellow-400 sm:text-4xl">Successfully Booked</h1>
			<h2 class="text-lg text-blue-100 sm:text-xl">
				Please check your email for payment instructions.
			</h2>
		</hgroup>

		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
			<button
				type="button"
				on:click={() => (showEmailHelp = !showEmailHelp)}
				class="flex items-center justify-center gap-2 rounded-md border-2 border-red-500 px-5 py-3 text-red-400 transition hover:bg-red-500 hover:text-white"
			>
				<MailQuestion class="h-5 w-5" />
				Didn't get our email?
			</button>

			<button
				type="button"
				on:click={() => (showBookingHelp = !showBookingHelp)}
				class="flex items-center justify-center gap-2 rounded-md border-2 border-cyan-400 px-5 py-3 text-cyan-300 transition hover:bg-cyan-400 hover:text-black"
			>
				<HelpCircle class="h-5 w-5" />
				Need help with your booking?
			</button>
		</div>

		{#if showEmailHelp}
			<p class="mb-4 rounded-md bg-white px-4 py-3 text-gray-800">
				Check your spam or junk folder.
			</p>
		{/if}

		{#if showBookingHelp}
			<p class="mb-4 rounded-md bg-white px-4 py-3 text-gray-800">
				Send us an email at <strong>help@grandfeast.eu</strong>.
			</p>
		{/if}

		<div class="mt-4 space-x-4 text-sm">
			<a href="/newbooking" class="text-blue-400 hover:underline">Book Another</a>
			<span class="text-gray-500">|</span>
			<a href="/" class="text-blue-400 hover:underline">Home</a>
		</div>
	</article>
</main>
