<script lang="ts">
	import { page } from '$app/stores';
	import { adminIndexRoute, adminRoutes, globalAdminRoutes } from '$lib/navigation/adminRoutes';

	$: routes = adminRoutes($page.params.event_id);
	$: managedEvent = $page.data.event;
	$: isSuperUser = $page.data.my_user?.isASuperUser ?? false;

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
			class="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
		>
			<div>
				<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Managing event</p>
				<h2 class="mt-1 text-lg font-black text-slate-950">{managedEvent.title}</h2>
			</div>
			<div class="flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
				<span class="admin-event-pill rounded-full border px-3 py-1">
					{managedEvent.event_id}
				</span>
				<span class="admin-event-pill rounded-full border px-3 py-1">
					{managedEvent.country}
				</span>
				<span class="admin-event-pill rounded-full border px-3 py-1">
					{formatEventDate(managedEvent.datetime)}
				</span>
			</div>
		</div>
	</section>
{/if}

<nav class="admin-nav border-b border-slate-200/80 px-4 py-3 text-sm text-slate-700">
	<div class="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-2 font-semibold">
		<a href={adminIndexRoute} class="hover:text-slate-950">Admin directory</a>
		<a href={routes.home} class="hover:text-slate-950">Dashboard</a>
		<a href={routes.booking.list} class="hover:text-slate-950">Bookings</a>
		<a href={routes.booking.search()} class="hover:text-slate-950">Search</a>
		<a href={routes.ticket.list} class="hover:text-slate-950">Tickets</a>
		<a href={routes.reports} class="hover:text-slate-950">Reports</a>
		<a href={routes.system} class="hover:text-slate-950">System</a>
		{#if isSuperUser}
			<a href={globalAdminRoutes.home} class="hover:text-slate-950">Global admin</a>
		{/if}
	</div>
</nav>

<slot />
