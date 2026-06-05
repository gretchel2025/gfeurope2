<script lang="ts">
	import ErrorDiagnostics from '$lib/components/public/ErrorDiagnostics.svelte';

	let refreshing = false;

	function refreshPage() {
		refreshing = true;
		location.reload();
	}
</script>

<section class="public-status-page">
	<article class="conference-panel w-full max-w-md p-6 text-center sm:p-8">
		<hgroup class="mb-6 space-y-2">
			<p class="conference-kicker">Booking unavailable</p>
			<h1 class="text-3xl font-black text-white sm:text-4xl">Server Busy</h1>
			<h2 class="text-lg text-[#fff3df]/75 sm:text-xl">Please refresh and try again</h2>
		</hgroup>

		<ErrorDiagnostics />

		<div class="flex flex-col justify-center gap-4 sm:flex-row">
			<button
				type="button"
				on:click={refreshPage}
				disabled={refreshing}
				aria-busy={refreshing}
				class={`conference-button px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
					refreshing ? 'is-loading' : ''
				}`}
			>
				<span class="button-spinner" aria-hidden="true"></span>
				<span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
			</button>

			<a href="/" class="conference-button-secondary px-6 py-3 text-center text-sm"> Home </a>
		</div>
	</article>
</section>
