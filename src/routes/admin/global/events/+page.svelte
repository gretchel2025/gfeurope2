<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import { adminIndexRoute, adminRoutes, publicRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	function formatEventDate(value: string, timezone: string) {
		return new Intl.DateTimeFormat('en', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: timezone
		}).format(new Date(value));
	}
</script>

<AdminPage
	title="Events"
	subtitle="Read-only global view of event records."
	backHref={adminIndexRoute}
	backLabel="Admin"
	showBackLink={true}
>
	<AdminCard title="All events" subtitle="Global-scope event records from the database.">
		{#if data.events.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full text-left text-sm">
					<thead
						class="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500"
					>
						<tr>
							<th class="px-3 py-3 font-bold">Event</th>
							<th class="px-3 py-3 font-bold">Location</th>
							<th class="px-3 py-3 font-bold">Date</th>
							<th class="px-3 py-3 font-bold">Theme</th>
							<th class="px-3 py-3 font-bold">Links</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200">
						{#each data.events as event}
							<tr>
								<td class="px-3 py-4 align-top">
									<p class="font-semibold text-slate-950">{event.title}</p>
									<p class="mt-1 font-mono text-xs text-slate-500">{event.event_id}</p>
									<p class="mt-2 max-w-xs text-xs leading-5 text-slate-600">
										{event.short_description}
									</p>
								</td>
								<td class="px-3 py-4 align-top">
									<p class="font-semibold text-slate-800">{event.country}</p>
									<p class="mt-1 max-w-xs text-xs leading-5 text-slate-600">{event.venue}</p>
								</td>
								<td class="px-3 py-4 align-top">
									<p class="font-semibold text-slate-800">
										{formatEventDate(event.datetime, event.timezone)}
									</p>
									<p class="mt-1 text-xs text-slate-500">{event.timezone}</p>
								</td>
								<td class="px-3 py-4 align-top">
									<div class="flex flex-wrap gap-2">
										<span
											class="h-7 w-7 rounded-full border border-slate-300"
											style={`background: ${event.theme_main_color}`}
											title={`Main ${event.theme_main_color}`}
										></span>
										<span
											class="h-7 w-7 rounded-full border border-slate-300"
											style={`background: ${event.theme_sub_color}`}
											title={`Sub ${event.theme_sub_color}`}
										></span>
										<span
											class="h-7 w-7 rounded-full border border-slate-300"
											style={`background: ${event.theme_highlight_color}`}
											title={`Highlight ${event.theme_highlight_color}`}
										></span>
										<span
											class="h-7 w-7 rounded-full border border-slate-300"
											style={`background: ${event.theme_on_main_color}`}
											title={`On main ${event.theme_on_main_color}`}
										></span>
									</div>
								</td>
								<td class="px-3 py-4 align-top">
									<div class="flex flex-col gap-2">
										<AdminButton href={publicRoutes(event.event_id).home} variant="secondary">
											Public page
										</AdminButton>
										<AdminButton href={adminRoutes(event.event_id).home} variant="secondary">
											Event admin
										</AdminButton>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
				No events found.
			</p>
		{/if}
	</AdminCard>
</AdminPage>
