<script lang="ts">
	export let title = '';
	export let subtitle = '';
</script>

<section class="admin-card min-w-0 rounded-lg bg-white p-5 shadow-sm">
	{#if title || subtitle || $$slots.actions}
		<header class="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div class="min-w-0">
				{#if title}
					<h2 class="break-words text-lg font-semibold text-slate-950">{title}</h2>
				{/if}
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
	{/if}

	<slot />
</section>
