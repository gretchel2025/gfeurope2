<script lang="ts">
	import { formatTicketTypeLabel } from '$lib/domain/shared/enums';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;
	const booking = data.booking;
	const ticketsData = data.ticketsData;

	function printPage() {
		window.print();
	}

	$: routes = adminRoutes($page.params.event_id);
</script>

<main class="min-h-screen bg-white px-4 py-8 text-gray-800">
	{#if booking}
		<section class="max-w-4xl mx-auto">
			<div class="text-center mb-8">
				<h1 class="text-3xl sm:text-4xl font-bold text-yellow-600">
					Booking Reference: {booking.reference_no}
				</h1>
				<hr class="my-4 border-yellow-400" />
			</div>

			{#each ticketsData as ticketData, i}
				<div class="bg-gray-100 rounded-lg p-4 mb-6 shadow-sm">
					<h2 class="text-xl font-semibold text-blue-600 mb-2">
						#{i + 1}: Ticket {ticketData.ticket.ticket_id}
					</h2>
					<p><strong>Name:</strong> {ticketData.ticket.name}</p>
					<p><strong>Class:</strong> {formatTicketTypeLabel(ticketData.ticket.ticket_type)}</p>
					<p class="mt-3 font-semibold">QR Code:</p>
					<img
						src={ticketData.qrCodeData.imageData}
						alt="QR Code"
						class="mt-2 w-40 h-40 object-contain"
					/>
				</div>
			{/each}

			<div class="bg-white rounded-lg p-6 shadow-md mb-6">
				<h2 class="text-2xl font-bold text-yellow-600 mb-4">Booking Summary</h2>
				<p>
					{booking.ticket_ids.length}
					{formatTicketTypeLabel(booking.ticket_type)} tickets, €{booking.amount_total},
					{booking.payment_status}
				</p>

				<div class="mt-4">
					<h3 class="text-lg font-semibold mb-2">Guests:</h3>
					<ol class="list-decimal pl-5">
						{#each booking.guests as guest}
							<li>{guest}</li>
						{/each}
					</ol>
				</div>
			</div>

			<div class="bg-white rounded-lg p-6 shadow-md mb-6">
				<h2 class="text-2xl font-bold text-yellow-600 mb-4">Event Details</h2>
				<ul class="list-disc pl-5 space-y-1">
					<li>2026 EU and UK Grand Feast in Dublin</li>
					<li>Date: October 3, 2026</li>
					<li>Time: 12:00 PM Registration, 12:30 PM Holy Mass, 1:30 PM Event Proper</li>
					<li>Venue: St. Helen's Hotel</li>
					<li>Address: Stillorgan Road, Blackrock, Ireland, Dublin A94 V6W3</li>
				</ul>
			</div>

			<div class="text-center text-sm text-gray-600">
				<p>We hope you have a great time at the event!</p>
				<p class="mt-1">Have a blessed day!</p>
				<p>The Grand Feast EU and UK Team</p>
			</div>

			<div class="text-center mt-6">
				<button
					on:click={printPage}
					class="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-md shadow"
					>Print this page</button
				>
			</div>
		</section>
	{/if}

	{#if booking}
		<nav class="mt-10 text-center text-blue-500 space-x-4 text-sm">
			<a href={routes.booking.details(booking.reference_no)} class="hover:underline"
				>Back to Details</a
			>
			<a href={routes.booking.list} class="hover:underline">List Bookings</a>
			<a href={routes.booking.search()} class="hover:underline">Search</a>
			<a href={routes.home} class="hover:underline">Admin Home</a>
		</nav>
	{/if}
</main>
