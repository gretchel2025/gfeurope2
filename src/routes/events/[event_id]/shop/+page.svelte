<script lang="ts">
	import { onMount } from 'svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	let customerNameInput: HTMLInputElement | undefined;
	let emailInput: HTMLInputElement | undefined;

	onMount(() => {
		syncInitialReservationDetailPrompts();
	});

	function formatMoney(value: number, currency = 'EUR') {
		return new Intl.NumberFormat('en-IE', {
			style: 'currency',
			currency
		}).format(value);
	}

	function syncProductOptionRequirements(event: Event) {
		const quantityInput = event.currentTarget as HTMLInputElement;
		syncOptionRequirementsForQuantity(quantityInput);
	}

	function syncReservationFormRequirements(event: Event) {
		const form = reservationFormFromEvent(event);
		if (!form) return;

		syncProductOptionRequirementsForForm(form);
		syncReservationDetailPrompts(form);
	}

	function reservationFormFromEvent(event: Event): HTMLFormElement | null {
		if (event.currentTarget instanceof HTMLFormElement) return event.currentTarget;
		if (event.currentTarget instanceof HTMLButtonElement) return event.currentTarget.form;
		return null;
	}

	function syncProductOptionRequirementsForForm(form: HTMLFormElement) {
		for (const quantityInput of form.querySelectorAll<HTMLInputElement>('input[data-product-id]')) {
			syncOptionRequirementsForQuantity(quantityInput);
		}
	}

	function syncOptionRequirementsForQuantity(quantityInput: HTMLInputElement) {
		const form = quantityInput.form;
		const productId = quantityInput.dataset.productId;
		if (!form || !productId) return;

		const quantity = Number(quantityInput.value);
		const isRequired = Number.isFinite(quantity) && quantity > 0;

		for (const optionSelect of form.querySelectorAll<HTMLSelectElement>(
			'select[data-option-product-id]'
		)) {
			if (optionSelect.dataset.optionProductId !== productId) continue;

			optionSelect.required = isRequired;
			syncOptionPrompt(optionSelect);
		}
	}

	function clearOptionPrompt(event: Event) {
		syncOptionPrompt(event.currentTarget as HTMLSelectElement);
	}

	function syncOptionPrompt(optionSelect: HTMLSelectElement) {
		if (optionSelect.required && !optionSelect.value) {
			optionSelect.setCustomValidity(
				`Please select a ${optionSelect.dataset.optionLabel ?? 'selection'} for ${
					optionSelect.dataset.productName ?? 'this product'
				}.`
			);
			return;
		}

		optionSelect.setCustomValidity('');
	}

	function syncReservationDetailPrompts(form: HTMLFormElement) {
		const customerNameInput = form.querySelector<HTMLInputElement>('input[name="customer_name"]');
		const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');

		if (customerNameInput) syncCustomerNameInputPrompt(customerNameInput);
		if (emailInput) syncEmailInputPrompt(emailInput);
	}

	function syncInitialReservationDetailPrompts() {
		if (customerNameInput) syncCustomerNameInputPrompt(customerNameInput);
		if (emailInput) syncEmailInputPrompt(emailInput);
	}

	function syncEmailPrompt(event: Event) {
		syncEmailInputPrompt(event.currentTarget as HTMLInputElement);
	}

	function syncEmailInputPrompt(emailInput: HTMLInputElement) {
		const email = emailInput.value.trim();

		if (!email) {
			emailInput.setCustomValidity('Email is required.');
			return;
		}

		if (!emailPattern.test(email)) {
			emailInput.setCustomValidity('Please enter a valid email address.');
			return;
		}

		emailInput.setCustomValidity('');
	}

	function syncCustomerNamePrompt(event: Event) {
		syncCustomerNameInputPrompt(event.currentTarget as HTMLInputElement);
	}

	function syncCustomerNameInputPrompt(customerNameInput: HTMLInputElement) {
		customerNameInput.setCustomValidity(
			customerNameInput.value.trim() ? '' : 'Customer name is required.'
		);
	}
</script>

<section class="px-4 pb-16 pt-10">
	<div class="mx-auto max-w-6xl">
		<p class="conference-kicker">Grand Feast Shop</p>
		<h1 class="mt-3 max-w-3xl text-4xl font-black uppercase leading-tight text-white sm:text-6xl">
			Event Merchandise
		</h1>
		<p class="mt-4 max-w-2xl text-lg leading-8 text-[#fff3df]/78">
			Reserve your merch online and pick it up at the event.
		</p>
	</div>
</section>

{#if data.categories.length > 0}
	<form
		method="POST"
		action="?/reserve"
		class="px-4 pb-24"
		on:submit={syncReservationFormRequirements}
	>
		<div class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
			<div class="space-y-12">
				{#each data.categories as category}
					<section>
						<div class="mb-5 flex items-end justify-between gap-4">
							<div>
								<p class="conference-kicker">Category</p>
								<h2 class="mt-2 text-3xl font-black text-white">{category.category}</h2>
							</div>
						</div>

						<div class="grid gap-5 md:grid-cols-2">
							{#each category.products as product}
								<article
									class="overflow-hidden rounded-lg border border-white/12 bg-white/8 shadow-xl backdrop-blur"
								>
									{#if product.image_urls[0]}
										<div
											class="flex aspect-[4/3] w-full items-center justify-center bg-[#f4fbff] p-4"
										>
											<img
												src={product.image_urls[0]}
												alt={product.name}
												class="h-full w-full object-contain"
											/>
										</div>
									{:else}
										<div
											class="flex aspect-[4/3] items-center justify-center bg-[#052a3a] text-sm font-bold uppercase tracking-[0.18em] text-[#fff3df]/55"
										>
											Grand Feast
										</div>
									{/if}

									<div class="space-y-4 p-5">
										<div>
											<p class="text-sm font-black uppercase tracking-[0.18em] text-[#f3c15f]">
												{formatMoney(product.unit_price, product.currency)}
											</p>
											<h3 class="mt-1 text-2xl font-black text-white">{product.name}</h3>
											<p class="mt-2 text-sm leading-6 text-[#fff3df]/72">
												{product.description}
											</p>
										</div>

										<div class="grid gap-3 sm:grid-cols-3">
											<input type="hidden" name="product_id" value={product.product_id} />
											<label class="block text-sm font-semibold text-[#fff3df]/82">
												Qty
												<input
													name={`quantity_${product.product_id}`}
													data-product-id={product.product_id}
													type="number"
													min="0"
													max={product.stock_count}
													value="0"
													on:input={syncProductOptionRequirements}
													on:change={syncProductOptionRequirements}
													class="mt-1 w-full rounded-md border border-white/15 bg-white px-3 py-2 text-slate-950"
												/>
											</label>

											{#if product.sizes.length > 0}
												<label class="block text-sm font-semibold text-[#fff3df]/82">
													Size
													<select
														name={`size_${product.product_id}`}
														data-option-product-id={product.product_id}
														data-option-label="size"
														data-product-name={product.name}
														on:change={clearOptionPrompt}
														class="mt-1 w-full rounded-md border border-white/15 bg-white px-3 py-2 text-slate-950"
													>
														<option value="">Select</option>
														{#each product.sizes as size}
															<option value={size}>{size}</option>
														{/each}
													</select>
												</label>
											{/if}

											{#if product.colors.length > 0}
												<label class="block text-sm font-semibold text-[#fff3df]/82">
													Color
													<select
														name={`color_${product.product_id}`}
														data-option-product-id={product.product_id}
														data-option-label="color"
														data-product-name={product.name}
														on:change={clearOptionPrompt}
														class="mt-1 w-full rounded-md border border-white/15 bg-white px-3 py-2 text-slate-950"
													>
														<option value="">Select</option>
														{#each product.colors as color}
															<option value={color}>{color}</option>
														{/each}
													</select>
												</label>
											{/if}
										</div>

										<p class="text-sm font-semibold text-[#fff3df]/60">
											{product.stock_count} available
										</p>
									</div>
								</article>
							{/each}
						</div>
					</section>
				{/each}
			</div>

			<section
				class="sticky top-4 rounded-lg border border-white/12 bg-[#021821]/90 p-5 shadow-xl backdrop-blur"
			>
				<h2 class="text-2xl font-black text-white">Reservation Details</h2>
				<div class="mt-5 space-y-4">
					<label class="block text-sm font-semibold text-[#fff3df]/82">
						Customer Name
						<input
							bind:this={customerNameInput}
							name="customer_name"
							required
							autocomplete="name"
							on:input={syncCustomerNamePrompt}
							on:change={syncCustomerNamePrompt}
							on:invalid={syncCustomerNamePrompt}
							class="mt-1 w-full rounded-md border border-white/15 bg-white px-3 py-2 text-slate-950"
						/>
					</label>
					<label class="block text-sm font-semibold text-[#fff3df]/82">
						Email
						<input
							bind:this={emailInput}
							name="email"
							type="email"
							required
							autocomplete="email"
							on:input={syncEmailPrompt}
							on:change={syncEmailPrompt}
							on:invalid={syncEmailPrompt}
							class="mt-1 w-full rounded-md border border-white/15 bg-white px-3 py-2 text-slate-950"
						/>
					</label>
					<label class="block text-sm font-semibold text-[#fff3df]/82">
						Mobile
						<input
							name="mobile"
							type="tel"
							required
							class="mt-1 w-full rounded-md border border-white/15 bg-white px-3 py-2 text-slate-950"
						/>
					</label>
					<button
						type="submit"
						class="conference-button w-full px-5 py-3 text-sm"
						on:click={syncReservationFormRequirements}
					>
						Reserve Merchandise
					</button>
				</div>
			</section>
		</div>
	</form>
{:else}
	<section class="px-4 pb-24">
		<div class="conference-panel mx-auto max-w-3xl p-8 text-center">
			<h2 class="text-3xl font-black text-white">Shop Coming Soon</h2>
			<p class="mt-3 text-[#fff3df]/76">Merchandise will appear here once it is available.</p>
		</div>
	</section>
{/if}
