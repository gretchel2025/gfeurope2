<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import DetailRow from '$lib/components/admin/DetailRow.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;
</script>

<AdminPage
	title="Ticket Counter"
	subtitle={`Inventory for ${data.ticketCounter._id}`}
	backHref="/api"
	backLabel="Back to dashboard"
>
	<AdminCard
		title={data.ticketCounter._id}
		subtitle="Counters are adjusted by operational actions such as booking, payment, and cancellation."
	>
		<dl>
			<DetailRow label="Available" value={data.ticketCounter.available} />
			<DetailRow label="Reserved" value={data.ticketCounter.reserved} />
			<DetailRow label="Sold" value={data.ticketCounter.sold} />
		</dl>

		<form action="?/incrementAvailableCount" method="POST" class="mt-5">
			<AdminButton type="submit" variant="secondary">Add 10 available tickets</AdminButton>
		</form>
	</AdminCard>
</AdminPage>
