<script lang="ts">
	import { page } from '$app/stores';
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminErrorDiagnostics from '$lib/ui/components/admin/AdminErrorDiagnostics.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import { adminRoutes } from '$lib/navigation/adminRoutes';

	function refreshPage() {
		location.reload();
	}

	$: routes = adminRoutes($page.params.event_id);
	$: message = $page.error?.message ?? 'Internal Error';
</script>

<AdminPage title="Page Unavailable" subtitle={message}>
	<AdminCard title={`${$page.status}`} subtitle={message}>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
			<AdminButton href={routes.home}>Dashboard</AdminButton>
			<AdminButton href={routes.ticket.list} variant="secondary">Tickets</AdminButton>
			<button
				type="button"
				class="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
				on:click={refreshPage}
			>
				Refresh
			</button>
		</div>

		<AdminErrorDiagnostics />
	</AdminCard>
</AdminPage>
