<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { jewelsEventDisplayTitlePlain } from '$lib/domain/eventDisplay';
	import type { TicketTypeConfig } from '$lib/domain/ticketType';
	import { publicRoutes } from '$lib/navigation/adminRoutes';

	export let ticketTypes: TicketTypeConfig[] = [];

	const eventDate = '31 Oct - 1 Nov, 2026';
	const eventStart = new Date('2026-10-31T13:00:00+01:00');
	const eventLocation = "St Julian's, Lapsi Street, Malta";
	const googleMapsQuery = encodeURIComponent(eventLocation);
	const googleMapsEmbedUrl = `https://www.google.com/maps?q=${googleMapsQuery}&output=embed`;
	const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;
	const conferenceName = jewelsEventDisplayTitlePlain;
	const scriptureReference = 'Romans 12:2 NIV';
	const scriptureText =
		"Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God's will is - his good, pleasing and perfect will.";
	const scheduleDays = [
		{
			day: 'Day 1 - Saturday',
			date: 'Oct 31, 2026',
			items: [
				{ time: '12:00 PM', title: 'Registration Opens' },
				{ time: '1:00 PM', title: 'Conference Begins' },
				{ time: '5:00 PM', title: 'Day 1 Wrap-Up' },
				{ time: '6:00 PM', title: 'Anticipated Mass' }
			]
		},
		{
			day: 'Day 2 - Sunday',
			date: 'Nov 1, 2026',
			items: [
				{ time: '8:00 AM', title: 'Breakfast and Morning Socials' },
				{ time: '9:00 AM', title: 'Conference Resumes' },
				{ time: '12:00 PM', title: 'Conference Closing' }
			]
		}
	];
	let now = Date.now();

	$: publicNav = publicRoutes($page.params.event_id);
	$: bookingHref = `${publicNav.newBooking}?ticket_type=STANDARD`;
	$: conferenceTicket = ticketTypes.find((ticket) => ticket.ticket_type_id === 'STANDARD');
	$: ticketPrice = formatTicketPrice(conferenceTicket);
	$: timeRemaining = Math.max(eventStart.getTime() - now, 0);
	$: countdownDays = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
	$: countdownHours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
	$: countdownMinutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
	$: countdownSeconds = Math.floor((timeRemaining / 1000) % 60);

	onMount(() => {
		const interval = window.setInterval(() => {
			now = Date.now();
		}, 1000);

		return () => window.clearInterval(interval);
	});

	function formatTicketPrice(ticket?: TicketTypeConfig) {
		if (!ticket) return '€25';
		if (ticket.currency === 'EUR') return `€${ticket.base_price.toFixed(0)}`;
		return `${ticket.base_price.toFixed(0)} ${ticket.currency}`;
	}

	function formatCountdown(value: number) {
		return value.toString().padStart(2, '0');
	}
</script>

<svelte:head>
	<title>{conferenceName} | JEWELS Europe</title>
	<meta
		name="description"
		content="JEWELS Europe gathers in Malta for Becoming, JEWELS CONFERENCE 2026."
	/>
</svelte:head>

<section class="jewels-page" aria-labelledby="jewels-hero-title">
	<div class="jewels-wrap">
		<section id="theme" class="jewels-hero" aria-label="Becoming theme">
			<article class="art-card" aria-label="Becoming floral background and event details">
				<div class="hero-brand">
					<img
						src="/events/jewels2026/title.png"
						alt="Jewels Conference 2026 Becoming"
						decoding="async"
					/>
				</div>

				<div class="hero-details-stack">
					<div class="event-strip">
						<p>{eventDate}</p>
						<p>{eventLocation}</p>
					</div>
					<div class="countdown-card" aria-label="Countdown to JEWELS CONFERENCE 2026">
						<div class="countdown-grid">
							<div>
								<strong>{formatCountdown(countdownDays)}</strong>
								<span>Days</span>
							</div>
							<div>
								<strong>{formatCountdown(countdownHours)}</strong>
								<span>Hours</span>
							</div>
							<div>
								<strong>{formatCountdown(countdownMinutes)}</strong>
								<span>Minutes</span>
							</div>
							<div>
								<strong>{formatCountdown(countdownSeconds)}</strong>
								<span>Seconds</span>
							</div>
						</div>
					</div>
					<div class="hero-actions">
						<a href={bookingHref} class="hero-ticket-button">Buy Ticket</a>
					</div>
				</div>
			</article>
		</section>

		<section class="scripture-section" aria-label="Conference scripture">
			<article class="scripture-card">
				<p class="jewels-eyebrow">{scriptureReference}</p>
				<h1 id="jewels-hero-title">Be transformed by the renewing of your mind.</h1>
				<p>{scriptureText}</p>
			</article>
		</section>

		<section id="speakers" class="details-grid" aria-label="Conference invitation">
			<article class="story-card">
				<h2>You are in a season of Becoming.</h2>
				<div class="story-copy">
					<p>
						Not rushed. Not forced.<br />
						But shaped by God, one moment at a time.
					</p>
					<p>
						In this sacred in-between, something beautiful is unfolding - quietly, deeply,
						intentionally. Like a flower in full bloom, your life is being shaped with grace,
						purpose, and meaning.
					</p>
					<p>This is your invitation to Becoming.</p>
					<p>
						At {jewelsEventDisplayTitlePlain}, we gather as women who are growing, healing, and
						allowing God to renew our minds and transform our hearts. Inspired by Epistle to the
						Romans 12:2, this is a space where you can pause, listen, and step into the life God is
						preparing for you.
					</p>
					<p>
						Come as you are.<br />
						And leave becoming who you were always meant to be.
					</p>
				</div>
			</article>

			<article id="tickets" class="jewels-ticket-card" aria-label="Conference ticket">
				<p class="jewels-eyebrow">Conference Ticket</p>
				<h2>Standard</h2>
				<p class="ticket-price">{ticketPrice}</p>
				<ul class="ticket-inclusions" aria-label="Ticket inclusions">
					<li>On-Site Event Access</li>
					<li>Conference Kit</li>
					<li>Meals and Refreshments</li>
				</ul>
				<a href={bookingHref} class="ticket-button">Buy Ticket</a>
			</article>
		</section>

		<section id="details" class="fact-grid" aria-label="Event quick facts">
			<article class="schedule-card">
				<p class="jewels-eyebrow">Conference Schedule</p>
				<h3>October 31 - November 1, 2026</h3>
				<div class="schedule-days">
					{#each scheduleDays as scheduleDay}
						<section class="schedule-day" aria-label={`${scheduleDay.day} schedule`}>
							<div class="schedule-day-heading">
								<h4>{scheduleDay.day}</h4>
								<span>{scheduleDay.date}</span>
							</div>
							<dl class="schedule-list">
								{#each scheduleDay.items as item}
									<div>
										<dt>{item.time}</dt>
										<dd>{item.title}</dd>
									</div>
								{/each}
							</dl>
						</section>
					{/each}
				</div>
			</article>
			<article class="location-card">
				<p class="jewels-eyebrow">Location</p>
				<h3>Malta</h3>
				<p>{eventLocation}</p>
				<div class="location-map-frame">
					<iframe
						src={googleMapsEmbedUrl}
						title="Map of St Julian's, Lapsi Street, Malta"
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
					></iframe>
				</div>
				<a href={googleMapsUrl} target="_blank" rel="external nofollow noopener" class="map-link">
					View on Google Maps
				</a>
			</article>
		</section>
	</div>
</section>

<style>
	.jewels-page {
		background:
			linear-gradient(180deg, rgba(255, 248, 241, 0.28), rgba(255, 248, 241, 0.78)),
			linear-gradient(90deg, rgba(189, 48, 47, 0.03), rgba(240, 212, 207, 0.14));
		color: #342722;
		padding: 1.5rem 1rem 6rem;
	}

	.jewels-wrap {
		margin: 0 auto;
		max-width: 78rem;
	}

	.jewels-hero {
		display: block;
	}

	.scripture-section {
		margin-top: 1.5rem;
	}

	.scripture-card,
	.art-card,
	.story-card,
	.jewels-ticket-card,
	.fact-grid article {
		border: 1px solid rgba(189, 48, 47, 0.12);
		border-radius: 0.5rem;
		box-shadow: 0 20px 54px rgba(95, 55, 45, 0.08);
	}

	.scripture-card {
		background: rgba(255, 248, 241, 0.88);
		padding: 2rem;
	}

	.jewels-eyebrow {
		color: #bd302f;
		font-size: 0.78rem;
		font-weight: 900;
		line-height: 1.2;
		margin: 0;
		text-transform: uppercase;
	}

	h1,
	h2,
	h3 {
		color: #342722;
		font-family: Georgia, 'Times New Roman', serif;
		font-weight: 800;
		letter-spacing: 0;
		margin: 0;
	}

	h1 {
		color: #bd302f;
		font-size: 2.85rem;
		line-height: 0.94;
		margin-top: 1rem;
		max-width: 16rem;
	}

	.scripture-card p:last-child,
	.fact-grid article p:last-child {
		color: #746056;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.35rem;
		font-weight: 700;
		line-height: 1.28;
		margin: 1.25rem 0 0;
	}

	.art-card {
		background:
			linear-gradient(180deg, rgba(210, 192, 168, 0.3), rgba(210, 192, 168, 0.84)),
			linear-gradient(90deg, rgba(210, 192, 168, 0.86), rgba(210, 192, 168, 0.2)),
			url('/events/jewels2026/bg.png') center top / cover no-repeat;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		justify-content: space-between;
		min-height: 42rem;
		overflow: hidden;
		padding: 1.5rem;
	}

	.hero-brand {
		margin-top: clamp(3.25rem, 15vw, 8rem);
		max-width: 52rem;
		width: 100%;
	}

	.hero-brand img {
		display: block;
		filter: drop-shadow(0 12px 34px rgba(71, 50, 42, 0.22));
		height: auto;
		width: min(100%, 52rem);
	}

	.hero-details-stack {
		display: grid;
		gap: 1.25rem;
	}

	.event-strip {
		-webkit-backdrop-filter: blur(10px);
		align-items: flex-end;
		align-self: flex-end;
		backdrop-filter: blur(10px);
		background: rgba(255, 248, 241, 0.24);
		border: 1px solid rgba(255, 248, 241, 0.46);
		border-radius: 0.5rem;
		box-shadow: 0 18px 42px rgba(71, 50, 42, 0.13);
		color: #9f2f2e;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		justify-content: center;
		max-width: min(100%, 31rem);
		padding: 0.85rem 1rem;
		text-align: right;
	}

	.event-strip p {
		font-size: 0.82rem;
		font-weight: 900;
		line-height: 1.2;
		margin: 0;
		text-transform: uppercase;
	}

	.countdown-card {
		background: rgba(255, 248, 241, 0.92);
		border: 1px solid rgba(189, 48, 47, 0.14);
		border-radius: 0.45rem;
		padding: 1rem;
	}

	.countdown-grid {
		display: grid;
		gap: 0.65rem;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.countdown-grid div {
		background: rgba(240, 212, 207, 0.4);
		border: 1px solid rgba(189, 48, 47, 0.12);
		border-radius: 0.4rem;
		padding: 0.8rem 0.65rem;
		text-align: center;
	}

	.countdown-grid strong,
	.countdown-grid span {
		display: block;
	}

	.countdown-grid strong {
		color: #bd302f;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.85rem;
		font-weight: 800;
		line-height: 0.95;
	}

	.countdown-grid span {
		color: #746056;
		font-size: 0.72rem;
		font-weight: 900;
		line-height: 1.2;
		margin-top: 0.35rem;
		text-transform: uppercase;
	}

	.hero-actions {
		display: flex;
	}

	.hero-ticket-button {
		align-items: center;
		background: #bd302f;
		border: 0;
		border-radius: 0.4rem;
		box-shadow: 0 14px 28px rgba(159, 47, 46, 0.18);
		color: #fff8f1;
		display: inline-flex;
		font-size: 0.82rem;
		font-weight: 900;
		justify-content: center;
		line-height: 1.2;
		min-height: 3rem;
		padding: 0.95rem 1.5rem;
		text-decoration: none;
		text-transform: uppercase;
		transition:
			background 160ms ease,
			transform 160ms ease,
			box-shadow 160ms ease;
		width: 100%;
	}

	.hero-ticket-button:hover {
		background: #9f2f2e;
		box-shadow: 0 16px 32px rgba(159, 47, 46, 0.23);
		transform: translateY(-1px);
	}

	.hero-ticket-button:focus-visible {
		outline: 3px solid rgba(255, 248, 241, 0.95);
		outline-offset: 3px;
	}

	.details-grid {
		display: grid;
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.story-card {
		background: #f0d4cf;
		padding: 2rem;
	}

	.story-card h2 {
		color: #9f2f2e;
		font-size: 2.8rem;
		line-height: 0.98;
		margin-top: 1rem;
		max-width: 42rem;
	}

	.story-copy {
		margin-top: 1.5rem;
		max-width: 46rem;
	}

	.story-copy p {
		color: #746056;
		font-family: Montserrat, Arial, sans-serif;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.75;
		margin: 0;
	}

	.story-copy p + p {
		margin-top: 1.05rem;
	}

	.jewels-ticket-card {
		background: rgba(255, 248, 241, 0.9);
		display: flex;
		flex-direction: column;
		padding: 2rem;
	}

	.jewels-ticket-card h2 {
		font-size: 2.4rem;
		line-height: 0.98;
		margin-top: 1rem;
	}

	.ticket-price {
		color: #bd302f;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 4.3rem;
		font-weight: 800;
		line-height: 1;
		margin: 1.6rem 0 0;
	}

	.ticket-inclusions {
		color: #746056;
		display: grid;
		font-family: Montserrat, Arial, sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		gap: 0.55rem;
		line-height: 1.55;
		list-style: none;
		margin: 1.4rem 0 0;
		padding: 0;
	}

	.ticket-inclusions li {
		align-items: center;
		display: flex;
		gap: 0.55rem;
	}

	.ticket-inclusions li::before {
		background: #bd302f;
		border-radius: 999px;
		content: '';
		flex: 0 0 auto;
		height: 0.45rem;
		width: 0.45rem;
	}

	.ticket-button {
		align-items: center;
		align-self: flex-start;
		background: #bd302f;
		border: 0;
		border-radius: 0.4rem;
		color: #fff8f1;
		display: inline-flex;
		font-size: 0.78rem;
		font-weight: 900;
		justify-content: center;
		line-height: 1.2;
		margin-top: 1.6rem;
		padding: 0.95rem 1.35rem;
		text-decoration: none;
		text-transform: uppercase;
	}

	.ticket-button:disabled {
		cursor: default;
		opacity: 0.92;
	}

	.fact-grid {
		display: grid;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.fact-grid article {
		background: rgba(255, 248, 241, 0.78);
		min-height: 9rem;
		padding: 1.5rem;
	}

	.fact-grid h3 {
		font-size: 1.65rem;
		line-height: 1.08;
		margin-top: 0.85rem;
	}

	.fact-grid article p:last-child {
		font-family: Montserrat, Arial, sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.schedule-days {
		display: grid;
		gap: 1.1rem;
		margin-top: 1.3rem;
	}

	.schedule-day {
		border-top: 1px solid rgba(189, 48, 47, 0.16);
		padding-top: 1rem;
	}

	.schedule-day-heading {
		align-items: baseline;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.75rem;
		justify-content: space-between;
	}

	.schedule-day h4 {
		color: #9f2f2e;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.35rem;
		font-weight: 800;
		line-height: 1;
		margin: 0;
	}

	.schedule-day span {
		color: #746056;
		font-size: 0.78rem;
		font-weight: 900;
		line-height: 1.2;
		text-transform: uppercase;
	}

	.schedule-list {
		display: grid;
		gap: 0.65rem;
		margin: 0.95rem 0 0;
	}

	.schedule-list div {
		align-items: baseline;
		display: grid;
		gap: 0.35rem;
		grid-template-columns: minmax(5.6rem, max-content) minmax(0, 1fr);
	}

	.schedule-list dt,
	.schedule-list dd {
		font-family: Montserrat, Arial, sans-serif;
		line-height: 1.35;
		margin: 0;
	}

	.schedule-list dt {
		color: #bd302f;
		font-size: 0.8rem;
		font-weight: 900;
	}

	.schedule-list dd {
		color: #746056;
		font-size: 0.95rem;
		font-weight: 700;
	}

	.location-map-frame {
		aspect-ratio: 16 / 10;
		background: #d2c0a8;
		border: 1px solid rgba(189, 48, 47, 0.12);
		border-radius: 0.45rem;
		margin-top: 1.1rem;
		overflow: hidden;
	}

	.location-map-frame iframe {
		border: 0;
		display: block;
		height: 100%;
		width: 100%;
	}

	.map-link {
		color: #bd302f;
		display: inline-flex;
		font-size: 0.8rem;
		font-weight: 900;
		line-height: 1.2;
		margin-top: 1rem;
		text-transform: uppercase;
	}

	.map-link:hover {
		color: #8f282c;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	@media (min-width: 48rem) {
		.jewels-page {
			padding: 2rem 2rem 7rem;
		}

		.scripture-card,
		.art-card,
		.story-card,
		.jewels-ticket-card {
			padding: 2.25rem;
		}

		.art-card {
			min-height: 46rem;
		}

		.scripture-card {
			align-items: start;
			column-gap: 2rem;
			display: grid;
			grid-template-columns: minmax(17rem, 0.8fr) minmax(0, 1.2fr);
		}

		.scripture-card .jewels-eyebrow {
			grid-column: 1 / -1;
		}

		.countdown-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.hero-actions {
			justify-content: flex-end;
		}

		.hero-ticket-button {
			width: auto;
		}

		.details-grid {
			grid-template-columns: minmax(0, 1.62fr) minmax(18rem, 0.78fr);
			margin-top: 2.4rem;
		}

		.fact-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.schedule-card {
			grid-column: span 3;
		}

		.schedule-days {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.location-card {
			grid-column: span 2;
		}
	}

	@media (min-width: 64rem) {
		.jewels-page {
			padding-top: 2.5rem;
		}

		.art-card {
			min-height: 49rem;
		}

		.story-card h2 {
			font-size: 3.25rem;
		}
	}

	@media (max-width: 30rem) {
		.scripture-card,
		.art-card,
		.story-card,
		.jewels-ticket-card,
		.fact-grid article {
			padding: 1.35rem;
		}

		h1 {
			font-size: 2.35rem;
			max-width: 14rem;
		}

		.scripture-card p:last-child {
			font-size: 1.12rem;
		}

		.story-card h2 {
			font-size: 2.25rem;
		}

		.hero-brand {
			margin-top: 3rem;
		}

		.jewels-ticket-card h2 {
			font-size: 2rem;
		}

		.ticket-price {
			font-size: 3.4rem;
		}
	}
</style>
