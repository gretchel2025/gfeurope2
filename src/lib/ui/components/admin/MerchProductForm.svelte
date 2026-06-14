<script lang="ts">
	import { merchProductCategories, type MerchProduct } from '$lib/domain/merchandise';
	import AdminButton from '$lib/ui/components/admin/AdminButton.svelte';

	export let action: string;
	export let submitLabel = 'Save Product';
	export let backHref: string;
	export let product: MerchProduct | undefined = undefined;

	let selectedCategory = product?.category ?? merchProductCategories[0];

	function listValue(values: string[] | undefined) {
		return (values ?? []).join(', ');
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

<form method="POST" {action} enctype="multipart/form-data" class="grid gap-4 md:grid-cols-2">
	{#if product}
		<div class="block text-sm font-semibold text-slate-700">
			Product ID
			<p class="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-950">
				{product.product_id}
			</p>
			<input type="hidden" name="product_id" value={product.product_id} />
		</div>
	{/if}

	<label class="block text-sm font-semibold text-slate-700">
		Product Name
		<input
			name="name"
			value={product?.name ?? ''}
			required
			class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
		/>
	</label>

	<label class="block text-sm font-semibold text-slate-700">
		Category
		<select
			name="category"
			required
			bind:value={selectedCategory}
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
			value={product?.unit_price ?? ''}
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
			value={product?.stock_count ?? ''}
			required
			class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
		/>
	</label>

	<label class="block text-sm font-semibold text-slate-700">
		Currency
		<input
			name="currency"
			value={product?.currency ?? 'EUR'}
			required
			class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
		/>
	</label>

	<label class="block text-sm font-semibold text-slate-700">
		Sizes
		<input
			name="sizes"
			value={listValue(product?.sizes)}
			class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950"
		/>
	</label>

	<label class="block text-sm font-semibold text-slate-700">
		Colors
		<input
			name="colors"
			value={listValue(product?.colors)}
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
			>{product?.description ?? ''}</textarea
		>
	</label>

	{#if product && product.image_urls.length > 0}
		<div class="md:col-span-2">
			<p class="mb-2 text-sm font-semibold text-slate-700">Images</p>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
				{#each product.image_urls as imageUrl, index}
					<label class="block rounded-md border border-slate-200 bg-slate-50 p-2 text-sm">
						<img
							src={imageUrl}
							alt={`${product.name} image ${index + 1}`}
							class="h-24 w-full rounded bg-white object-contain"
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
		{product ? 'Add Product Images (max 5 total)' : 'Product Images (max 5)'}
		<input
			name="images"
			type="file"
			accept="image/png,image/jpeg,image/webp"
			multiple
			aria-label={product ? 'Add product images, maximum 5 total' : 'Product images, maximum 5'}
			on:change={enforceMaxProductImages}
			class="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950"
		/>
	</label>

	<label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
		<input
			name="is_active"
			type="checkbox"
			checked={product?.is_active ?? true}
			class="h-4 w-4 rounded border-slate-300"
		/>
		Active
	</label>

	<div class="flex flex-wrap items-end justify-start gap-2 md:justify-end">
		<AdminButton href={backHref} variant="secondary">Cancel</AdminButton>
		<AdminButton type="submit">{submitLabel}</AdminButton>
	</div>
</form>
