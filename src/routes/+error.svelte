<script lang="ts">
	import ErrorDiagnostics from '$lib/ui/components/public/ErrorDiagnostics.svelte';
	import { page } from '$app/stores';
	import { publicRoutes } from '$lib/navigation/adminRoutes';

	$: homeHref = publicRoutes($page.params.event_id ?? $page.data.defaultEventId).home;
</script>

<section class="public-status-page px-4 py-12">
	<article class="conference-panel w-full max-w-2xl p-6 text-center sm:p-8">
		<hgroup class="space-y-2">
			<p class="conference-kicker">Page unavailable</p>
			<h1 class="text-3xl font-black text-white sm:text-4xl">{$page.status}</h1>
			<h2 class="text-lg text-[#fff3df]/75 sm:text-xl">
				{$page.error?.message ?? 'Internal Error'}
			</h2>
		</hgroup>

		<ErrorDiagnostics />

		<div class="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
			<a href={homeHref} class="conference-button px-6 py-3 text-center text-sm">Home</a>
			<button
				type="button"
				on:click={() => location.reload()}
				class="conference-button-secondary px-6 py-3 text-sm"
			>
				Refresh
			</button>
		</div>
	</article>
</section>
