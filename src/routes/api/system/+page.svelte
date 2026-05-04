<script lang="ts">
	import AdminButton from '$lib/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import DetailRow from '$lib/components/admin/DetailRow.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;
</script>

<AdminPage title="System Settings" subtitle="Super-user controls for operational switches.">
	<AdminCard
		title="Booking availability"
		subtitle="Controls whether the public booking form accepts new reservations."
	>
		<dl>
			<DetailRow label="New bookings allowed" value={data.newBookingsAllowed ? 'Yes' : 'No'} />
		</dl>

		<form action="?/toggleNewBookingsAllowed" method="POST" class="mt-5">
			<AdminButton type="submit" variant="warning">Toggle booking availability</AdminButton>
		</form>
	</AdminCard>
</AdminPage>
