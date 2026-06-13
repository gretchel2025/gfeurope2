<script lang="ts">
	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import MerchProductForm from '$lib/ui/components/admin/MerchProductForm.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: routes = adminRoutes(data.eventId);
</script>

<AdminPage
	title="Update Product"
	subtitle={`${data.product.product_id} | ${data.product.category}`}
>
	<AdminCard title={data.product.name}>
		<MerchProductForm
			action="?/updateProduct"
			submitLabel="Update Product"
			backHref={routes.merchandise}
			product={data.product}
		/>
	</AdminCard>
</AdminPage>
