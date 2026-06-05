<script lang="ts">
	import { page } from '$app/stores';
	import CountdownTimer from '$lib/ui/components/public/CountdownTimer.svelte';
	import { computeTicketPricing, isEarlyBirdDiscountActive } from '$lib/domain/ticketType';
	import type { TicketTypeConfig } from '$lib/domain/ticketType';
	import { publicRoutes } from '$lib/navigation/adminRoutes';

	export let ticketTypes: TicketTypeConfig[];

	$: publicNav = publicRoutes($page.params.event_id);

	let ticketsSection: HTMLElement;
	const eventDate = new Date('2026-10-03T12:30:00+01:00');
	const now = new Date();
	const standardTicket = ticketTypes.find((ticket) => ticket.ticket_type_id === 'STANDARD');
	const grandFeastPlusTicket = ticketTypes.find(
		(ticket) => ticket.ticket_type_id === 'GRAND_FEAST_PLUS'
	);
	const standardPricing = standardTicket ? computeTicketPricing(standardTicket, 1, now) : null;
	const grandFeastPlusPricing = grandFeastPlusTicket
		? computeTicketPricing(grandFeastPlusTicket, 1, now)
		: null;
	let earlyBirdActive = Boolean(standardTicket && isEarlyBirdDiscountActive(standardTicket, now));
	let countdown = '';
	if (earlyBirdActive && standardTicket?.early_bird_discount_available_until) {
		const diff = Date.parse(standardTicket.early_bird_discount_available_until) - now.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
		countdown = `${days}d ${hours}h left`;
	}

	function scrollToTickets() {
		ticketsSection?.scrollIntoView({ behavior: 'smooth' });
	}

	function formatMoney(value: number, currency = 'EUR') {
		if (currency !== 'EUR') {
			return `${value.toFixed(2)} ${currency}`;
		}
		return `${value.toFixed(0)} €`;
	}

	function formatDate(value: string) {
		const [dateOnly] = value.split('T');
		if (dateOnly) {
			return new Intl.DateTimeFormat('en', {
				month: 'long',
				day: 'numeric',
				timeZone: 'UTC'
			}).format(new Date(`${dateOnly}T00:00:00Z`));
		}

		return new Intl.DateTimeFormat('en', {
			month: 'long',
			day: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(value));
	}
</script>

<section class="relative px-4 pb-20 pt-12 sm:pt-16">
	<div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
		<div class="space-y-8">
			<div class="space-y-4">
				<p class="conference-kicker">Dublin, Ireland</p>
				<h1 class="conference-title text-6xl uppercase sm:text-7xl md:text-8xl">TOGETHER 2026</h1>
				<p class="max-w-3xl text-2xl font-black uppercase leading-tight text-white sm:text-4xl">
					October 3, 2026
				</p>
				<p class="max-w-2xl text-lg italic leading-8 text-[#fff3df]/80 sm:text-xl">
					“In him the whole building is joined together and rises to become a holy temple in the
					Lord.” — <span class="font-bold text-[#f3c15f]">Ephesians 2:21</span>
				</p>
			</div>

			<div class="max-w-3xl">
				<CountdownTimer target={eventDate} />
			</div>

			<div class="flex flex-col gap-3 sm:flex-row">
				<button
					type="button"
					on:click={scrollToTickets}
					class="conference-button px-8 py-4 text-sm"
				>
					Buy Ticket
				</button>
				<a href="#details" class="conference-button-secondary px-8 py-4 text-sm"> Event Details </a>
			</div>
		</div>

		<div class="conference-gold-panel conference-map-panel min-h-[30rem] p-8 shadow-2xl">
			<div class="relative z-10 flex h-full flex-col justify-between gap-10">
				<div>
					<p class="text-sm font-black uppercase tracking-[0.22em] text-[#061922]/70">Ireland</p>
					<p class="mt-10 text-6xl font-black uppercase leading-none text-white sm:text-7xl">
						Dublin
					</p>
					<div class="mt-6 text-xl font-black leading-tight text-white">
						<p>St. Helen's Hotel</p>
						<p>Dublin A94 V6W3</p>
					</div>
				</div>
				<div class="border-t border-white/45 pt-6">
					<p class="text-4xl font-black text-white">Together 2026</p>
					<p class="mt-2 text-sm font-black uppercase tracking-[0.18em] text-[#061922]/72">
						Grand Feast EU and UK
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<section id="speakers" class="px-4 py-20">
	<div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
		<div class="conference-panel p-3">
			<img
				src="https://res.cloudinary.com/dg2u7fmoc/image/upload/v1748121253/poster2_rdfj6w.png"
				alt="Grand Feast EU and UK 2026"
				class="relative z-10 h-auto w-full"
			/>
		</div>

		<div class="conference-panel p-6 sm:p-8">
			<p class="conference-kicker">Message from Feast Dublin</p>
			<h3 class="conference-section-title mt-3 text-4xl sm:text-5xl">Together</h3>

			<div class="conference-copy mt-6 space-y-4">
				<p>
					In a world that has mastered digital connection, we have somehow become more isolated than
					ever. We scroll through crowded feeds yet wake up feeling unseen, carrying our heaviest
					burdens in absolute silence.
				</p>

				<p>
					If you have felt that ache lately, we want to remind you of a simple truth: You were never
					meant to walk through this life alone.
				</p>

				<p>
					When God designed humanity, He built us for communion—first with Him, and then with one
					another. He designed a rhythm of life where your joy multiplies when shared, and your
					sorrow divides when carried by a brother or sister. The Church isn't a building you visit;
					it is a home. And this year, we are calling everyone back to the hearth.
				</p>

				<p>Our focus for the Grand Feast 2026 is singular, profound, and urgent: Together.</p>

				<p class="border-l-4 border-[#d99a32] pl-4 italic text-[#fff3df]">
					“In him the whole building is joined together and rises to become a holy temple in the
					Lord.” — <span class="font-bold text-[#f3c15f]">Ephesians 2:21</span>
				</p>

				<p>
					This is a sacred space where you don't have to pretend to have it all figured out. You are
					invited to bring your whole self—your faith, your doubts, your victories, and your
					weariness. When we gather, the walls that divide us crumble. We find wisdom in our shared
					stories, wonder in His presence, and a unified voice of worship that shakes the heavens.
				</p>

				<h4 class="text-xl font-black text-[#f3c15f]">There is a Seat for You</h4>

				<p>
					Consider this your personal invitation. Whether you have been walking with the Lord for
					decades, or you are just curious and taking your very first steps toward faith—there is a
					seat at the table with your name on it.
				</p>

				<p>Come to be refreshed by stepping into an environment of pure worship.</p>

				<p>Come to be connected to a community that will stand by you.</p>

				<p>Come to encounter Christ, the chief cornerstone who binds us all in love.</p>

				<p>
					We are ready to heal, grow, and move forward—not in isolation, but as one body. Join us
					for Together 2026. We are stronger, braver, and better when we are together.
				</p>

				<div class="pt-6 text-sm text-[#fff3df]/70">
					<p>With open arms,</p>
					<p class="font-semibold text-white">Bro Lando Patolilic</p>
					<p>Feast Dublin Builder</p>
				</div>
			</div>
		</div>
	</div>
</section>

<section id="details" class="relative px-4 py-24">
	<div class="max-w-5xl mx-auto">
		<p class="conference-kicker text-center">Venue and Schedule</p>
		<h2 class="conference-section-title mt-3 mb-12 text-center text-4xl md:text-5xl">
			Event Details
		</h2>

		<div class="conference-panel p-6 sm:p-8">
			<h3 class="text-2xl md:text-3xl font-black text-center text-white mb-8">
				2026 EU and UK Grand Feast in Dublin
			</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
				<div class="conference-card p-5 flex items-start gap-4">
					<div class="text-[#f3c15f] text-2xl">🕒</div>
					<div>
						<h4 class="text-lg font-black text-[#f3c15f]">Time</h4>
						<p class="text-white">12:00 PM Registration</p>
						<p class="text-white">12:30 PM Holy Mass</p>
						<p class="text-white">1:30 PM Event Proper</p>
					</div>
				</div>
				<div class="conference-card p-5 flex items-start gap-4">
					<div class="text-[#f3c15f] text-2xl">📅</div>
					<div>
						<h4 class="text-lg font-black text-[#f3c15f]">Date</h4>
						<p class="text-white">October 3, 2026</p>
					</div>
				</div>
			</div>

			<div class="conference-card p-5 flex items-start gap-4 mb-8">
				<div class="text-[#f3c15f] text-2xl">📍</div>
				<div>
					<h4 class="text-lg font-black text-[#f3c15f]">Location</h4>
					<p class="text-white">St. Helen's Hotel</p>
					<p class="text-white">Stillorgan Road, Blackrock, Ireland</p>
					<p class="text-white">Dublin A94 V6W3</p>
					<a
						href="https://maps.app.goo.gl/NrBmaQBgKgAZreERA"
						rel="external nofollow noopener"
						target="_blank"
						class="mt-3 inline-block font-semibold text-[#f3c15f] underline underline-offset-4 transition hover:text-white"
					>
						View on Google Maps
					</a>
				</div>
			</div>

			<div class="mt-8 overflow-hidden border border-white/10 shadow-md">
				<iframe
					src="https://www.google.com/maps?q=St.%20Helen%27s%20Hotel%2C%20Stillorgan%20Road%2C%20Blackrock%2C%20Ireland%2C%20Dublin%20A94%20V6W3&output=embed"
					title="St. Helen's Hotel Location"
					width="100%"
					height="400"
					class="w-full border-none shadow-lg"
					allowfullscreen
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				/>
			</div>
		</div>
	</div>
</section>

<section id="tickets" bind:this={ticketsSection} class="relative px-4 py-24">
	<div class="container mx-auto">
		<p class="conference-kicker text-center">Choose Your Pass</p>
		<h2 class="conference-section-title mt-3 mb-16 text-center text-4xl md:text-5xl">
			Ticket Types
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
			<div
				class="ticket-card p-6 flex flex-col transition-transform duration-300 ease-in-out hover:-translate-y-1"
			>
				<h3 class="text-2xl font-bold mb-2 text-white">{standardTicket?.label ?? 'Standard'}</h3>

				{#if earlyBirdActive && standardTicket && standardPricing}
					<div class="conference-pill mb-2 px-2 py-1">
						Early Bird <span class="ml-2 text-xs text-[#fff3df]/80">{countdown}</span>
					</div>
					<p class="mb-3 text-sm text-[#fff3df]/70">
						Until {formatDate(standardTicket.early_bird_discount_available_until ?? '')} only
					</p>

					<div class="mb-6">
						<div class="text-2xl text-[#fff3df]/45 line-through">
							{formatMoney(standardTicket.base_price, standardTicket.currency)}
						</div>
						<div class="text-4xl font-black text-[#f3c15f]">
							{formatMoney(standardPricing.unitPrice, standardTicket.currency)}
						</div>
					</div>
				{:else}
					<div class="text-4xl font-black mb-6 text-[#f3c15f]">
						{formatMoney(standardTicket?.base_price ?? 35, standardTicket?.currency)}
					</div>
				{/if}

				<ul class="mb-8 flex-grow text-[#fff3df]/80 space-y-3">
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">✔</span>General admission
					</li>
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">✔</span>Standard seating
					</li>
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">✔</span>
						{earlyBirdActive
							? '10% group discount starts after Early Bird'
							: '10% group discount for 5+ tickets'}
					</li>
				</ul>

				<a
					href={publicNav.newBooking}
					data-sveltekit-reload
					class="conference-button px-5 py-3 text-sm"
				>
					Select
				</a>
			</div>

			<div
				class="ticket-card p-6 flex flex-col relative border-[#d99a32]/70 shadow-lg transition-transform duration-300 ease-in-out hover:-translate-y-1 md:-mt-4"
			>
				<div class="conference-pill mb-4 w-fit px-3 py-1">PLUS EXPERIENCE</div>
				<h3 class="text-2xl font-bold mb-2 text-white">
					{grandFeastPlusTicket?.label ?? 'GrandFeast Plus'}
				</h3>

				<div class="text-4xl font-black mb-2 text-[#f3c15f]">
					{formatMoney(
						grandFeastPlusPricing?.unitPrice ?? grandFeastPlusTicket?.base_price ?? 65,
						grandFeastPlusTicket?.currency
					)}
				</div>

				<p class="text-[#f3c15f] text-sm mb-4">
					Includes pilgrimage to Our Lady of Knock on Oct 4 plus sightseeing
				</p>
				<ul class="mb-8 flex-grow text-[#fff3df]/80 space-y-3">
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">🎟</span>Grand Feast admission
					</li>
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">🙏</span>Our Lady of Knock pilgrimage
					</li>
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">🗺</span>Oct 4 sightseeing
					</li>
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">✔</span>
						{grandFeastPlusTicket?.bulk_purchase_discount_rate
							? `${Math.round(grandFeastPlusTicket.bulk_purchase_discount_rate * 100)}% family discount for ${grandFeastPlusTicket.bulk_purchase_discount_min_quantity}+ tickets`
							: 'Family discount where eligible'}
					</li>
				</ul>
				<a
					href={publicNav.newBooking}
					data-sveltekit-reload
					class="conference-button px-5 py-3 text-sm"
				>
					Select
				</a>
			</div>
			<div
				class="ticket-card p-6 flex flex-col transition-transform duration-300 ease-in-out hover:-translate-y-1"
			>
				<h3 class="text-2xl font-bold mb-4 text-white">Child</h3>
				<div class="text-4xl font-black mb-2 text-[#f3c15f]">FREE</div>
				<p class="text-[#fff3df]/70 text-sm mb-4">Under 12 years old</p>
				<ul class="mb-8 flex-grow text-[#fff3df]/80 space-y-3">
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">✔</span>General admission
					</li>
					<li class="flex items-center">
						<span class="text-[#f3c15f] mr-2">✔</span>Must be with a paying adult
					</li>
				</ul>
				<p class="text-sm font-semibold text-[#fff3df]/70">No ticket reservation needed</p>
			</div>
		</div>
	</div>
</section>
