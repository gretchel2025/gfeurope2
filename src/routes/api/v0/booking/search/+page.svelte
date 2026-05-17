<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	let searchValue = '';
</script>

<AdminPage title="Search Bookings" subtitle="Find a booking by reference number.">
	<AdminCard>
		<form
			method="GET"
			action={adminRoutes.booking.search()}
			class="flex flex-col gap-3 sm:flex-row"
		>
			<label class="sr-only" for="reference_no">Booking reference number</label>
			<input
				id="reference_no"
				name="reference_no"
				type="text"
				placeholder="Booking reference number"
				bind:value={searchValue}
				class="min-h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
			/>
			<AdminButton type="submit">Search</AdminButton>
		</form>

		{#if data.noneFound}
			<p
				class="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
			>
				Booking reference number not found.
			</p>
		{/if}
	</AdminCard>

	{#if data.bookings.length > 0}
		<AdminCard title="Search Results">
			<div class="space-y-3">
				{#each data.bookings as booking}
					<article class="rounded-md border border-slate-200 bg-slate-50 p-4">
						<p class="font-semibold text-slate-950">{booking.reference_no}</p>
						<p class="mt-1 text-sm text-slate-600">{booking.name} - {booking.payment_status}</p>
						<div class="mt-3">
							<AdminButton
								href={adminRoutes.booking.details(booking.reference_no)}
								variant="secondary"
							>
								View details
							</AdminButton>
						</div>
					</article>
				{/each}
			</div>
		</AdminCard>
	{/if}
</AdminPage>
