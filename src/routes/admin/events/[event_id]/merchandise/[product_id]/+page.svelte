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
	{#if data.productWasUpdated}
		<div
			class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"
			role="status"
		>
			<p class="font-semibold">{data.product.product_id} was updated.</p>
			<p class="mt-1">Your changes are saved.</p>
		</div>
	{/if}

	<AdminCard title={data.product.name}>
		<MerchProductForm
			action="?/updateProduct"
			submitLabel="Update Product"
			backHref={routes.merchandise}
			product={data.product}
		/>
	</AdminCard>
</AdminPage>
