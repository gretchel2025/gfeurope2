<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import DetailRow from '$lib/ui/components/admin/DetailRow.svelte';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	const ticketAddQuantityOptions = Array.from({ length: 100 }, (_, index) => index + 1);

	let selectedAddQuantity = 10;

	$: routes = adminRoutes($page.params.event_id);
</script>

<AdminPage
	title="Ticket Counter"
	subtitle={`Inventory for ${data.ticketCounter._id}`}
	backHref={routes.home}
	backLabel="Dashboard"
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

		<form
			action="?/incrementAvailableCount"
			method="POST"
			class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
		>
			<label class="block text-sm font-semibold text-slate-700">
				Tickets to add
				<select
					name="quantity"
					bind:value={selectedAddQuantity}
					class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm sm:w-32"
				>
					{#each ticketAddQuantityOptions as quantity}
						<option value={quantity}>{quantity}</option>
					{/each}
				</select>
			</label>
			<AdminButton type="submit" variant="secondary">Add available tickets</AdminButton>
		</form>
	</AdminCard>
</AdminPage>
