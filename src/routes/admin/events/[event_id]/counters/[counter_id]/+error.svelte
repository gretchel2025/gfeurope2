<script lang="ts">
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';

	function refreshPage() {
		location.reload();
	}

	$: routes = adminRoutes($page.params.event_id);
</script>

<AdminPage title="Server Busy" subtitle="Refresh and retry the ticket counter request.">
	<section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
		<div class="flex flex-wrap items-center gap-4">
			<button
				type="button"
				class="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
				on:click={refreshPage}>Refresh</button
			>
			<a href={routes.home} class="text-sm font-semibold text-blue-700 hover:underline">
				Dashboard
			</a>
		</div>
	</section>
</AdminPage>
