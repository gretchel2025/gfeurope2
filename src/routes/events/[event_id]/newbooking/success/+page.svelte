<script lang="ts">
	import { page } from '$app/stores';
	import { HelpCircle, MailQuestion } from 'lucide-svelte';
	import { getCommunicationDetailsForEvent } from '$lib/domain/eventCommunication';
	import { publicRoutes } from '$lib/navigation/adminRoutes';

	let showEmailHelp = false;
	let showBookingHelp = false;

	$: publicNav = publicRoutes($page.params.event_id);
	$: communicationDetails = getCommunicationDetailsForEvent($page.params.event_id);
</script>

<section class="public-status-page">
	<article class="conference-panel public-status-card w-full max-w-lg p-6 text-center sm:p-8">
		<hgroup class="mb-6">
			<p class="conference-kicker">Reservation received</p>
			<h1 class="public-status-title mt-3 text-3xl font-black text-white sm:text-4xl">
				Successfully Booked
			</h1>
			<h2 class="public-status-copy mt-3 text-lg text-[#fff3df]/75 sm:text-xl">
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
			<p class="public-status-help mb-4 bg-[#fff3df] px-4 py-3 text-[#061922]">
				Check your spam or junk folder.
			</p>
		{/if}

		{#if showBookingHelp}
			<p class="public-status-help mb-4 bg-[#fff3df] px-4 py-3 text-[#061922]">
				Send us an email at
				<a
					href={`mailto:${communicationDetails.email}`}
					class="font-black underline underline-offset-4"
				>
					{communicationDetails.email}.
				</a>
			</p>
		{/if}

		<div class="mt-6 flex flex-wrap justify-center gap-4 text-sm font-semibold">
			<a href={publicNav.newBooking} class="public-status-link text-[#f3c15f] hover:underline">
				Book Another
			</a>
			<a href={publicNav.home} class="public-status-link text-[#f3c15f] hover:underline">Home</a>
		</div>
	</article>
</section>
