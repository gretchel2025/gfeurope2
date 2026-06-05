<script lang="ts">
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	let loadedQuery = data.query;
	let searchValue = data.query;

	$: if (data.query !== loadedQuery) {
		loadedQuery = data.query;
		searchValue = data.query;
	}

	$: routes = adminRoutes($page.params.event_id);
</script>

<AdminPage
	title="Search Bookings"
	subtitle="Find bookings by reference, email, name, guest, or ticket number."
>
	<AdminCard>
		<form method="GET" action={routes.booking.search()} class="flex flex-col gap-3 sm:flex-row">
			<label class="sr-only" for="query">Booking reference, email, name, or ticket number</label>
			<input
				id="query"
				name="query"
				type="text"
				placeholder="Reference, email, name, guest, or ticket number"
				bind:value={searchValue}
				class="min-h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
			/>
			<AdminButton type="submit" submitLoading={false}>Search</AdminButton>
		</form>

		{#if data.noneFound}
			<p
				class="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
			>
				No booking found for that search.
			</p>
		{/if}
	</AdminCard>

	{#if data.bookings.length > 0}
		<AdminCard title="Search Results">
			<div class="space-y-3">
				{#each data.bookings as booking}
					<article class="rounded-md border border-slate-200 bg-slate-50 p-4">
						<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div>
								<p class="font-semibold text-slate-950">{booking.reference_no}</p>
								<p class="mt-1 text-sm text-slate-700">{booking.name}</p>
								<p class="mt-1 text-sm text-slate-600">{booking.email}</p>
							</div>
							<div class="text-sm text-slate-600 lg:text-right">
								<p>
									<span class="font-semibold text-slate-800">Payment:</span>
									{booking.payment_status}
								</p>
								<p>
									<span class="font-semibold text-slate-800">Guests:</span>
									{booking.guests.length}
								</p>
							</div>
						</div>
						{#if booking.ticket_ids.length > 0}
							<p class="mt-3 break-words text-sm text-slate-600">
								<span class="font-semibold text-slate-800">Tickets:</span>
								{booking.ticket_ids.join(', ')}
							</p>
						{/if}
						<div class="mt-4">
							<AdminButton href={routes.booking.details(booking.reference_no)} variant="secondary">
								View details
							</AdminButton>
						</div>
					</article>
				{/each}
			</div>
		</AdminCard>
	{/if}
</AdminPage>
