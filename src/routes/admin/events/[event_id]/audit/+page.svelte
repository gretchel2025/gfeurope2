<script lang="ts">
	import { page } from '$app/stores';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import AuditHistorySection from '$lib/ui/components/admin/AuditHistorySection.svelte';
	import BackLinks from '$lib/ui/components/admin/BackLinks.svelte';
	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: routes = adminRoutes($page.params.event_id);
	$: loadHistoryHref = `${routes.audit}?load_history=true`;
</script>

<AdminPage
	title="Audit"
	subtitle="Event-scoped operational history. Rows load only when requested."
	backHref={routes.home}
	backLabel="Dashboard"
>
	<AuditHistorySection
		title="Event History"
		subtitle="Latest audit events for this event."
		events={data.auditEvents}
		historyLoaded={data.historyLoaded}
		{loadHistoryHref}
	/>

	<BackLinks
		links={[
			{ href: routes.home, label: 'Dashboard' },
			{ href: routes.booking.list, label: 'Bookings' },
			{ href: routes.ticket.list, label: 'Tickets' }
		]}
	/>
</AdminPage>
