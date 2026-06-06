<script lang="ts">
	export let firstChecked = false;
	export let secondChecked = false;
	export let firstLabel: string;
	export let secondLabel: string;
</script>

<section class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-950">
	<p class="font-semibold">Warning: this action cannot be undone.</p>

	<div class="mt-4 space-y-3">
		<label class="flex gap-3">
			<input
				class="mt-1 h-4 w-4 rounded border-red-300"
				type="checkbox"
				data-testid="danger-confirmation-first"
				bind:checked={firstChecked}
			/>
			<span>{firstLabel}</span>
		</label>

		<label class="flex gap-3">
			<input
				class="mt-1 h-4 w-4 rounded border-red-300"
				type="checkbox"
				data-testid="danger-confirmation-second"
				bind:checked={secondChecked}
			/>
			<span>{secondLabel}</span>
		</label>
	</div>
</section>
