<script lang="ts">
	import { page } from '$app/stores';
	import { adminRoutes } from '$lib/navigation/adminRoutes';

	export let title: string;
	export let subtitle = '';
	export let backHref: string | undefined = undefined;
	export let backLabel = 'Dashboard';
	export let showBackLink = false;

	$: resolvedBackHref = backHref ?? adminRoutes($page.params.event_id).home;
</script>

<main class="admin-page-surface min-h-screen min-w-0 px-4 py-8 text-slate-900">
	<section class="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6">
		<header class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div class="min-w-0">
				{#if showBackLink}
					<a href={resolvedBackHref} class="text-sm font-semibold text-blue-700 hover:underline"
						>{backLabel}</a
					>
				{/if}
				<h1
					class:mt-2={showBackLink}
					class="break-words text-3xl font-bold tracking-tight text-slate-950"
				>
					{title}
				</h1>
				{#if subtitle}
					<p class="mt-1 break-words text-sm text-slate-600">{subtitle}</p>
				{/if}
			</div>

			{#if $$slots.actions}
				<div class="flex min-w-0 flex-wrap gap-2">
					<slot name="actions" />
				</div>
			{/if}
		</header>

		<slot />
	</section>
</main>
