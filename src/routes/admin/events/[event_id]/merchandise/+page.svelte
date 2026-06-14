<script lang="ts">
	import { adminRoutes } from '$lib/navigation/adminRoutes';
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: products = data.products ?? [];
	$: reservations = data.reservations ?? [];
	$: routes = adminRoutes(data.eventId);

	function formatMoney(value: number, currency = 'EUR') {
		return new Intl.NumberFormat('en-IE', {
			style: 'currency',
			currency
		}).format(value);
	}

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('en-IE', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(value));
	}
</script>

<AdminPage
	title="Merchandise"
	subtitle={`${products.length} products | ${reservations.length} reservations`}
>
	<AdminCard title="Products" subtitle="Existing merchandise products.">
		<AdminButton slot="actions" href={routes.merchandiseNew}>Create Product</AdminButton>

		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-slate-200 text-left text-sm">
				<thead class="text-xs uppercase tracking-wide text-slate-500">
					<tr>
						<th class="px-3 py-2">Product ID</th>
						<th class="px-3 py-2">Product Name</th>
						<th class="px-3 py-2">Category</th>
						<th class="px-3 py-2">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each products as product}
						<tr>
							<td class="px-3 py-3 font-mono text-xs font-semibold text-slate-950">
								<a
									href={routes.merchandiseProduct(product.product_id)}
									aria-label={`View product info for ${product.name}`}
									class="inline-flex rounded text-teal-800 underline decoration-teal-800/30 underline-offset-2 hover:text-teal-950 hover:decoration-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
								>
									{product.product_id}
								</a>
							</td>
							<td class="px-3 py-3 font-semibold text-slate-950">{product.name}</td>
							<td class="px-3 py-3 text-slate-700">{product.category}</td>
							<td class="px-3 py-3">
								<div class="flex flex-wrap gap-2">
									<AdminButton
										href={routes.merchandiseProduct(product.product_id)}
										variant="secondary"
									>
										Update
									</AdminButton>
									<form method="POST" action="?/deleteProduct">
										<input type="hidden" name="product_id" value={product.product_id} />
										<AdminButton type="submit" variant="danger">Delete</AdminButton>
									</form>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-3 py-4 text-slate-600"> No merchandise products found. </td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</AdminCard>

	<AdminCard title="Reservations" subtitle={`Count: ${reservations.length}`}>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-slate-200 text-left text-sm">
				<thead class="text-xs uppercase tracking-wide text-slate-500">
					<tr>
						<th class="px-3 py-2">Reference</th>
						<th class="px-3 py-2">Customer</th>
						<th class="px-3 py-2">Items</th>
						<th class="px-3 py-2">Total</th>
						<th class="px-3 py-2">Date</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each reservations as reservation}
						<tr>
							<td class="px-3 py-3 font-semibold text-slate-950">{reservation.reservation_id}</td>
							<td class="px-3 py-3">
								<p class="font-semibold text-slate-950">{reservation.customer_name}</p>
								<p class="text-slate-600">{reservation.email}</p>
							</td>
							<td class="px-3 py-3 text-slate-700">
								{#each reservation.items as item}
									<p>
										{item.quantity}x {item.product_name}
										{#if item.selected_size || item.selected_color}
											<span class="text-slate-500">
												({[item.selected_size, item.selected_color].filter(Boolean).join(' / ')})
											</span>
										{/if}
									</p>
								{/each}
							</td>
							<td class="px-3 py-3 font-semibold text-slate-950">
								{formatMoney(reservation.amount_total, reservation.currency)}
							</td>
							<td class="px-3 py-3 text-slate-600">{formatDate(reservation.reserved_at)}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-3 py-4 text-slate-600">No merch reservations found.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</AdminCard>
</AdminPage>
