<script lang="ts">
	import CountdownTimer from '$lib/components/public/CountdownTimer.svelte';

	let ticketsSection: HTMLElement;
	const eventDate = new Date('2025-09-20T13:00:00+02:00');

	const earlyBirdDeadline = new Date('2025-06-18T23:59:59');

	const now = new Date();
	let earlyBirdActive = now < earlyBirdDeadline;

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
			“Now to him who is able to do immeasurably more than all we ask or imagine, according to his
			power that is at work within us.” — <span class="font-semibold text-yellow-300"
				>Ephesians 3:20</span
			>
		</p>
		<br />
		<h1
			class="text-6xl sm:text-7xl font-extrabold mb-4 text-yellow-400 tracking-wide animate-fadeInUp"
		>
			Called To More
		</h1>

		<h2
			class="text-3xl sm:text-4xl md:text-5xl font-light mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-teal-200 to-white drop-shadow"
		>
			Grand Feast EU and UK 2025
		</h2>
		<br />
		<div class="flex flex-wrap justify-center items-center gap-4 mb-4">
			<p class="text-lg sm:text-xl md:text-2xl text-blue-100">September 20, 2025</p>
			<span class="text-lg sm:text-xl md:text-2xl text-yellow-400">• Oslo, Norway</span>
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
				alt="Bo Sanchez"
				class="w-full h-auto shadow-lg"
			/>
		</div>

		<div class="md:w-1/2 w-full">
			<p class="italic text-blue-200 mb-6">
				“Now to him who is able to do immeasurably more than all we ask or imagine, according to his
				power that is at work within us.” —
				<span class="font-bold text-yellow-300">Ephesians 3:20</span>
			</p>

			<h3 class="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4">Called To More</h3>

			<div class="space-y-4 text-blue-100 leading-relaxed">
				<p>
					Have you ever felt that there’s something greater waiting for you—beyond the daily grind,
					beyond your comfort zone, beyond your doubts? That feeling is not an accident. It’s a
					calling.
				</p>

				<p>
					"Called to More" is not just a theme—it’s a reminder that God is not done with you. No
					matter where you are in life, He is calling you to a deeper purpose, stronger faith, and
					bigger love. You were made for more than just survival. You were made to shine, to grow,
					and to lead others closer to Him.
				</p>

				<p>
					This September 20, join us for a special event as we welcome
					<span class="text-white font-semibold">Bro. Bo Sanchez</span>, founder of Light of Jesus
					(The Feast), to Norway. Together, let’s rediscover our God-given calling and say yes to
					the more He has prepared for us. This is your time. This is your calling. You are Called
					to More.
				</p>

				<div class="pt-6 text-sm text-blue-300">
					<p class="font-semibold text-white">Dindo Manuel</p>
					<p>Feast Norway Planter</p>
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
				2025 EU and UK Grand Feast in Oslo
			</h3>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
				<div class="flex items-start gap-4">
					<div class="text-teal-300 text-2xl">🕒</div>
					<div>
						<h4 class="text-lg font-semibold text-teal-200">Time</h4>
						<p class="text-white">1:00 PM to 5:00 PM</p>
					</div>
				</div>
				<div class="flex items-start gap-4">
					<div class="text-teal-300 text-2xl">📅</div>
					<div>
						<h4 class="text-lg font-semibold text-teal-200">Date</h4>
						<p class="text-white">September 20, 2025</p>
					</div>
				</div>
			</div>

			<div class="flex items-start gap-4 mb-8">
				<div class="text-teal-300 text-2xl">📍</div>
				<div>
					<h4 class="text-lg font-semibold text-teal-200">Location</h4>
					<p class="text-white">Lambertseter kirke, Langbølgen 33, 1150 Oslo, Norway</p>
				</div>
			</div>

			<div class="mt-8 rounded-xl overflow-hidden shadow-md">
				<iframe
					src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2032.0893365937292!2d10.81919681592025!3d59.87363058187439!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46416e38178a0611%3A0x89b0e6220b7fce55!2sLambertseter%20kirke!5e0!3m2!1sen!2sno!4v1685232932978"
					title="Lambertseter Kirke Location"
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
					LIMITED OFFER
				</div>
				<h3 class="text-2xl font-bold mb-2 text-white">Premium</h3>

				{#if earlyBirdActive}
					<div
						class="text-sm font-semibold text-yellow-400 bg-yellow-800/30 inline-block px-2 py-1 rounded-full mb-2"
					>
						🎉 Early Bird Discount! <span class="text-xs text-yellow-300 ml-2">{countdown}</span>
					</div>
					<div class="mb-2">
						<div class="text-2xl text-blue-200 line-through">55 €</div>
						<div class="text-3xl font-bold text-teal-300">50 €</div>
					</div>
				{:else}
					<div class="text-3xl font-bold mb-2 text-teal-300">55 €</div>
				{/if}

				<p class="text-yellow-300 text-sm mb-4">Limited to 40 seats only</p>
				<ul class="mb-8 flex-grow text-blue-100 space-y-3">
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">🎟</span>Premium seating area
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">📘</span>One Bo Sanchez book
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">✍️</span>Priority book signing access
					</li>
					<li class="flex items-center">
						<span class="text-teal-300 mr-2">🤝</span>Meet-and-greet with Bro. Bo
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
			</div>
		</div>
	</div>
</section>
