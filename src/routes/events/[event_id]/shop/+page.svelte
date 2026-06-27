<script lang="ts">
	import { page } from '$app/stores';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type {
		MerchReservationActionData,
		MerchReservationFormErrors,
		ServerData
	} from './+page.server';

	export let data: ServerData;
	export let form: MerchReservationActionData | undefined;

	let validationErrors: MerchReservationFormErrors = {};

	$: validationErrors = { ...(form?.errors ?? {}) };
	$: isJewelsEvent = $page.params.event_id === 'jewels2026';
	$: shopKicker = isJewelsEvent ? 'JEWELS Europe Shop' : 'Grand Feast Shop';
	$: shopPlaceholderLabel = isJewelsEvent ? 'JEWELS' : 'Grand Feast';

	function formatMoney(value: number, currency = 'EUR') {
		return new Intl.NumberFormat('en-IE', {
			style: 'currency',
			currency
		}).format(value);
	}

	function fieldError(field: string): string {
		return validationErrors[field] ?? '';
	}

	function inputClass(field: string): string {
		return [
			'mt-1 w-full rounded-md border bg-white px-3 py-2 text-slate-950',
			fieldError(field) ? 'border-[#ff9c9c] ring-2 ring-[#ff9c9c]/45' : 'border-white/15'
		].join(' ');
	}

	function quantityField(productId: string): string {
		return `quantity_${productId}`;
	}

	function sizeField(productId: string): string {
		return `size_${productId}`;
	}

	function colorField(productId: string): string {
		return `color_${productId}`;
	}

	function quantityValue(productId: string): string {
		return form?.values.quantities[productId] ?? '0';
	}

	function selectedSize(productId: string): string {
		return form?.values.sizes[productId] ?? '';
	}

	function selectedColor(productId: string): string {
		return form?.values.colors[productId] ?? '';
	}

	function textValue(field: 'customer_name' | 'email' | 'mobile'): string {
		return form?.values[field] ?? '';
	}
</script>

<svelte:head>
	<script>
		(function () {
			var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			var invalidClasses = ['border-[#ff9c9c]', 'ring-2', 'ring-[#ff9c9c]/45'];
			var validClasses = ['border-white/15'];

			document.documentElement.dataset.merchValidationReady = 'true';

			function readString(form, name) {
				var value = new FormData(form).get(name);
				return typeof value === 'string' ? value.trim() : '';
			}

			function validate(form) {
				var errors = {};
				var customerName = readString(form, 'customer_name');
				var email = readString(form, 'email');
				var mobile = readString(form, 'mobile');
				var quantityInputs = Array.from(form.querySelectorAll('[data-merch-quantity]'));
				var hasSelectedItem = false;
				var hasQuantityError = false;

				if (!customerName) errors.customer_name = 'Customer name is required.';
				if (!email) errors.email = 'Email is required.';
				else if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.';
				if (!mobile) errors.mobile = 'Mobile number is required.';

				for (var input of quantityInputs) {
					var value = input.value.trim();
					if (!value) continue;

					if (!/^\d+$/.test(value)) {
						errors[input.name] = 'Enter a whole number quantity.';
						hasQuantityError = true;
						continue;
					}

					var quantity = Number(value);
					var maxQuantity = Number(input.max || '99');
					if (quantity > maxQuantity) {
						errors[input.name] = 'Only ' + maxQuantity + ' available.';
						hasQuantityError = true;
						continue;
					}

					if (quantity > 0) {
						hasSelectedItem = true;
						validateProductOptions(form, input, errors);
					}
				}

				if (!hasSelectedItem && !hasQuantityError && quantityInputs[0]) {
					errors[quantityInputs[0].name] = 'Select qty.';
				}

				return errors;
			}

			function validateProductOptions(form, quantityInput, errors) {
				var productId = quantityInput.dataset.merchProductId;
				if (!productId) return;

				var sizeSelect = form.elements.namedItem('size_' + productId);
				var colorSelect = form.elements.namedItem('color_' + productId);

				if (sizeSelect instanceof HTMLSelectElement && sizeSelect.options.length > 1) {
					if (!sizeSelect.value) errors[sizeSelect.name] = 'Select size.';
				}

				if (colorSelect instanceof HTMLSelectElement && colorSelect.options.length > 1) {
					if (!colorSelect.value) errors[colorSelect.name] = 'Select color.';
				}
			}

			function hasErrors(errors) {
				return Object.keys(errors).some(function (key) {
					return Boolean(errors[key]);
				});
			}

			function errorIdFor(field) {
				return field.replace(/[^a-zA-Z0-9_-]/g, '-') + '-error';
			}

			function findOrCreateError(control, field) {
				var describedBy = control.getAttribute('aria-describedby');
				var existing = describedBy ? document.getElementById(describedBy.split(/\s+/)[0]) : null;
				if (existing) return existing;

				var error = document.getElementById(errorIdFor(field));
				if (!error) {
					error = document.createElement('p');
					error.id = errorIdFor(field);
					error.className = 'mt-2 text-xs font-bold text-[#ffd6d6]';
					control.insertAdjacentElement('afterend', error);
				}
				control.setAttribute('aria-describedby', error.id);
				return error;
			}

			function setFieldError(form, field, message) {
				var control = form.elements.namedItem(field);
				if (!(control instanceof HTMLElement)) return;

				var error = findOrCreateError(control, field);
				error.textContent = message || '';
				error.hidden = !message;
				control.setAttribute('aria-invalid', message ? 'true' : 'false');

				for (var invalidClass of invalidClasses)
					control.classList.toggle(invalidClass, Boolean(message));
				for (var validClass of validClasses) control.classList.toggle(validClass, !message);
			}

			function renderErrors(form, errors) {
				var fields = ['customer_name', 'email', 'mobile'].concat(
					Array.from(form.querySelectorAll('[data-merch-validation-field]')).map(function (field) {
						return field.name;
					})
				);

				for (var field of fields) setFieldError(form, field, errors[field] || '');
			}

			function firstInvalidField(form, errors) {
				var fields = ['customer_name', 'email', 'mobile'].concat(
					Array.from(form.querySelectorAll('[data-merch-validation-field]')).map(function (field) {
						return field.name;
					})
				);
				return fields.find(function (field) {
					return Boolean(errors[field]);
				});
			}

			function validateBeforeSubmit(form, event) {
				var errors = validate(form);
				form.dataset.validationStarted = 'true';
				renderErrors(form, errors);
				if (!hasErrors(errors)) return true;

				event.preventDefault();
				event.stopPropagation();
				var field = firstInvalidField(form, errors);
				var control = field ? form.elements.namedItem(field) : null;
				if (control instanceof HTMLElement) control.focus();
				return false;
			}

			function readGalleryImages(gallery) {
				try {
					var parsed = JSON.parse(gallery.dataset.merchGalleryImages || '[]');
					return Array.isArray(parsed)
						? parsed.filter(function (url) {
								return typeof url === 'string' && url.length > 0;
							})
						: [];
				} catch {
					return [];
				}
			}

			function showGalleryImage(gallery, direction) {
				var images = readGalleryImages(gallery);
				if (images.length < 2) return;

				var currentIndex = Number(gallery.dataset.merchGalleryIndex || '0');
				var nextIndex = (currentIndex + direction + images.length) % images.length;
				var productName = gallery.dataset.merchGalleryProductName || 'Product';
				var image = gallery.querySelector('[data-merch-gallery-image]');
				var counter = gallery.querySelector('[data-merch-gallery-counter]');

				gallery.dataset.merchGalleryIndex = String(nextIndex);

				if (image instanceof HTMLImageElement) {
					image.src = images[nextIndex];
					image.alt = productName + ' photo ' + (nextIndex + 1);
				}

				if (counter instanceof HTMLElement) {
					counter.textContent = nextIndex + 1 + ' / ' + images.length;
				}
			}

			document.addEventListener('click', function (event) {
				var control =
					event.target instanceof Element
						? event.target.closest('[data-merch-gallery-prev], [data-merch-gallery-next]')
						: null;
				if (!(control instanceof HTMLElement)) return;

				var gallery = control.closest('[data-merch-gallery]');
				if (!(gallery instanceof HTMLElement)) return;

				event.preventDefault();
				showGalleryImage(gallery, control.hasAttribute('data-merch-gallery-next') ? 1 : -1);
			});

			document.addEventListener(
				'click',
				function (event) {
					var submitter =
						event.target instanceof HTMLElement
							? event.target.closest('[data-merch-submit]')
							: null;
					if (!(submitter instanceof HTMLElement)) return;

					var form = submitter.closest('[data-merch-reservation-form]');
					if (!(form instanceof HTMLFormElement)) return;

					if (!validateBeforeSubmit(form, event)) return;

					event.preventDefault();
					HTMLFormElement.prototype.submit.call(form);
				},
				true
			);

			document.addEventListener(
				'submit',
				function (event) {
					var form = event.target;
					if (
						!(form instanceof HTMLFormElement) ||
						!form.matches('[data-merch-reservation-form]')
					) {
						return;
					}

					validateBeforeSubmit(form, event);
				},
				true
			);

			window.validateMerchReservationForm = function (form, event) {
				return validateBeforeSubmit(form, event);
			};

			document.addEventListener('input', function (event) {
				var control = event.target;
				if (!(control instanceof HTMLElement)) return;
				var form = control.closest('[data-merch-reservation-form]');
				if (!(form instanceof HTMLFormElement) || form.dataset.validationStarted !== 'true') return;

				renderErrors(form, validate(form));
			});

			document.addEventListener('change', function (event) {
				var control = event.target;
				if (!(control instanceof HTMLElement)) return;
				var form = control.closest('[data-merch-reservation-form]');
				if (!(form instanceof HTMLFormElement) || form.dataset.validationStarted !== 'true') return;

				renderErrors(form, validate(form));
			});
		})();
	</script>
</svelte:head>

<section class="public-shop-page px-4 pb-16 pt-10">
	<div class="mx-auto max-w-6xl">
		<p class="conference-kicker">{shopKicker}</p>
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
		class="public-shop-page px-4 pb-24"
		novalidate
		data-merch-reservation-form
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
									{#if product.image_urls.length > 0}
										<div
											class="relative flex aspect-[4/3] w-full items-center justify-center bg-[#f4fbff] p-4"
											data-merch-gallery
											data-merch-gallery-index="0"
											data-merch-gallery-images={JSON.stringify(product.image_urls)}
											data-merch-gallery-product-name={product.name}
										>
											<img
												src={product.image_urls[0]}
												alt={product.image_urls.length === 1
													? product.name
													: `${product.name} photo 1`}
												class="h-full w-full object-contain"
												data-merch-gallery-image
											/>

											{#if product.image_urls.length > 1}
												<button
													type="button"
													class="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-900/10 bg-white/92 text-slate-950 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#f3c15f]"
													aria-label={`Previous photo for ${product.name}`}
													data-merch-gallery-prev
												>
													<ChevronLeft size={20} strokeWidth={2.5} aria-hidden="true" />
												</button>

												<button
													type="button"
													class="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-900/10 bg-white/92 text-slate-950 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#f3c15f]"
													aria-label={`Next photo for ${product.name}`}
													data-merch-gallery-next
												>
													<ChevronRight size={20} strokeWidth={2.5} aria-hidden="true" />
												</button>

												<p
													class="absolute bottom-3 right-3 rounded-full bg-slate-950/72 px-2.5 py-1 text-xs font-black text-white"
													aria-live="polite"
													data-merch-gallery-counter
												>
													1 / {product.image_urls.length}
												</p>
											{/if}
										</div>
									{:else}
										<div
											class="flex aspect-[4/3] items-center justify-center bg-[#052a3a] text-sm font-bold uppercase tracking-[0.18em] text-[#fff3df]/55"
										>
											{shopPlaceholderLabel}
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
													type="number"
													min="0"
													max={Math.min(product.stock_count, 99)}
													data-merch-quantity
													data-merch-validation-field
													data-merch-product-id={product.product_id}
													data-merch-product-name={product.name}
													value={quantityValue(product.product_id)}
													aria-invalid={Boolean(fieldError(quantityField(product.product_id)))}
													aria-describedby={fieldError(quantityField(product.product_id))
														? `quantity-${product.product_id}-error`
														: undefined}
													class={inputClass(quantityField(product.product_id))}
												/>
												{#if fieldError(quantityField(product.product_id))}
													<p
														id={`quantity-${product.product_id}-error`}
														class="mt-2 text-xs font-bold text-[#ffd6d6]"
													>
														{fieldError(quantityField(product.product_id))}
													</p>
												{/if}
											</label>

											{#if product.sizes.length > 0}
												<label class="block text-sm font-semibold text-[#fff3df]/82">
													Size
													<select
														name={`size_${product.product_id}`}
														data-merch-validation-field
														aria-invalid={Boolean(fieldError(sizeField(product.product_id)))}
														aria-describedby={fieldError(sizeField(product.product_id))
															? `size-${product.product_id}-error`
															: undefined}
														class={inputClass(sizeField(product.product_id))}
													>
														<option value="">Select</option>
														{#each product.sizes as size}
															<option
																value={size}
																selected={selectedSize(product.product_id) === size}>{size}</option
															>
														{/each}
													</select>
													{#if fieldError(sizeField(product.product_id))}
														<p
															id={`size-${product.product_id}-error`}
															class="mt-2 text-xs font-bold text-[#ffd6d6]"
														>
															{fieldError(sizeField(product.product_id))}
														</p>
													{/if}
												</label>
											{/if}

											{#if product.colors.length > 0}
												<label class="block text-sm font-semibold text-[#fff3df]/82">
													Color
													<select
														name={`color_${product.product_id}`}
														data-merch-validation-field
														aria-invalid={Boolean(fieldError(colorField(product.product_id)))}
														aria-describedby={fieldError(colorField(product.product_id))
															? `color-${product.product_id}-error`
															: undefined}
														class={inputClass(colorField(product.product_id))}
													>
														<option value="">Select</option>
														{#each product.colors as color}
															<option
																value={color}
																selected={selectedColor(product.product_id) === color}
																>{color}</option
															>
														{/each}
													</select>
													{#if fieldError(colorField(product.product_id))}
														<p
															id={`color-${product.product_id}-error`}
															class="mt-2 text-xs font-bold text-[#ffd6d6]"
														>
															{fieldError(colorField(product.product_id))}
														</p>
													{/if}
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
							name="customer_name"
							required
							autocomplete="name"
							value={textValue('customer_name')}
							aria-invalid={Boolean(fieldError('customer_name'))}
							aria-describedby={fieldError('customer_name') ? 'customer-name-error' : undefined}
							class={inputClass('customer_name')}
						/>
						{#if fieldError('customer_name')}
							<p id="customer-name-error" class="mt-2 text-xs font-bold text-[#ffd6d6]">
								{fieldError('customer_name')}
							</p>
						{/if}
					</label>
					<label class="block text-sm font-semibold text-[#fff3df]/82">
						Email
						<input
							name="email"
							type="email"
							required
							autocomplete="email"
							value={textValue('email')}
							aria-invalid={Boolean(fieldError('email'))}
							aria-describedby={fieldError('email') ? 'email-error' : undefined}
							class={inputClass('email')}
						/>
						{#if fieldError('email')}
							<p id="email-error" class="mt-2 text-xs font-bold text-[#ffd6d6]">
								{fieldError('email')}
							</p>
						{/if}
					</label>
					<label class="block text-sm font-semibold text-[#fff3df]/82">
						Mobile
						<input
							name="mobile"
							type="tel"
							required
							value={textValue('mobile')}
							aria-invalid={Boolean(fieldError('mobile'))}
							aria-describedby={fieldError('mobile') ? 'mobile-error' : undefined}
							class={inputClass('mobile')}
						/>
						{#if fieldError('mobile')}
							<p id="mobile-error" class="mt-2 text-xs font-bold text-[#ffd6d6]">
								{fieldError('mobile')}
							</p>
						{/if}
					</label>
					{#if fieldError('items')}
						<p
							class="rounded-md border border-[#ff9c9c]/45 bg-[#ff9c9c]/10 p-3 text-sm font-bold text-[#ffd6d6]"
						>
							{fieldError('items')}
						</p>
					{/if}
					<button
						type="button"
						data-merch-submit
						class="conference-button w-full px-5 py-3 text-sm"
					>
						Reserve Merchandise
					</button>
				</div>
			</section>
		</div>
	</form>
{:else}
	<section class="public-shop-page px-4 pb-24">
		<div class="conference-panel mx-auto max-w-3xl p-8 text-center">
			<h2 class="text-3xl font-black text-white">Shop Coming Soon</h2>
			<p class="mt-3 text-[#fff3df]/76">Merchandise will appear here once it is available.</p>
		</div>
	</section>
{/if}
