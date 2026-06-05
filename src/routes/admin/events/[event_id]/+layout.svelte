<script lang="ts">
	import { page } from '$app/stores';
	import { adminRoutes, publicRoutes } from '$lib/navigation/adminRoutes';

	$: routes = adminRoutes($page.params.event_id);
	$: publicNav = publicRoutes($page.params.event_id);
	$: managedEvent = $page.data.event;

	function formatEventDate(value?: string) {
		if (!value) return '';

		return new Intl.DateTimeFormat('en', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(value));
	}
</script>

{#if managedEvent}
	<section class="admin-event-context admin-page-surface border-b border-slate-200/80 px-4 py-3">
		<div
			class="mx-auto flex max-w-6xl items-center justify-between gap-4"
		>
			<div class="min-w-0">
				<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Managing event</p>
				<h2 class="mt-1 text-lg font-black text-slate-950">{managedEvent.title}</h2>
				<p class="admin-event-meta mt-1 text-sm font-semibold">
					{managedEvent.event_id} • {managedEvent.country} • {formatEventDate(managedEvent.datetime)}
				</p>
			</div>
			<div class="flex shrink-0 items-start justify-end text-right">
				<a href={publicNav.home} class="admin-event-home-link text-sm font-semibold">
					Event Home
				</a>
			</div>
		</div>
	</section>
{/if}

<nav class="admin-nav border-b border-slate-200/80 px-4 py-3 text-sm text-slate-700">
	<div class="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-2 font-semibold">
		<a href={routes.home} class="hover:text-slate-950">Dashboard</a>
		<a href={routes.booking.list} class="hover:text-slate-950">Bookings</a>
		<a href={routes.booking.search()} class="hover:text-slate-950">Search</a>
		<a href={routes.ticket.list} class="hover:text-slate-950">Tickets</a>
		<a href={routes.audit} class="hover:text-slate-950">Audit</a>
		<a href={routes.reports} class="hover:text-slate-950">Reports</a>
	</div>
</nav>

<slot />
