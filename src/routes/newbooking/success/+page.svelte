<script lang="ts">
	import { HelpCircle, MailQuestion } from 'lucide-svelte';

	let showEmailHelp = false;
	let showBookingHelp = false;
</script>

<section class="public-status-page">
	<article class="conference-panel w-full max-w-lg p-6 text-center sm:p-8">
		<hgroup class="mb-6">
			<p class="conference-kicker">Reservation received</p>
			<h1 class="mt-3 text-3xl font-black text-white sm:text-4xl">Successfully Booked</h1>
			<h2 class="mt-3 text-lg text-[#fff3df]/75 sm:text-xl">
				Your reservation and proof of payment were received. Please check your email for
				confirmation.
			</h2>
		</hgroup>

		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
			<button
				type="button"
				on:click={() => (showEmailHelp = !showEmailHelp)}
				class="conference-button-secondary px-5 py-3"
			>
				<MailQuestion class="h-5 w-5" />
				Didn't get our email?
			</button>

			<button
				type="button"
				on:click={() => (showBookingHelp = !showBookingHelp)}
				class="conference-button-secondary px-5 py-3"
			>
				<HelpCircle class="h-5 w-5" />
				Need help with your booking?
			</button>
		</div>

		{#if showEmailHelp}
			<p class="mb-4 bg-[#fff3df] px-4 py-3 text-[#061922]">Check your spam or junk folder.</p>
		{/if}

		{#if showBookingHelp}
			<p class="mb-4 bg-[#fff3df] px-4 py-3 text-[#061922]">
				Send us an email at <strong>help@grandfeast.eu</strong>.
			</p>
		{/if}

		<div class="mt-6 flex flex-wrap justify-center gap-4 text-sm font-semibold">
			<a href="/newbooking" class="text-[#f3c15f] hover:underline">Book Another</a>
			<a href="/" class="text-[#f3c15f] hover:underline">Home</a>
		</div>
	</article>
</section>
