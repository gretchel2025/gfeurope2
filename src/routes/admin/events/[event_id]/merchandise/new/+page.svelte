<script lang="ts">
	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import MerchProductForm from '$lib/ui/components/admin/MerchProductForm.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: routes = adminRoutes(data.eventId);
</script>

<AdminPage title="Create Product" subtitle="Add a new merchandise product.">
	<AdminCard title="Product Details">
		<MerchProductForm
			action="?/createProduct"
			submitLabel="Create Product"
			backHref={routes.merchandise}
		/>
	</AdminCard>
</AdminPage>
