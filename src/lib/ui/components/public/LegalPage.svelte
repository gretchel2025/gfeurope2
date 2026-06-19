<script lang="ts">
	import { page } from '$app/stores';
	import { publicRoutes } from '$lib/navigation/adminRoutes';

	export let title: string;
	export let lastUpdated: string;
	export let intro: string;
	export let introSecondary: string | undefined = undefined;
	export let companionHref: string;
	export let companionLabel: string;
	export let eyebrow: string = 'Legal';

	$: publicNav = publicRoutes($page.params.event_id ?? $page.data.defaultEventId);
</script>

<section class="public-legal-page px-4 py-10 sm:py-14">
	<div class="mx-auto flex max-w-5xl flex-col gap-6">
		<div class="flex flex-wrap items-center justify-between gap-3 text-sm">
			<a
				href={publicNav.home}
				class="inline-flex items-center gap-2 font-semibold text-[#f3c15f] transition hover:text-white"
			>
				<span aria-hidden="true">←</span>
				Back to Home
			</a>
			<a
				href={companionHref}
				class="font-semibold text-[#f3c15f] underline underline-offset-4 transition hover:text-white"
			>
				{companionLabel}
			</a>
		</div>

		<header class="conference-panel px-6 py-8 sm:px-10">
			<p class="conference-kicker">{eyebrow}</p>
			<h1 class="conference-section-title mt-3 text-4xl sm:text-5xl">{title}</h1>
			<p class="mt-4 text-sm font-bold text-[#f3c15f]">Last updated: {lastUpdated}</p>
			<p class="mt-6 max-w-3xl text-base leading-7 text-[#fff3df]/80 sm:text-lg">{intro}</p>
			{#if introSecondary}
				<p class="mt-3 max-w-3xl text-base leading-7 text-[#fff3df]/80 sm:text-lg">
					{introSecondary}
				</p>
			{/if}
		</header>

		<article class="legal-copy conference-panel px-6 py-8 text-[#fff3df] sm:px-10">
			<slot />
		</article>
	</div>
</section>

<style>
	:global(.legal-copy h2) {
		margin-top: 2.5rem;
		margin-bottom: 1rem;
		font-size: 1.65rem;
		font-weight: 700;
		line-height: 1.2;
		color: #f3c15f;
	}

	:global(.legal-copy h3) {
		margin-top: 1.75rem;
		margin-bottom: 0.75rem;
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1.35;
		color: #ffffff;
	}

	:global(.legal-copy h4) {
		margin-top: 1.25rem;
		margin-bottom: 0.65rem;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.4;
		color: #f3c15f;
	}

	:global(.legal-copy p) {
		margin: 0.85rem 0;
		line-height: 1.8;
		color: rgba(255, 243, 223, 0.82);
	}

	:global(.legal-copy ul) {
		margin: 1rem 0 1.25rem;
		padding-left: 1.35rem;
		list-style-type: disc;
		color: rgba(255, 243, 223, 0.82);
	}

	:global(.legal-copy li) {
		margin: 0.65rem 0;
		padding-left: 0.2rem;
	}

	:global(.legal-copy li::marker) {
		color: #f3c15f;
	}

	:global(.legal-copy strong) {
		color: #ffffff;
	}

	:global(.legal-copy a) {
		color: #f3c15f;
		text-decoration: underline;
		text-underline-offset: 0.22em;
	}

	:global(.legal-copy a:hover) {
		color: #ffffff;
	}

	:global(.legal-copy h2:first-child) {
		margin-top: 0;
	}
</style>
