<script lang="ts">
	import { page } from '$app/stores';
	import LegalPage from '$lib/ui/components/public/LegalPage.svelte';
	import { publicRoutes } from '$lib/navigation/adminRoutes';

	$: publicNav = publicRoutes($page.params.event_id);
</script>

<LegalPage
	title="Frequently Asked Questions"
	lastUpdated="June 7, 2026"
	intro="Find quick answers about tickets, entry, event logistics, and what to expect before attending Grand Feast Europe and UK."
	introSecondary="This page is provided as general attendee guidance for our event and ticket sales. Specific event updates shared on the website or in booking communications will take precedence if details change."
	companionHref={publicNav.newBooking}
	companionLabel="Buy Tickets"
	eyebrow="Attendee Guide"
>
	<h2>Buying Tickets</h2>
	<ul>
		<li>
			<strong>How do I buy a ticket?</strong>
			<p>
				You can purchase tickets through our online booking page at
				<a href={publicNav.newBooking}>{publicNav.newBooking}</a>. Choose the ticket type that fits
				your needs and follow the checkout steps to complete your booking.
			</p>
		</li>
		<li>
			<strong>What ticket types are available?</strong>
			<p>
				We currently offer Standard and GrandFeast Plus tickets. Children 12 years old and below may
				attend for free and do not need a separate booking ticket. The booking page shows current
				prices, early bird promos, and availability at the time of purchase.
			</p>
		</li>
		<li>
			<strong>Are tickets limited?</strong>
			<p>
				Yes. Ticket sales are subject to venue capacity and category limits. Some ticket types may
				sell out earlier than others, and limited-offer categories may be removed once the
				allocation has been fully claimed.
			</p>
		</li>
	</ul>

	<h2>Booking Confirmation</h2>
	<ul>
		<li>
			<strong>How do I know my booking is confirmed?</strong>
			<p>
				Once your order is successfully completed, you should see a confirmation screen and receive
				the booking details associated with your purchase. Please review your information carefully
				and keep your confirmation available for reference on the event day.
			</p>
		</li>
		<li>
			<strong>What should I do if I do not receive my confirmation?</strong>
			<p>
				First, check your spam or promotions folder if your confirmation was sent by email. If you
				still cannot find it, please contact the organizers through the official contact page so we
				can help verify your booking.
			</p>
		</li>
	</ul>

	<h2>Children and Entry</h2>
	<ul>
		<li>
			<strong>Are children allowed to attend?</strong>
			<p>
				Children may attend when the event listing and ticket options allow it. If a child ticket is
				offered, children must normally be accompanied by a responsible paying adult for the
				duration of the event.
			</p>
		</li>
		<li>
			<strong>Is there an age policy I should know about?</strong>
			<p>
				Parents or guardians are responsible for deciding whether the event is suitable for the
				child in their care. Please supervise children at all times and follow any venue-specific
				guidance shared before or during the event.
			</p>
		</li>
	</ul>

	<h2>Refunds, Transfers, and Changes</h2>
	<ul>
		<li>
			<strong>Are tickets refundable?</strong>
			<p>
				Unless otherwise stated at the time of sale, tickets should be treated as non-refundable.
				However, if an event is cancelled, rescheduled, or materially changed, the organizers may
				provide additional options or instructions depending on the circumstances.
			</p>
		</li>
		<li>
			<strong>Can I transfer my ticket to someone else?</strong>
			<p>
				Ticket transfer requests may be considered on a case-by-case basis before the event. If you
				need help updating attendee details, contact the organizers as early as possible so we can
				advise what is feasible for your booking.
			</p>
		</li>
		<li>
			<strong>What happens if the event details change?</strong>
			<p>
				We may update the schedule, speaker lineup, venue logistics, or other operational details if
				needed. If a significant change occurs, we will make reasonable efforts to communicate the
				update through the website, booking communications, or other official channels.
			</p>
		</li>
	</ul>

	<h2>Event Day Information</h2>
	<ul>
		<li>
			<strong>When should I arrive?</strong>
			<p>
				Please plan to arrive early enough for check-in, seating, and any queueing at the venue. We
				recommend allowing extra time for travel, parking, and entry procedures, especially if you
				are unfamiliar with the area.
			</p>
		</li>
		<li>
			<strong>Where can I find the venue details?</strong>
			<p>
				The home page includes the latest published event date, time, and venue information. Please
				review those details before traveling and check for updates closer to the event date.
			</p>
		</li>
	</ul>

	<h2>Contact and Support</h2>
	<ul>
		<li>
			<strong>How can I contact the organizers?</strong>
			<p>
				If you have questions about your booking or need event-related assistance, please use the
				official contact page at
				<a href="https://grandfeast.eu/contact" rel="external nofollow noopener" target="_blank"
					>grandfeast.eu/contact</a
				>.
			</p>
		</li>
		<li>
			<strong>Where can I find the site policies?</strong>
			<p>
				You can review our <a href={publicNav.privacy}>Privacy Policy</a> and
				<a href={publicNav.conditions}>Terms and Conditions</a> for additional information about how
				the site and services are managed.
			</p>
		</li>
	</ul>

	<div class="mt-10 border-t border-white/10 pt-6 text-sm text-[#fff3df]/70">
		<p>
			Ready to reserve your place? Continue to the
			<a href={publicNav.newBooking}>ticket booking page</a>.
		</p>
	</div>
</LegalPage>
