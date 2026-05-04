<script lang="ts">
	export let title: string;
	export let subtitle = '';
	export let backHref = '/api';
	export let backLabel = 'Admin home';
</script>

<main class="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
	<section class="mx-auto flex w-full max-w-5xl flex-col gap-6">
		<header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<a href={backHref} class="text-sm font-semibold text-blue-700 hover:underline"
					>{backLabel}</a
				>
				<h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
				{#if subtitle}
					<p class="mt-1 text-sm text-slate-600">{subtitle}</p>
				{/if}
			</div>

			{#if $$slots.actions}
				<div class="flex flex-wrap gap-2">
					<slot name="actions" />
				</div>
			{/if}
		</header>

		<slot />
	</section>
</main>
