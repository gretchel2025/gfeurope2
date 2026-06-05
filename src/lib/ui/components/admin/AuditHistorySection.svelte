<script lang="ts">
	import type { AuditEvent } from '$lib/domain/auditEvent';
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';

	export let title = 'History';
	export let subtitle = 'Audit events are loaded only when requested.';
	export let events: AuditEvent[] = [];
	export let historyLoaded = false;
	export let loadHistoryHref: string;

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('en', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	function formatActor(event: AuditEvent) {
		if (event.actor_email) return `${event.actor_type}: ${event.actor_email}`;
		if (event.actor_id) return `${event.actor_type}: ${event.actor_id}`;
		return event.actor_type;
	}

	function formatMetadata(metadata: Record<string, unknown>) {
		return JSON.stringify(metadata, null, 2);
	}

	function detail(label: string, value: string) {
		return { label, value };
	}
</script>

<div id="history">
	<AdminCard {title} {subtitle}>
		{#if !historyLoaded}
			<AdminButton href={loadHistoryHref} variant="secondary">Load history</AdminButton>
		{:else if events.length === 0}
			<p class="text-sm text-slate-600">No audit events recorded yet.</p>
		{:else}
			<div class="space-y-4 md:hidden">
				{#each events as event}
					<article class="min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
						<div class="space-y-3">
							{#each [detail('Occurred', formatDate(event.occurred_at)), detail('Action', event.action), detail('Actor', formatActor(event)), detail('Entity', `${event.entity_type}: ${event.entity_id}`)] as item}
								<div class="min-w-0">
									<p class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
										{item.label}
									</p>
									<p class="mt-1 overflow-wrap-anywhere text-sm font-semibold text-slate-900">
										{item.value}
									</p>
								</div>
							{/each}
							<div class="min-w-0">
								<p class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
									Metadata
								</p>
								<details class="audit-metadata-toggle mt-1 min-w-0">
									<summary
										class="cursor-pointer list-none text-sm font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
									>
										<span class="details-closed">Show details</span>
										<span class="details-open">Hide details</span>
									</summary>
									<pre
										class="mt-2 max-h-72 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{formatMetadata(
											event.metadata
										)}</pre>
								</details>
							</div>
						</div>
					</article>
				{/each}
			</div>

			<div class="hidden min-w-0 overflow-x-auto md:block">
				<table class="min-w-full table-fixed divide-y divide-slate-200 text-left text-sm">
					<thead class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
						<tr>
							<th class="w-36 py-3 pr-4">Occurred</th>
							<th class="w-52 py-3 pr-4">Action</th>
							<th class="w-56 py-3 pr-4">Actor</th>
							<th class="w-48 py-3 pr-4">Entity</th>
							<th class="py-3">Metadata</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 align-top">
						{#each events as event}
							<tr>
								<td class="py-3 pr-4 font-semibold text-slate-700">
									{formatDate(event.occurred_at)}
								</td>
								<td class="overflow-wrap-anywhere py-3 pr-4 font-semibold text-slate-950">
									{event.action}
								</td>
								<td class="overflow-wrap-anywhere py-3 pr-4 text-slate-700">
									{formatActor(event)}
								</td>
								<td class="overflow-wrap-anywhere py-3 pr-4 text-slate-700">
									{event.entity_type}: {event.entity_id}
								</td>
								<td class="py-3">
									<details class="audit-metadata-toggle min-w-0">
										<summary
											class="cursor-pointer list-none text-sm font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
										>
											<span class="details-closed">Show details</span>
											<span class="details-open">Hide details</span>
										</summary>
										<pre
											class="mt-2 max-h-80 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{formatMetadata(
												event.metadata
											)}</pre>
									</details>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</AdminCard>
</div>

<style>
	.audit-metadata-toggle > summary::-webkit-details-marker {
		display: none;
	}

	.audit-metadata-toggle .details-open {
		display: none;
	}

	.audit-metadata-toggle[open] .details-closed {
		display: none;
	}

	.audit-metadata-toggle[open] .details-open {
		display: inline;
	}
</style>
