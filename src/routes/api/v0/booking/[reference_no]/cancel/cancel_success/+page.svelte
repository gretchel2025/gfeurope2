<script lang="ts">
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import { adminRoutes } from '$lib/navigation/adminRoutes';
</script>

<AdminPage title="Booking Cancelled" subtitle="The reservation has been cancelled.">
	<section class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
		<div class="flex flex-wrap gap-4 text-sm font-semibold">
			<a href={adminRoutes.booking.list} class="text-blue-700 hover:underline">Bookings list</a>
			<a href={adminRoutes.home} class="text-blue-700 hover:underline">Admin home</a>
		</div>
	</section>
</AdminPage>
