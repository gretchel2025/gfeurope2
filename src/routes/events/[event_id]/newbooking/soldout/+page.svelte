<script lang="ts">
	import { page } from '$app/stores';
	import { publicRoutes } from '$lib/navigation/adminRoutes';

	$: publicNav = publicRoutes($page.params.event_id);
</script>

<section class="public-status-page">
	<article class="conference-panel w-full max-w-lg p-6 text-center sm:p-8">
		<p class="conference-kicker">Ticket Update</p>
		<h1 class="mt-3 text-3xl font-black text-white sm:text-4xl">Sold Out</h1>
		<p class="mt-3 text-lg text-[#fff3df]/75">We're all sold out. See you next year!</p>

		<div class="mt-6">
			<a href={publicNav.home} class="conference-button px-6 py-3 text-sm">Home</a>
		</div>
	</article>
</section>
