<script lang="ts">
	import { merchProductCategories } from '$lib/domain/merchandise';
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: products = data.products ?? [];
	$: reservations = data.reservations ?? [];

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

	function listValue(values: string[]) {
		return values.join(', ');
	}

	function enforceMaxProductImages(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const selectedCount = input.files?.length ?? 0;
		if (selectedCount > 5) {
			input.setCustomValidity('Upload at most 5 product images.');
			input.reportValidity();
			input.value = '';
			return;
		}

		input.setCustomValidity('');
	}
</script>

<AdminPage
	title="Merchandise"
	subtitle={`${products.length} products | ${reservations.length} reservations`}
>
	<AdminCard title="Add Product">
		<form
			method="POST"
			action="?/createProduct"
			enctype="multipart/form-data"
			class="grid gap-4 md:grid-cols-2"
		>
			<label class="block text-sm font-semibold text-slate-700">
				Product Name
				<input
					name="name"
					required
					class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
				/>
			</label>
			<label class="block text-sm font-semibold text-slate-700">
				Category
				<select
					name="category"
					required
					class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
				>
					{#each merchProductCategories as category}
						<option value={category}>{category}</option>
					{/each}
				</select>
			</label>
			<label class="block text-sm font-semibold text-slate-700">
				Price Per Unit
				<input
					name="unit_price"
					type="number"
					step="0.01"
					min="0"
					required
					class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
				/>
			</label>
			<label class="block text-sm font-semibold text-slate-700">
				Stock
				<input
					name="stock_count"
					type="number"
					min="0"
					step="1"
					required
					class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
				/>
			</label>
			<label class="block text-sm font-semibold text-slate-700">
				Currency
				<input
					name="currency"
					value="EUR"
					required
					class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
				/>
			</label>
			<label class="block text-sm font-semibold text-slate-700">
				Sizes
				<input
					name="sizes"
					class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
				/>
			</label>
			<label class="block text-sm font-semibold text-slate-700">
				Colors
				<input
					name="colors"
					class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
				/>
			</label>
			<label class="block text-sm font-semibold text-slate-700 md:col-span-2">
				Product Description
				<textarea
					name="description"
					required
					rows="4"
					class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
				/>
			</label>
			<label class="block text-sm font-semibold text-slate-700 md:col-span-2">
				Product Images (max 5)
				<input
					name="images"
					type="file"
					accept="image/png,image/jpeg,image/webp"
					multiple
					aria-label="Product images, maximum 5"
					on:change={enforceMaxProductImages}
					class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950"
				/>
			</label>
			<label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
				<input name="is_active" type="checkbox" checked class="h-4 w-4 rounded border-slate-300" />
				Active
			</label>
			<div class="flex items-end justify-start md:justify-end">
				<AdminButton type="submit">Create Product</AdminButton>
			</div>
		</form>
	</AdminCard>

	{#each products as product}
		<AdminCard title={product.name} subtitle={`${product.product_id} | ${product.category}`}>
			<form
				method="POST"
				action="?/updateProduct"
				enctype="multipart/form-data"
				class="grid gap-4 md:grid-cols-2"
			>
				<input type="hidden" name="product_id" value={product.product_id} />
				<label class="block text-sm font-semibold text-slate-700">
					Product Name
					<input
						name="name"
						value={product.name}
						required
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
					/>
				</label>
				<label class="block text-sm font-semibold text-slate-700">
					Category
					<select
						name="category"
						required
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
					>
						{#each merchProductCategories as category}
							<option value={category} selected={product.category === category}>{category}</option>
						{/each}
					</select>
				</label>
				<label class="block text-sm font-semibold text-slate-700">
					Price Per Unit
					<input
						name="unit_price"
						type="number"
						step="0.01"
						min="0"
						value={product.unit_price}
						required
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
					/>
				</label>
				<label class="block text-sm font-semibold text-slate-700">
					Stock
					<input
						name="stock_count"
						type="number"
						min="0"
						step="1"
						value={product.stock_count}
						required
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
					/>
				</label>
				<label class="block text-sm font-semibold text-slate-700">
					Currency
					<input
						name="currency"
						value={product.currency}
						required
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
					/>
				</label>
				<label class="block text-sm font-semibold text-slate-700">
					Sizes
					<input
						name="sizes"
						value={listValue(product.sizes)}
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
					/>
				</label>
				<label class="block text-sm font-semibold text-slate-700">
					Colors
					<input
						name="colors"
						value={listValue(product.colors)}
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
					/>
				</label>
				<label class="block text-sm font-semibold text-slate-700 md:col-span-2">
					Product Description
					<textarea
						name="description"
						required
						rows="4"
						class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
						>{product.description}</textarea
					>
				</label>

				{#if product.image_urls.length > 0}
					<div class="md:col-span-2">
						<p class="mb-2 text-sm font-semibold text-slate-700">Images</p>
						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
							{#each product.image_urls as imageUrl, index}
								<label class="block rounded-md border border-slate-200 bg-slate-50 p-2 text-sm">
									<img
										src={imageUrl}
										alt={`${product.name} image ${index + 1}`}
										class="h-24 w-full rounded object-cover"
									/>
									<span class="mt-2 flex items-center gap-2 font-semibold text-slate-700">
										<input
											name="remove_image_url"
											type="checkbox"
											value={imageUrl}
											class="h-4 w-4 rounded border-slate-300"
										/>
										Remove
									</span>
								</label>
							{/each}
						</div>
					</div>
				{/if}

				<label class="block text-sm font-semibold text-slate-700 md:col-span-2">
					Add Product Images (max 5 total)
					<input
						name="images"
						type="file"
						accept="image/png,image/jpeg,image/webp"
						multiple
						aria-label="Add product images, maximum 5 total"
						on:change={enforceMaxProductImages}
						class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950"
					/>
				</label>
				<label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
					<input
						name="is_active"
						type="checkbox"
						checked={product.is_active}
						class="h-4 w-4 rounded border-slate-300"
					/>
					Active
				</label>
				<div class="flex items-end justify-start gap-2 md:justify-end">
					<AdminButton type="submit">Update</AdminButton>
				</div>
			</form>
			<form method="POST" action="?/deleteProduct" class="mt-4 flex justify-start md:justify-end">
				<input type="hidden" name="product_id" value={product.product_id} />
				<AdminButton type="submit" variant="danger">Delete</AdminButton>
			</form>
		</AdminCard>
	{:else}
		<AdminCard>
			<p class="text-sm text-slate-600">No merchandise products found.</p>
		</AdminCard>
	{/each}

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
