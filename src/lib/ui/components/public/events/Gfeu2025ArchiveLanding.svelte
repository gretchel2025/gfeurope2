<script lang="ts">
	import type { TicketTypeConfig } from '$lib/domain/ticketType';

	export let ticketTypes: TicketTypeConfig[];

	const standardTicket = ticketTypes.find((ticket) => ticket.ticket_type_id === 'STANDARD');
	const premiumTicket = ticketTypes.find((ticket) => ticket.ticket_type_id === 'VIP');
	const childTicket = ticketTypes.find((ticket) => ticket.ticket_type_id === 'YOUTH');

	function formatMoney(value: number, currency = 'EUR') {
		if (value === 0) return 'FREE';
		if (currency !== 'EUR') return `${value.toFixed(2)} ${currency}`;
		return `${value.toFixed(0)} €`;
	}
</script>

<div class="gfeu2025-archive">
	<section class="archive-hero px-4 py-12 sm:py-16">
		<div class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
			<div class="min-w-0 space-y-7">
				<div
					class="inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-white"
				>
					Archived event
				</div>
				<div class="space-y-4">
					<p class="text-sm font-black uppercase tracking-[0.22em] text-[#f3d6a0]">Oslo, Norway</p>
					<h1
						class="max-w-full text-5xl font-black uppercase leading-none text-white sm:max-w-4xl sm:text-7xl md:text-8xl"
					>
						Called To More
					</h1>
					<p
						class="max-w-full text-2xl font-black uppercase leading-tight text-[#fff5e5] sm:text-4xl"
					>
						Grand Feast Europe 2025
					</p>
					<p class="max-w-2xl text-xl font-bold text-[#f3d6a0]">September 20, 2025</p>
					<p class="max-w-2xl text-lg italic leading-8 text-white/78">
						“Immeasurably more than all we ask or imagine.” —
						<span class="font-bold text-[#f3d6a0]">Ephesians 3:20</span>
					</p>
				</div>
			</div>

			<div class="archive-poster-frame">
				<img
					src="/poster2.png"
					alt="Called To More Grand Feast Europe 2025 poster with Bo Sanchez"
					class="h-auto w-full"
				/>
			</div>
		</div>
	</section>

	<section id="message" class="px-4 py-20">
		<div class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
			<div class="archive-image-panel">
				<img
					src="/poster1.png"
					alt="Called To More archive banner for Grand Feast Europe 2025"
					class="h-full w-full object-cover"
				/>
			</div>

			<article class="archive-panel p-6 sm:p-8">
				<p class="archive-kicker">Message from Feast Norway</p>
				<h2 class="mt-3 text-4xl font-black text-white sm:text-5xl">Called To More</h2>
				<div class="mt-6 space-y-4 text-base leading-8 text-white/78 sm:text-lg">
					<p>
						The 2025 Grand Feast in Oslo carried a simple invitation: there is more waiting beyond
						routine, hesitation, and the familiar edges of comfort.
					</p>
					<p>
						Called To More reminded guests that God continues to call people toward deeper purpose,
						stronger faith, wider love, and a life that leads others closer to Him.
					</p>
					<p>
						On September 20, 2025, the community gathered in Norway with Bro. Bo Sanchez to
						rediscover that calling and celebrate the more God had prepared.
					</p>
					<div class="border-l-4 border-[#c6283d] pl-4 text-sm text-white/70">
						<p class="font-semibold text-white">Dindo Manuel</p>
						<p>Feast Norway Planter</p>
					</div>
				</div>
			</article>
		</div>
	</section>

	<section id="details" class="px-4 py-20">
		<div class="mx-auto max-w-5xl">
			<p class="archive-kicker text-center">Archive details</p>
			<h2 class="mt-3 text-center text-4xl font-black text-white md:text-5xl">Event Details</h2>

			<div class="archive-panel mt-10 grid gap-5 p-6 sm:p-8 md:grid-cols-3">
				<div class="archive-detail-card">
					<p class="archive-kicker">Time</p>
					<p class="mt-3 text-2xl font-black text-white">1:00 PM to 5:00 PM</p>
				</div>
				<div class="archive-detail-card">
					<p class="archive-kicker">Date</p>
					<p class="mt-3 text-2xl font-black text-white">September 20, 2025</p>
				</div>
				<div class="archive-detail-card">
					<p class="archive-kicker">Location</p>
					<p class="mt-3 text-xl font-black leading-7 text-white">
						Lambertseter kirke<br />
						Langbølgen 33<br />
						1150 Oslo, Norway
					</p>
				</div>
			</div>
		</div>
	</section>

	<section id="tickets" class="px-4 py-20">
		<div class="mx-auto max-w-6xl">
			<p class="archive-kicker text-center">Ticket archive</p>
			<h2 class="mt-3 text-center text-4xl font-black text-white md:text-5xl">2025 Ticket Types</h2>
			<p class="mx-auto mt-4 max-w-2xl text-center text-white/70">
				This event has already happened. Ticket information is kept here for archive and portfolio
				context.
			</p>

			<div class="mt-10 grid gap-6 md:grid-cols-3">
				<article class="archive-ticket-card">
					<h3>{standardTicket?.label ?? 'Standard'}</h3>
					<p class="price">
						{formatMoney(standardTicket?.base_price ?? 35, standardTicket?.currency)}
					</p>
					<ul>
						<li>General admission</li>
						<li>Standard seating</li>
					</ul>
				</article>

				<article class="archive-ticket-card featured">
					<p class="archive-kicker">Limited offer</p>
					<h3>{premiumTicket?.label ?? 'Premium'}</h3>
					<p class="price">
						{formatMoney(premiumTicket?.base_price ?? 55, premiumTicket?.currency)}
					</p>
					<ul>
						<li>Premium seating area</li>
						<li>One Bo Sanchez book</li>
						<li>Priority book signing access</li>
						<li>Meet-and-greet with Bro. Bo</li>
					</ul>
				</article>

				<article class="archive-ticket-card">
					<h3>{childTicket?.label ?? 'Child'}</h3>
					<p class="price">{formatMoney(childTicket?.base_price ?? 0, childTicket?.currency)}</p>
					<ul>
						<li>Under 12 years old</li>
						<li>Must be with a paying adult</li>
					</ul>
				</article>
			</div>
		</div>
	</section>
</div>

<style>
	.gfeu2025-archive {
		--archive-blue: #1d4e89;
		--archive-red: #c6283d;
		--archive-cream: #fff4df;
		background:
			radial-gradient(circle at 8% 8%, rgba(198, 40, 61, 0.22), transparent 24rem),
			radial-gradient(circle at 94% 16%, rgba(243, 214, 160, 0.16), transparent 28rem),
			linear-gradient(180deg, #102344 0%, #1d4e89 46%, #111b30 100%);
	}

	.archive-hero {
		position: relative;
		overflow: hidden;
	}

	.archive-hero::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.045) 0 1px, transparent 1px 38px),
			linear-gradient(45deg, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 46px);
	}

	.archive-poster-frame,
	.archive-image-panel,
	.archive-panel,
	.archive-ticket-card {
		position: relative;
		overflow: hidden;
		border: 1px solid rgba(255, 244, 223, 0.18);
		background: rgba(8, 20, 39, 0.72);
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
	}

	.archive-poster-frame {
		padding: 0.75rem;
		background: linear-gradient(135deg, rgba(255, 244, 223, 0.16), rgba(198, 40, 61, 0.2));
	}

	.archive-image-panel {
		min-height: 20rem;
	}

	.archive-kicker {
		color: #f3d6a0;
		font-size: 0.78rem;
		font-weight: 900;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.archive-detail-card {
		border: 1px solid rgba(255, 244, 223, 0.14);
		background: rgba(255, 255, 255, 0.06);
		padding: 1.25rem;
	}

	.archive-ticket-card {
		display: flex;
		min-height: 24rem;
		flex-direction: column;
		padding: 1.5rem;
		color: rgba(255, 255, 255, 0.78);
	}

	.archive-ticket-card.featured {
		border-color: rgba(198, 40, 61, 0.72);
		background: linear-gradient(145deg, rgba(198, 40, 61, 0.28), rgba(8, 20, 39, 0.82));
	}

	.archive-ticket-card h3 {
		margin-top: 0.5rem;
		color: #ffffff;
		font-size: 1.65rem;
		font-weight: 900;
	}

	.archive-ticket-card .price {
		margin-top: 1rem;
		color: #f3d6a0;
		font-size: 2.75rem;
		font-weight: 900;
	}

	.archive-ticket-card ul {
		margin-top: 1.5rem;
		display: grid;
		gap: 0.75rem;
	}

	.archive-ticket-card li::before {
		content: '•';
		margin-right: 0.5rem;
		color: #f3d6a0;
	}
</style>
