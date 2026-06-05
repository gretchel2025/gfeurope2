<script lang="ts">
	export let title = '';
	export let subtitle = '';
</script>

<section class="admin-card rounded-lg bg-white p-5 shadow-sm">
	{#if title || subtitle || $$slots.actions}
		<header class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div>
				{#if title}
					<h2 class="text-lg font-semibold text-slate-950">{title}</h2>
				{/if}
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
	{/if}

	<slot />
</section>
