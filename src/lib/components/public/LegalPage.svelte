<script lang="ts">
	export let title: string;
	export let lastUpdated: string;
	export let intro: string;
	export let introSecondary: string | undefined = undefined;
	export let companionHref: string;
	export let companionLabel: string;
</script>

<section class="relative z-10 px-4 py-10 sm:py-14">
	<div class="mx-auto flex max-w-5xl flex-col gap-6">
		<div class="flex flex-wrap items-center justify-between gap-3 text-sm">
			<a
				href="/"
				class="inline-flex items-center gap-2 text-blue-200 transition hover:text-white"
			>
				<span aria-hidden="true">←</span>
				Back to Home
			</a>
			<a href={companionHref} class="text-blue-200 underline underline-offset-4 transition hover:text-white">
				{companionLabel}
			</a>
		</div>

		<header class="rounded-3xl border border-white/10 bg-white/8 px-6 py-8 shadow-xl backdrop-blur-md sm:px-10">
			<p class="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">Legal</p>
			<h1 class="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{title}</h1>
			<p class="mt-4 text-sm font-medium text-yellow-200">Last updated: {lastUpdated}</p>
			<div class="mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-yellow-300 via-teal-300 to-blue-400"></div>
			<p class="mt-6 max-w-3xl text-base leading-7 text-blue-100 sm:text-lg">{intro}</p>
			{#if introSecondary}
				<p class="mt-3 max-w-3xl text-base leading-7 text-blue-100 sm:text-lg">{introSecondary}</p>
			{/if}
		</header>

		<article
			class="legal-copy rounded-3xl border border-white/10 bg-black/35 px-6 py-8 text-blue-50 shadow-xl backdrop-blur-md sm:px-10"
		>
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
		color: #fde68a;
	}

	:global(.legal-copy h3) {
		margin-top: 1.75rem;
		margin-bottom: 0.75rem;
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1.35;
		color: #bfdbfe;
	}

	:global(.legal-copy h4) {
		margin-top: 1.25rem;
		margin-bottom: 0.65rem;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.4;
		color: #ccfbf1;
	}

	:global(.legal-copy p) {
		margin: 0.85rem 0;
		line-height: 1.8;
		color: #e2e8f0;
	}

	:global(.legal-copy ul) {
		margin: 1rem 0 1.25rem;
		padding-left: 1.35rem;
		color: #e2e8f0;
	}

	:global(.legal-copy li) {
		margin: 0.65rem 0;
		padding-left: 0.2rem;
	}

	:global(.legal-copy strong) {
		color: #ffffff;
	}

	:global(.legal-copy a) {
		color: #7dd3fc;
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
