<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import { globalAdminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	function formatEventDate(value: string) {
		return new Intl.DateTimeFormat('en', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(value));
	}

	function eventThemeStyle(eventRoute: ServerData['eventRoutes'][number]) {
		return [
			`--admin-event-main: ${asHexColor(eventRoute.theme_main_color, '#334155')}`,
			`--admin-event-sub: ${asHexColor(eventRoute.theme_sub_color, '#eef2f7')}`,
			`--admin-event-highlight: ${asHexColor(eventRoute.theme_highlight_color, '#64748b')}`,
			`--admin-event-on-main: ${asHexColor(eventRoute.theme_on_main_color, '#ffffff')}`
		].join('; ');
	}

	function asHexColor(value: string, fallback: string) {
		return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
	}
</script>

<main class="admin-page-surface min-h-screen px-4 py-8 text-slate-900">
	<section class="mx-auto flex w-full max-w-5xl flex-col gap-6">
		<header>
			<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Admin</p>
			<h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Admin Directory</h1>
			<p class="mt-1 text-sm text-slate-600">
				Routes available to your account. Event access is controlled per event.
			</p>
		</header>

		<AdminCard title="Event admin" subtitle="Event-scoped admin dashboards you can access.">
			{#if data.eventRoutes.length > 0}
				<div class="grid gap-3">
					{#each data.eventRoutes as eventRoute}
						<article
							class="admin-directory-event-card flex flex-col gap-4 rounded-md p-4 sm:flex-row sm:items-center sm:justify-between"
							style={eventThemeStyle(eventRoute)}
						>
							<div>
								<h2 class="text-lg font-semibold text-slate-950">{eventRoute.title}</h2>
								<p class="event-card-meta mt-2 text-sm font-semibold">
									{eventRoute.event_id} • {eventRoute.country} • {formatEventDate(
										eventRoute.datetime
									)}
								</p>
							</div>
							<AdminButton href={eventRoute.href} variant="secondary">Manage bookings</AdminButton>
						</article>
					{/each}
				</div>
			{:else}
				<p class="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
					No event admin routes assigned.
				</p>
			{/if}
		</AdminCard>

		{#if data.canAccessGlobalAdmin}
			<AdminCard title="Global admin" subtitle="Superuser-only tools for global-scope data.">
				<div class="flex flex-wrap gap-2">
					<AdminButton href={globalAdminRoutes.home} variant="secondary">
						Events Maintenance
					</AdminButton>
					<AdminButton href={globalAdminRoutes.users} variant="secondary">Admin users</AdminButton>
				</div>
			</AdminCard>
		{/if}
	</section>
</main>
