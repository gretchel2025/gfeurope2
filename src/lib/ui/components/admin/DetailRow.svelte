<script lang="ts">
	export let label: string;
	export let value: string | number | boolean | null | undefined = undefined;
</script>

<div class="grid gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-3 sm:gap-4">
	<dt class="text-sm font-semibold text-slate-500">{label}</dt>
	<dd class="text-sm text-slate-950 sm:col-span-2">
		{#if $$slots.default}
			<slot />
		{:else}
			{value ?? '-'}
		{/if}
	</dd>
</div>
