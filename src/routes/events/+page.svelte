<script lang="ts">
	import { publicRoutes } from '$lib/navigation/adminRoutes';
	import { getEventDisplayTitle } from '$lib/domain/eventDisplay';
	import { getPublicEventPage } from '$lib/publicEvents';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	const now = new Date();

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('en', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(value));
	}
</script>

<section class="events-index-page px-4 py-12 sm:py-16">
	<div class="mx-auto max-w-5xl">
		<header class="events-index-hero px-6 py-8 sm:px-10">
			<p class="events-index-kicker">Events</p>
			<h1 class="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
				Grand Feast Europe Events
			</h1>
			<p class="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
				Upcoming gatherings and archived Grand Feast event pages.
			</p>
		</header>

		<div class="mt-8 space-y-8">
			{#each data.eventGroups as group}
				<section class="events-index-year px-6 py-6 sm:px-8">
					<h2 class="text-3xl font-black text-slate-950">{group.year}</h2>
					<div class="mt-5 grid gap-4">
						{#each group.events as event}
							{@const publicEventPage = getPublicEventPage(event.event_id)}
							{@const eventIsArchived = publicEventPage?.status === 'archived'}
							{@const eventIsPast = new Date(event.datetime).getTime() < now.getTime()}
							{@const eventCanBeViewed = !eventIsArchived && !eventIsPast}
							{#if eventCanBeViewed}
								<a
									href={publicRoutes(event.event_id).home}
									class="events-index-entry block px-5 py-4 transition"
								>
									<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<p class="whitespace-pre-line text-xl font-black text-slate-950">
												{getEventDisplayTitle(event.event_id, event.title)}
											</p>
											<p class="mt-1 text-sm font-semibold text-slate-500">
												{event.country} • {formatDate(event.datetime)}
											</p>
										</div>
										<div class="flex flex-wrap gap-2">
											<span class="events-index-badge events-index-badge-active">Upcoming</span>
											<span class="events-index-link-label px-3 py-1 text-sm font-bold">
												View event
											</span>
										</div>
									</div>
								</a>
							{:else}
								<div
									class="events-index-entry events-index-entry-disabled block px-5 py-4"
									aria-disabled="true"
								>
									<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
										<div>
											<p class="whitespace-pre-line text-xl font-black text-slate-950">
												{getEventDisplayTitle(event.event_id, event.title)}
											</p>
											<p class="mt-1 text-sm font-semibold text-slate-500">
												{event.country} • {formatDate(event.datetime)}
											</p>
										</div>
										<div class="flex flex-wrap gap-2">
											<span class="events-index-badge events-index-badge-muted">
												{eventIsArchived ? 'Archived' : 'Past'}
											</span>
											<button
												type="button"
												class="events-index-link-label events-index-link-label-disabled px-3 py-1 text-sm font-bold"
												disabled
											>
												View event
											</button>
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</section>
			{/each}
		</div>
	</div>
</section>
