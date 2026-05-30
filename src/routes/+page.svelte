<script lang="ts">
	import CountdownTimer from '$lib/components/public/CountdownTimer.svelte';
	import { isStandardEarlyBirdActive, STANDARD_EARLY_BIRD_DEADLINE } from '$lib/domain/booking';

	let ticketsSection: HTMLElement;
	const eventDate = new Date('2026-10-03T12:30:00+01:00');
	const earlyBirdDeadline = STANDARD_EARLY_BIRD_DEADLINE;

	const now = new Date();
	let earlyBirdActive = isStandardEarlyBirdActive(now);

	let countdown = '';
	if (earlyBirdActive) {
		const diff = earlyBirdDeadline.getTime() - now.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
		countdown = `${days}d ${hours}h left`;
	}

	function scrollToTickets() {
		ticketsSection?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<section class="relative z-10 py-16 sm:py-20 px-4 text-center">
	<div class="max-w-5xl mx-auto">
		<p class="text-center italic text-lg sm:text-xl text-blue-200 mb-6 px-4">
			“In him the whole building is joined together and rises to become a holy temple in the Lord.”
			— <span class="font-semibold text-green-300">Ephesians 2:21</span>
		</p>
		<br />
		<h1
			class="text-6xl sm:text-7xl font-extrabold mb-4 text-green-400 tracking-wide animate-fadeInUp"
		>
			Together
		</h1>

		<h2
			class="text-3xl sm:text-4xl md:text-5xl font-light mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-teal-200 to-white drop-shadow"
		>
			GRAND FEAST EU AND UK 2026
		</h2>
		<br />
		<div class="flex flex-wrap justify-center items-center gap-4 mb-4">
			<p class="text-lg sm:text-xl md:text-2xl text-blue-100">October 3, 2026</p>
			<span class="text-lg sm:text-xl md:text-2xl text-green-400">• Dublin, Ireland</span>
		</div>

		<div class="mb-8">
			<CountdownTimer target={eventDate} />
		</div>
	</div>

	<button
		type="button"
		on:click={scrollToTickets}
		class="bg-gradient-to-r from-blue-600 to-teal-400 px-10 py-4 rounded-full text-white text-base sm:text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform duration-200"
	>
		BUY TICKET
	</button>
</section>

<section id="speakers" class="py-20 bg-[#0c0f1d] text-white">
	<div class="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
		<div class="md:w-1/2 w-full">
			<img
				src="https://res.cloudinary.com/dg2u7fmoc/image/upload/v1748121253/poster2_rdfj6w.png"
				alt="Grand Feast EU and UK 2026"
				class="w-full h-auto shadow-lg"
			/>
		</div>

		<div class="md:w-1/2 w-full">
			<h3 class="text-3xl sm:text-4xl font-bold text-green-400 mb-4">Together</h3>

			<div class="space-y-4 text-blue-100 leading-relaxed">
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

				<h4 class="text-xl font-bold text-green-300">The Theme: Together</h4>

				<p>Our focus for the Grand Feast 2026 is singular, profound, and urgent: Together.</p>

				<p class="italic text-blue-200">
					“In him the whole building is joined together and rises to become a holy temple in the
					Lord.” — <span class="font-bold text-green-300">Ephesians 2:21</span>
				</p>

				<p>
					This is a sacred space where you don't have to pretend to have it all figured out. You are
					invited to bring your whole self—your faith, your doubts, your victories, and your
					weariness. When we gather, the walls that divide us crumble. We find wisdom in our shared
					stories, wonder in His presence, and a unified voice of worship that shakes the heavens.
				</p>

				<h4 class="text-xl font-bold text-green-300">There is a Seat for You</h4>

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

				<div class="pt-6 text-sm text-blue-300">
					<p>With open arms,</p>
					<p class="font-semibold text-white">Bro Lando Patolilic</p>
					<p>Feast Dublin Builder</p>
				</div>
			</div>
		</div>
	</div>
</section>

<section
	id="details"
	class="relative z-10 py-24 px-4 bg-gradient-to-b from-[#071327] to-[#0b1a2f] text-white"
>
	<div class="max-w-5xl mx-auto">
		<h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-blue-200">Event Details</h2>

		<div class="bg-white/5 backdrop-blur-md border border-teal-500/20 rounded-2xl p-8 shadow-lg">
			<h3 class="text-2xl md:text-3xl font-semibold text-center text-white mb-6">
				2026 EU and UK Grand Feast in Dublin
			</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
				<div class="flex items-start gap-4">
					<div class="text-teal-300 text-2xl">🕒</div>
					<div>
						<h4 class="text-lg font-semibold text-teal-200">Time</h4>
						<p class="text-white">12:00 PM Registration</p>
						<p class="text-white">12:30 PM Holy Mass</p>
						<p class="text-white">1:30 PM Event Proper</p>
					</div>
				</div>
				<div class="flex items-start gap-4">
					<div class="text-teal-300 text-2xl">📅</div>
					<div>
						<h4 class="text-lg font-semibold text-teal-200">Date</h4>
						<p class="text-white">October 3, 2026</p>
					</div>
				</div>
			</div>

			<div class="flex items-start gap-4 mb-8">
				<div class="text-teal-300 text-2xl">📍</div>
				<div>
					<h4 class="text-lg font-semibold text-teal-200">Location</h4>
					<p class="text-white">St. Helen's Hotel</p>
					<p class="text-white">Stillorgan Road, Blackrock, Ireland</p>
					<p class="text-white">Dublin A94 V6W3</p>
					<a
						href="https://maps.app.goo.gl/NrBmaQBgKgAZreERA"
						rel="external nofollow noopener"
						target="_blank"
						class="mt-3 inline-block text-teal-200 underline underline-offset-4 transition hover:text-white"
					>
						View on Google Maps
					</a>
				</div>
			</div>

			<div class="mt-8 rounded-xl overflow-hidden shadow-md">
				<iframe
					src="https://www.google.com/maps?q=St.%20Helen%27s%20Hotel%2C%20Stillorgan%20Road%2C%20Blackrock%2C%20Ireland%2C%20Dublin%20A94%20V6W3&output=embed"
					title="St. Helen's Hotel Location"
					width="100%"
					height="400"
					class="w-full rounded-xl border-none shadow-lg"
					allowfullscreen
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
				/>
			</div>
		</div>
	</div>
</section>

<section
	id="tickets"
	bind:this={ticketsSection}
	class="relative z-10 py-24 px-4 bg-gradient-to-b from-[#10172a] to-[#0a0e1a]"
>
	<div class="container mx-auto">
		<h2
			class="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-teal-300"
		>
			Ticket Types
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
			<div
				class="ticket-card rounded-2xl p-6 flex flex-col border border-blue-500/30 transition-transform transform hover:scale-105 duration-300 ease-in-out shadow hover:shadow-2xl"
			>
				<h3 class="text-2xl font-bold mb-2 text-white">Standard</h3>

				{#if earlyBirdActive}
					<div
						class="text-sm font-semibold text-yellow-400 bg-yellow-800/30 inline-block px-2 py-1 rounded-full mb-2"
					>
						🎉 Early Bird Discount! <span class="text-xs text-yellow-300 ml-2">{countdown}</span>
					</div>
					<p class="mb-3 text-sm text-blue-200">Until August 31 only</p>

					<div class="mb-6">
						<div class="text-2xl text-blue-200 line-through">35 €</div>
						<div class="text-3xl font-bold text-teal-300">30 €</div>
					</div>
				{:else}
					<div class="text-3xl font-bold mb-6 text-teal-300">35 €</div>
				{/if}

				<ul class="mb-8 flex-grow text-blue-100 space-y-3">
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">✔</span>General admission
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">✔</span>Standard seating
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">✔</span>
						{earlyBirdActive
							? '10% group discount starts after Early Bird'
							: '10% group discount for 5+ tickets'}
					</li>
				</ul>

				<a
					href="/newbooking"
					class="inline-block text-center py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-teal-400 text-white hover:brightness-110 transition"
				>
					Select
				</a>
			</div>

			<div
				class="ticket-card rounded-2xl p-6 flex flex-col relative border-2 border-yellow-400/60 transform scale-105 shadow-lg transition-transform hover:scale-110 duration-300 ease-in-out hover:shadow-2xl"
			>
				<div
					class="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-yellow-100 bg-yellow-600 animate-pulse"
				>
					PLUS EXPERIENCE
				</div>
				<h3 class="text-2xl font-bold mb-2 text-white">GrandFeast Plus</h3>

				<div class="text-3xl font-bold mb-2 text-teal-300">65 €</div>

				<p class="text-yellow-300 text-sm mb-4">
					Includes pilgrimage to Our Lady of Knock on Oct 4 plus sightseeing
				</p>
				<ul class="mb-8 flex-grow text-blue-100 space-y-3">
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">🎟</span>Grand Feast admission
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">🙏</span>Our Lady of Knock pilgrimage
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">🗺</span>Oct 4 sightseeing
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">✔</span>10% family discount for 5+ tickets
					</li>
				</ul>
				<a
					href="/newbooking"
					class="inline-block text-center py-3 rounded-lg font-semibold bg-gradient-to-r from-indigo-500 to-blue-400 text-white hover:brightness-110 transition"
				>
					Select
				</a>
			</div>
			<div
				class="ticket-card rounded-2xl p-6 flex flex-col border border-blue-500/10 transition-transform transform hover:scale-105 duration-300 ease-in-out shadow hover:shadow-2xl"
			>
				<h3 class="text-2xl font-bold mb-4 text-white">Child</h3>
				<div class="text-3xl font-bold mb-2 text-teal-300">FREE</div>
				<p class="text-blue-200 text-sm mb-4">Under 12 years old</p>
				<ul class="mb-8 flex-grow text-blue-100 space-y-3">
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">✔</span>General admission
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">✔</span>Must be with a paying adult
					</li>
				</ul>
				<p class="text-sm font-semibold text-blue-200">No ticket reservation needed</p>
			</div>
		</div>
	</div>
</section>
