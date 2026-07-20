<script lang="ts">
	import { page } from '$app/stores';
	import { getEventDisplayTitle, getEventDisplayTitlePlain } from '$lib/domain/eventDisplay';
	import { getPaymentDetailsForEvent } from '$lib/domain/paymentDetails';
	import {
		allowedPaymentProofTypes,
		maxPaymentProofSizeBytes,
		maxPaymentProofSizeLabel
	} from '$lib/domain/paymentProof';
	import { computeTicketPricing, isEarlyBirdDiscountActive } from '$lib/domain/ticketType';
	import { publicRoutes } from '$lib/navigation/adminRoutes';
	import type { BookingTicketOption, ServerData } from './+page.server';

	export let data: ServerData;

	type CountryOption = {
		name: string;
		isoCode: string;
		searchKey: string;
	};
	type CityOption = {
		label: string;
		value: string;
		searchKey: string;
	};

	const MAX_TYPEAHEAD_OPTIONS = 40;
	const steps = ['Ticket', 'Details', 'Guests', 'Review'];
	const now = new Date();
	const countries: CountryOption[] = data.countryOptions;
	$: publicNav = publicRoutes($page.params.event_id);
	$: paymentDetails = getPaymentDetailsForEvent(data.event.event_id);
	$: eventDisplayTitle = getBookingDisplayTitle(data.event);
	$: eventDateDisplay = getBookingDateDisplay(data.event);
	$: eventVenueLines = getBookingVenueLines(data.event);
	$: eventSummary = getBookingEventSummary(data.event);

	const ticketOptions: BookingTicketOption[] = data.ticketOptions;

	let appliedQueryTicketType = '';
	let currentStep = 1;
	let ticketType = '';
	let quantity = 0;
	let previousQuantity = 0;
	let ticketStepSubmitted = false;
	let detailsStepSubmitted = false;
	let email = '';
	let countrySearch = '';
	let citySearch = '';
	let cityOptions: CityOption[] = [];
	let cityOptionsQueryKey = '';
	let cityOptionsRequestToken = 0;
	let selectedCountry = '';
	let selectedCity = '';
	let countryFieldTouched = false;
	let cityFieldTouched = false;
	let paymentProofFileName = '';
	let paymentProofError = '';
	let paymentProofSelected = false;
	let guests: string[] = [];
	let bookingForm: HTMLFormElement;
	let showCountryOptions = false;
	let showCityOptions = false;
	let showNonRefundableModal = false;
	let confirmedNonRefundable = false;
	let isSubmitting = false;

	$: selectedTicketOption = ticketOptions.find((option) => option.ticket_type_id === ticketType);
	$: availableTickets = selectedTicketOption?.available ?? 0;
	$: maxQuantity = availableTickets > 0 ? Math.min(10, availableTickets) : 0;
	$: selectedPricing = selectedTicketOption
		? computeTicketPricing(selectedTicketOption, quantity, now)
		: null;
	$: unitPrice = selectedPricing?.unitPrice ?? 0;
	$: subtotalAmount = selectedPricing?.subtotalAmount ?? 0;
	$: discountAmount = selectedPricing?.discountAmount ?? 0;
	$: totalAmount = selectedPricing?.totalAmount ?? 0;
	$: isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	$: countryName = selectedCountry;
	$: selectedCityName = selectedCity;
	$: primaryGuestName = guests[0]?.trim() ?? '';
	$: bookingLocation =
		selectedCityName && countryName ? `${selectedCityName}, ${countryName}` : selectedCityName;
	$: filteredCountries = filterCountryOptions(countrySearch, countries);
	$: filteredCities = filterCityOptions(citySearch, cityOptions);
	$: {
		const queryKey = `${countryName}\n${citySearch}`;
		if (!countryName) {
			cityOptions = [];
			cityOptionsQueryKey = '';
		} else if (queryKey !== cityOptionsQueryKey) {
			cityOptionsQueryKey = queryKey;
			void loadCityOptions(countryName, citySearch);
		}
	}
	$: emailValidationMessage = getEmailValidationMessage(email, detailsStepSubmitted);
	$: countryValidationMessage = getCountryValidationMessage(
		countrySearch,
		selectedCountry,
		detailsStepSubmitted || countryFieldTouched
	);
	$: cityValidationMessage = getCityValidationMessage(
		citySearch,
		selectedCity,
		detailsStepSubmitted || cityFieldTouched
	);
	$: canContinueTicket =
		Boolean(selectedTicketOption) && quantity > 0 && quantity <= availableTickets;
	$: canContinueDetails = isValidEmail && selectedCountry.length > 0 && selectedCity.length > 0;
	$: canContinueGuests =
		guests.length === quantity && guests.every((guest) => guest.trim().length > 0);
	$: canReserve =
		canContinueTicket && canContinueDetails && canContinueGuests && paymentProofSelected;

	$: if (quantity !== previousQuantity) {
		guests = Array.from({ length: quantity }, (_, index) => guests[index] ?? '');
		previousQuantity = quantity;
	}

	$: if (quantity > maxQuantity && maxQuantity > 0) {
		quantity = maxQuantity;
	}

	$: {
		const queryTicketType = $page.url.searchParams.get('ticket_type') ?? '';
		if (queryTicketType !== appliedQueryTicketType) {
			const validTicketType = getAvailableTicketType(queryTicketType);
			if (validTicketType) {
				ticketType = validTicketType;
			}
			appliedQueryTicketType = queryTicketType;
		}
	}

	function filterCountryOptions(search: string, countryOptions: CountryOption[]) {
		const normalizedSearch = normalizeTypeaheadValue(search);
		const options = normalizedSearch
			? countryOptions.filter((country) => country.searchKey.includes(normalizedSearch))
			: countryOptions;

		return [...options]
			.sort(
				(a, b) =>
					rankTypeaheadKey(a.searchKey, normalizedSearch) -
					rankTypeaheadKey(b.searchKey, normalizedSearch)
			)
			.slice(0, MAX_TYPEAHEAD_OPTIONS);
	}

	function filterCityOptions(search: string, cityOptions: CityOption[]) {
		const normalizedSearch = normalizeTypeaheadValue(search);
		const options = normalizedSearch
			? cityOptions.filter((city) => city.searchKey.includes(normalizedSearch))
			: cityOptions;

		return [...options]
			.sort(
				(a, b) =>
					rankTypeaheadKey(a.searchKey, normalizedSearch) -
					rankTypeaheadKey(b.searchKey, normalizedSearch)
			)
			.slice(0, MAX_TYPEAHEAD_OPTIONS);
	}

	function rankTypeaheadKey(normalizedLabel: string, search: string) {
		if (!search) return 0;
		if (normalizedLabel === search) return 0;
		if (normalizedLabel.startsWith(search)) return 1;
		return 2;
	}

	function normalizeTypeaheadValue(value: string) {
		return value.trim().toLowerCase();
	}

	async function loadCityOptions(country: string, search: string) {
		const requestToken = ++cityOptionsRequestToken;
		const params = new URLSearchParams({
			country,
			search
		});

		try {
			const response = await fetch(`${publicNav.newBooking}/location-options?${params}`);
			if (requestToken !== cityOptionsRequestToken) return;
			if (!response.ok) {
				cityOptions = [];
				return;
			}

			const payload = (await response.json()) as { cities?: CityOption[] };
			cityOptions = payload.cities ?? [];
		} catch {
			if (requestToken === cityOptionsRequestToken) {
				cityOptions = [];
			}
		}
	}

	function getAvailableTicketType(value: string) {
		const option = ticketOptions.find((candidate) => candidate.ticket_type_id === value);
		if (!option || option.available < 1) return '';
		return option.ticket_type_id;
	}

	function handleCountryInput(event: Event) {
		countrySearch = (event.currentTarget as HTMLInputElement).value;
		if (normalizeTypeaheadValue(countrySearch) !== normalizeTypeaheadValue(selectedCountry)) {
			selectedCountry = '';
			selectedCity = '';
			citySearch = '';
			cityOptions = [];
		}
		showCountryOptions = true;
		showCityOptions = false;
	}

	function handleCityInput(event: Event) {
		citySearch = (event.currentTarget as HTMLInputElement).value;
		if (normalizeTypeaheadValue(citySearch) !== normalizeTypeaheadValue(selectedCity)) {
			selectedCity = '';
		}
		showCityOptions = true;
	}

	function selectCountry(name: string) {
		if (normalizeTypeaheadValue(selectedCountry) !== normalizeTypeaheadValue(name)) {
			citySearch = '';
			selectedCity = '';
			cityOptions = [];
		}
		countrySearch = name;
		selectedCountry = name;
		countryFieldTouched = true;
		showCountryOptions = false;
		showCityOptions = false;
	}

	function selectCity(name: string) {
		citySearch = name;
		selectedCity = name;
		cityFieldTouched = true;
		showCityOptions = false;
	}

	function closeCountryOptions() {
		countryFieldTouched = true;
		setTimeout(() => (showCountryOptions = false), 120);
	}

	function closeCityOptions() {
		cityFieldTouched = true;
		setTimeout(() => (showCityOptions = false), 120);
	}

	function getEmailValidationMessage(value: string, submitted: boolean) {
		if (!submitted && !value) return '';
		if (!value.trim()) return 'Email address is required.';
		if (!isValidEmail) return 'Please enter a valid email address.';
		return '';
	}

	function getCountryValidationMessage(
		value: string,
		selectedValue: string,
		shouldValidate: boolean
	) {
		if (!shouldValidate) return '';
		if (!value.trim() || !selectedValue) return 'Select a valid country.';
		return '';
	}

	function getCityValidationMessage(value: string, selectedValue: string, shouldValidate: boolean) {
		if (!shouldValidate) return '';
		if (!value.trim() || !selectedValue) return 'Select a valid city.';
		return '';
	}

	function selectTicket(value: string) {
		const option = ticketOptions.find((candidate) => candidate.ticket_type_id === value);
		if (!option || option.available < 1) return;
		ticketType = value;
	}

	function formatMoney(value: number, currency = 'EUR') {
		return `${value.toFixed(2)} ${currency}`;
	}

	function formatSingleTicketDescription(option: BookingTicketOption) {
		const pricing = computeTicketPricing(option, 1, now);
		return pricing.earlyBirdDiscountActive
			? `${formatMoney(pricing.unitPrice, option.currency)} Early Bird`
			: formatMoney(option.base_price, option.currency);
	}

	function formatDate(value: string) {
		const [dateOnly] = value.split('T');
		if (dateOnly) {
			return new Intl.DateTimeFormat('en', {
				month: 'long',
				day: 'numeric',
				year: 'numeric',
				timeZone: 'UTC'
			}).format(new Date(`${dateOnly}T00:00:00Z`));
		}

		return new Intl.DateTimeFormat('en', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(value));
	}

	function decreaseQuantity() {
		quantity = Math.max(0, quantity - 1);
	}

	function increaseQuantity() {
		quantity = Math.min(maxQuantity || 10, quantity + 1);
	}

	function goToStep(step: number) {
		if (step < currentStep) {
			currentStep = step;
		}
	}

	function nextStep() {
		if (currentStep === 1) {
			ticketStepSubmitted = true;
			if (!canContinueTicket) return;
		}
		if (currentStep === 2) {
			detailsStepSubmitted = true;
			if (!canContinueDetails) return;
		}
		if (currentStep === 3 && !canContinueGuests) return;
		currentStep = Math.min(4, currentStep + 1);
	}

	function handlePaymentProofChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		paymentProofError = '';
		paymentProofFileName = '';
		paymentProofSelected = false;
		confirmedNonRefundable = false;

		if (!file) {
			return;
		}

		if (!allowedPaymentProofTypes.has(file.type)) {
			paymentProofError = 'Upload a PDF, PNG, JPG, or JPEG proof of payment.';
			input.value = '';
			return;
		}

		if (file.size > maxPaymentProofSizeBytes) {
			paymentProofError = `Proof of payment must be ${maxPaymentProofSizeLabel} or smaller.`;
			input.value = '';
			return;
		}

		paymentProofFileName = file.name;
		paymentProofSelected = true;
	}

	function handleSubmit(event: SubmitEvent) {
		if (currentStep !== 4 || !canReserve) {
			event.preventDefault();
			isSubmitting = false;
			if (!paymentProofSelected) {
				paymentProofError = 'Please upload your proof of payment before submitting.';
			}
			return;
		}

		if (!confirmedNonRefundable) {
			event.preventDefault();
			isSubmitting = false;
			showNonRefundableModal = true;
			return;
		}

		isSubmitting = true;
	}

	function cancelNonRefundableConfirmation() {
		showNonRefundableModal = false;
		confirmedNonRefundable = false;
		isSubmitting = false;
	}

	function confirmNonRefundableAndSubmit() {
		showNonRefundableModal = false;
		confirmedNonRefundable = true;
		isSubmitting = true;
		bookingForm.requestSubmit();
	}

	function handleModalKeydown(event: KeyboardEvent) {
		if (showNonRefundableModal && event.key === 'Escape') {
			cancelNonRefundableConfirmation();
		}
	}

	function getBookingDisplayTitle(event: ServerData['event']) {
		if (event.event_id === 'jewels2026') {
			return getEventDisplayTitle(event.event_id, event.title);
		}

		return 'Grand Feast Europe 2026';
	}

	function getBookingEventSummary(event: ServerData['event']) {
		if (event.event_id === 'jewels2026') {
			return `${getEventDisplayTitlePlain(event.event_id, event.title)} • ${event.country} • ${getBookingDateDisplay(event)}`;
		}

		return 'Grand Feast Europe 2026 • Dublin • October 3, 2026';
	}

	function getBookingDateDisplay(event: ServerData['event']) {
		if (event.event_id === 'jewels2026') return 'October 31 - November 1, 2026';

		return new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			timeZone: event.timezone
		}).format(new Date(event.datetime));
	}

	function getBookingVenueLines(event: ServerData['event']) {
		if (event.event_id !== 'jewels2026') {
			return ["St. Helen's Hotel"];
		}

		const venue = event.venue.trim();
		const country = event.country.trim();
		if (!country || venue.toLowerCase().includes(country.toLowerCase())) {
			return [venue];
		}

		return [venue, country];
	}
</script>

<svelte:window on:keydown={handleModalKeydown} />

<section class="public-booking-page px-4 py-12">
	<div class="mx-auto max-w-6xl">
		<hgroup class="mb-8 space-y-3 text-center">
			<p class="conference-kicker">Ticket Reservation</p>
			<h1 class="conference-section-title text-4xl sm:text-5xl">Reserve Your Seat</h1>

			<h2
				class="booking-event-summary mx-auto max-w-xl text-xl font-black leading-tight tracking-normal text-[#f3c15f] sm:text-2xl"
			>
				{eventSummary}
			</h2>
		</hgroup>

		<div class="booking-step-list mb-8 grid gap-3 sm:grid-cols-4">
			{#each steps as step, index}
				<button
					type="button"
					data-step-state={currentStep === index + 1
						? 'active'
						: index + 1 < currentStep
							? 'complete'
							: 'upcoming'}
					class={`booking-step-button border px-4 py-3 text-left font-black transition ${
						currentStep === index + 1
							? 'border-[#f3c15f] bg-[#d99a32]/20 text-white'
							: index + 1 < currentStep
								? 'border-[#f3c15f]/35 bg-[#005b72]/28 text-[#fff3df]'
								: 'border-white/10 bg-[#021821]/70 text-[#fff3df]/55'
					}`}
					on:click={() => goToStep(index + 1)}
				>
					<span class="booking-step-number text-sm text-[#f3c15f]">{index + 1}</span>
					<span class="ml-2">{step}</span>
				</button>
			{/each}
		</div>

		<form
			bind:this={bookingForm}
			method="POST"
			enctype="multipart/form-data"
			class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
			on:submit={handleSubmit}
		>
			<input type="hidden" name="ticket_type" value={ticketType} />
			<input type="hidden" name="quantity" value={quantity} />
			<input type="hidden" name="name" value={primaryGuestName} />
			<input type="hidden" name="email" value={email.trim()} />
			<input type="hidden" name="country" value={countryName} />
			<input type="hidden" name="city" value={bookingLocation} />
			{#each guests as guest, index}
				<input type="hidden" name={`guest_${index + 1}`} value={guest.trim()} />
			{/each}

			<div class="conference-panel allow-overflow public-form-card p-5 sm:p-7">
				{#if currentStep === 1}
					<section class="space-y-6">
						<div>
							<p class="conference-kicker">Step 1</p>
							<h3 class="mt-2 text-3xl font-black text-white">Choose your ticket</h3>
							<p class="mt-2 text-[#fff3df]/75">
								We’ll ask for your details and guest names after you choose your tickets.
							</p>
						</div>

						<div class="grid gap-4 md:grid-cols-2">
							{#each ticketOptions as option}
								<label
									data-testid={`ticket-option-${option.ticket_type_id}`}
									class={`conference-card block p-5 text-left transition focus-within:ring-2 focus-within:ring-[#f3c15f]/40 ${
										ticketType === option.ticket_type_id
											? 'border-[#f3c15f] ring-2 ring-[#f3c15f]/35'
											: option.available < 1
												? 'cursor-not-allowed opacity-55'
												: 'cursor-pointer hover:border-[#f3c15f]/55'
									}`}
									aria-disabled={option.available < 1}
								>
									<input
										type="radio"
										name="ticket-option"
										value={option.ticket_type_id}
										checked={ticketType === option.ticket_type_id}
										disabled={option.available < 1}
										class="sr-only"
										on:change={() => selectTicket(option.ticket_type_id)}
									/>
									<div class="flex items-start justify-between gap-4">
										<div>
											<p class="text-2xl font-black text-white">{option.label}</p>
											{#if isEarlyBirdDiscountActive(option, now)}
												<div class="mt-2 space-y-1">
													<p class="text-lg font-black text-[#fff3df]/55 line-through">
														{formatMoney(option.base_price, option.currency)}
													</p>
													<p class="text-2xl font-black text-[#f3c15f] sm:text-3xl">
														{formatSingleTicketDescription(option)}
													</p>
													<p class="text-sm font-bold text-[#fff3df]/70">
														Until {formatDate(option.early_bird_discount_available_until ?? '')}
													</p>
												</div>
											{:else}
												<p class="mt-2 text-2xl font-black text-[#f3c15f] sm:text-3xl">
													{formatSingleTicketDescription(option)}
												</p>
											{/if}
										</div>
										<span
											class={`flex h-8 w-8 items-center justify-center border text-sm font-black ${
												ticketType === option.ticket_type_id
													? 'border-[#f3c15f] bg-[#d99a32] text-[#061922]'
													: 'border-white/25 text-white/50'
											}`}
											aria-hidden="true"
										>
											{ticketType === option.ticket_type_id ? '✓' : ''}
										</span>
									</div>
									<ul class="mt-5 space-y-3 text-sm text-[#fff3df]/80">
										{#each option.notes as note}
											<li class="flex gap-2">
												<span class="font-black text-[#f3c15f]">✓</span>
												<span>{note}</span>
											</li>
										{/each}
									</ul>
									{#if option.available <= 10}
										<p class="mt-5 text-sm font-semibold text-[#fff3df]/65">
											{option.available > 0
												? `Only ${option.available} tickets left`
												: 'Currently sold out'}
										</p>
									{/if}
								</label>
							{/each}
						</div>

						<div class="conference-card p-5">
							<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h4 class="text-xl font-black text-white">How many tickets?</h4>
									<p class="mt-1 text-sm text-[#fff3df]/70">
										Choose the number of seats you want to reserve.
									</p>
								</div>
								<div class="flex items-center gap-3">
									<button
										type="button"
										class="conference-button-secondary h-12 w-12 text-2xl"
										data-testid="ticket-quantity-decrement"
										on:click={decreaseQuantity}
									>
										−
									</button>
									<div
										class="min-w-16 text-center text-4xl font-black text-white"
										data-testid="ticket-quantity-value"
									>
										{quantity}
									</div>
									<button
										type="button"
										class="conference-button-secondary h-12 w-12 text-2xl"
										data-testid="ticket-quantity-increment"
										on:click={increaseQuantity}
										disabled={quantity >= maxQuantity}
									>
										+
									</button>
								</div>
							</div>
							{#if selectedTicketOption && quantity > availableTickets}
								<p
									class="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
								>
									Only {availableTickets}
									{selectedTicketOption.label.toLowerCase()} tickets available.
								</p>
							{/if}
							{#if selectedTicketOption && ticketStepSubmitted && quantity < 1}
								<p
									class="mt-4 border border-[#f3c15f]/45 bg-[#d99a32]/15 px-4 py-3 text-sm font-semibold text-[#fff3df]"
								>
									Please select at least 1 ticket to continue.
								</p>
							{/if}
							<p class="mt-4 text-sm text-[#fff3df]/70">
								Children 12 and below do not need a ticket reservation.
							</p>
						</div>
					</section>
				{:else if currentStep === 2}
					<section class="space-y-5">
						<div>
							<p class="conference-kicker">Step 2</p>
							<h3 class="mt-2 text-3xl font-black text-white">Your details</h3>
							<p class="mt-2 text-[#fff3df]/75">
								Use the attendee email where confirmation and payment updates should be sent.
							</p>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="grid gap-2 sm:col-span-2">
								<label for="visible-email" class="font-bold text-white">Email address*</label>
								<input
									id="visible-email"
									type="email"
									placeholder="name@gmail.com"
									bind:value={email}
									required
									aria-invalid={Boolean(emailValidationMessage)}
									aria-describedby={emailValidationMessage ? 'email-error' : undefined}
									class="w-full px-4 py-3"
								/>
								{#if emailValidationMessage}
									<p
										id="email-error"
										class="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
									>
										{emailValidationMessage}
									</p>
								{/if}
							</div>

							<div class="grid gap-2">
								<label for="country" class="font-bold text-white">Country*</label>
								<div class="relative">
									<input
										id="country"
										type="text"
										placeholder="Type country, e.g. Germany"
										value={countrySearch}
										autocomplete="off"
										role="combobox"
										aria-autocomplete="list"
										aria-controls="country-options"
										aria-expanded={showCountryOptions}
										aria-invalid={Boolean(countryValidationMessage)}
										aria-describedby={countryValidationMessage ? 'country-error' : undefined}
										class={`w-full px-4 py-3 ${
											countryValidationMessage ? 'border-red-200 bg-red-50 text-red-950' : ''
										}`}
										on:focus={() => (showCountryOptions = true)}
										on:input={handleCountryInput}
										on:blur={closeCountryOptions}
									/>
									{#if showCountryOptions && filteredCountries.length > 0}
										<div
											id="country-options"
											role="listbox"
											class="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto border border-[#f3c15f]/40 bg-[#041d26] shadow-2xl"
										>
											{#each filteredCountries as country}
												<button
													type="button"
													role="option"
													aria-selected={country.name === countryName}
													class="w-full px-4 py-3 text-left font-semibold text-[#fff3df] transition hover:bg-[#f3c15f] hover:text-[#061921] focus:bg-[#f3c15f] focus:text-[#061921]"
													on:pointerdown|preventDefault={() => selectCountry(country.name)}
													on:click={() => selectCountry(country.name)}
												>
													{country.name}
												</button>
											{/each}
										</div>
									{/if}
								</div>
								{#if countryValidationMessage}
									<p
										id="country-error"
										class="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
									>
										{countryValidationMessage}
									</p>
								{/if}
							</div>

							<div class="grid gap-2">
								<label for="city" class="font-bold text-white">City*</label>
								<div class="relative">
									<input
										id="city"
										type="text"
										placeholder={countryName ? 'Type city, e.g. Berlin' : 'Choose country first'}
										value={citySearch}
										autocomplete="off"
										role="combobox"
										aria-autocomplete="list"
										aria-controls="city-options"
										aria-expanded={showCityOptions}
										aria-invalid={Boolean(cityValidationMessage)}
										aria-describedby={cityValidationMessage ? 'city-error' : undefined}
										disabled={!countryName}
										class={`w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60 ${
											cityValidationMessage ? 'border-red-200 bg-red-50 text-red-950' : ''
										}`}
										on:focus={() => {
											if (countryName) showCityOptions = true;
										}}
										on:input={handleCityInput}
										on:blur={closeCityOptions}
									/>
									{#if showCityOptions && filteredCities.length > 0}
										<div
											id="city-options"
											role="listbox"
											class="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto border border-[#f3c15f]/40 bg-[#041d26] shadow-2xl"
										>
											{#each filteredCities as city}
												<button
													type="button"
													role="option"
													aria-selected={city.value === selectedCityName}
													class="w-full px-4 py-3 text-left font-semibold text-[#fff3df] transition hover:bg-[#f3c15f] hover:text-[#061921] focus:bg-[#f3c15f] focus:text-[#061921]"
													on:pointerdown|preventDefault={() => selectCity(city.value)}
													on:click={() => selectCity(city.value)}
												>
													{city.value}
												</button>
											{/each}
										</div>
									{/if}
								</div>
								{#if cityValidationMessage}
									<p
										id="city-error"
										class="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
									>
										{cityValidationMessage}
									</p>
								{/if}
							</div>
						</div>
					</section>
				{:else if currentStep === 3}
					<section class="space-y-5">
						<div>
							<p class="conference-kicker">Step 3</p>
							<h3 class="mt-2 text-3xl font-black text-white">Guest names</h3>
							<p class="mt-2 text-[#fff3df]/75">Add the full name for each ticket holder.</p>
						</div>

						<div class="grid gap-4">
							{#each guests as guest, index}
								<div class="grid gap-2">
									<label for={`visible-guest-${index + 1}`} class="font-bold text-white">
										Guest {index + 1}
									</label>
									<input
										id={`visible-guest-${index + 1}`}
										type="text"
										bind:value={guest}
										placeholder={`Guest ${index + 1} - Full Name`}
										class="w-full px-4 py-3"
									/>
								</div>
							{/each}
						</div>
					</section>
				{:else}
					<section class="space-y-5">
						<div>
							<p class="conference-kicker">Step 4</p>
							<h3 class="mt-2 text-3xl font-black text-white">Review & reserve</h3>
							<p class="mt-2 text-[#fff3df]/75">
								Check everything below before reserving your tickets.
							</p>
						</div>

						<div class="grid gap-4">
							<div class="conference-card border-[#f3c15f]/45 p-5">
								<p class="conference-kicker">Bank Transfer Required</p>
								<h4 class="mt-2 text-2xl font-black text-white">Complete payment first</h4>
								<p class="mt-2 text-[#fff3df]/75">
									Please transfer the total amount before submitting your reservation.
								</p>
								<div class="mt-4 grid gap-3 border-l-4 border-[#f3c15f] pl-4 text-[#fff3df]">
									<div>
										<p class="conference-kicker text-[#fff3df]/60">
											{paymentDetails.accountNameLabel}
										</p>
										<p class="mt-1 font-black">{paymentDetails.accountName}</p>
									</div>
									<div>
										<p class="conference-kicker text-[#fff3df]/60">
											{paymentDetails.bankNameLabel}
										</p>
										<p class="mt-1 font-black">{paymentDetails.bankName}</p>
									</div>
									<div>
										<p class="conference-kicker text-[#fff3df]/60">{paymentDetails.ibanLabel}</p>
										<p
											class="overflow-wrap-anywhere mt-1 font-mono text-base font-black text-[#f3c15f] sm:text-lg sm:tracking-wide"
										>
											{paymentDetails.iban}
										</p>
									</div>
									<div>
										<p class="conference-kicker text-[#fff3df]/60">
											{paymentDetails.bicSwiftLabel}
										</p>
										<p
											class="overflow-wrap-anywhere mt-1 font-mono text-base font-black text-[#f3c15f] sm:text-lg sm:tracking-wide"
										>
											{paymentDetails.bicSwift}
										</p>
									</div>
									<p class="text-sm text-[#fff3df]/70">
										Use your attendee email as the transfer reference.
									</p>
								</div>

								<div class="mt-5 grid gap-2">
									<label for="payment-proof" class="font-bold text-white">
										Proof of payment*
									</label>
									<input
										id="payment-proof"
										name="payment_proof"
										type="file"
										accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
										required
										class="w-full px-4 py-3"
										on:change={handlePaymentProofChange}
									/>
									<p class="text-sm text-[#fff3df]/65">
										Accepted files: PDF, PNG, JPG, JPEG. Maximum {maxPaymentProofSizeLabel}.
									</p>
									{#if paymentProofFileName}
										<p class="text-sm font-bold text-[#f3c15f]">
											Attached: {paymentProofFileName}
										</p>
									{/if}
									{#if paymentProofError}
										<p
											class="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
										>
											{paymentProofError}
										</p>
									{/if}
								</div>
							</div>

							<div class="conference-card p-5">
								<p class="conference-kicker">Attendee</p>
								<p class="mt-2 text-xl font-black text-white">{email}</p>
								<p class="text-[#fff3df]/75">{bookingLocation}</p>
							</div>

							<div class="conference-card p-5">
								<p class="conference-kicker">Guests</p>
								<ol class="mt-3 list-decimal space-y-2 pl-5 text-[#fff3df]/80">
									{#each guests as guest}
										<li>{guest}</li>
									{/each}
								</ol>
							</div>
						</div>

						<p
							class="border border-[#d64b55]/40 bg-[#d64b55]/15 px-6 py-4 text-center text-base font-bold text-[#fff3df] shadow-md"
						>
							By clicking Reserve Now, you agree that tickets sold are non-refundable.
						</p>
					</section>
				{/if}

				<div
					class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
				>
					<button
						type="button"
						class="conference-button-secondary px-6 py-3 text-sm"
						on:click={() => (currentStep = Math.max(1, currentStep - 1))}
						disabled={currentStep === 1}
					>
						Back
					</button>

					{#if currentStep < 4}
						<button
							type="button"
							class="conference-button px-8 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
							on:click={nextStep}
							disabled={(currentStep === 1 && !selectedTicketOption) ||
								(currentStep === 3 && !canContinueGuests)}
						>
							Continue
						</button>
					{:else}
						<button
							type="submit"
							data-testid="reserve-booking-button"
							class={`conference-button px-8 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
								isSubmitting ? 'is-loading' : ''
							}`}
							disabled={!canReserve || isSubmitting}
							aria-busy={isSubmitting}
						>
							<span class="button-spinner" aria-hidden="true"></span>
							<span>{isSubmitting ? 'Submitting...' : 'Reserve Now'}</span>
						</button>
					{/if}
				</div>
			</div>

			<aside class="conference-panel h-fit p-5 lg:sticky lg:top-6">
				<p class="conference-kicker">Your Booking</p>
				<h3 class="mt-2 whitespace-pre-line text-2xl font-black text-white">{eventDisplayTitle}</h3>
				<p class="mt-2 text-sm text-[#fff3df]/70">
					{#each eventVenueLines as venueLine}
						{venueLine}<br />
					{/each}
					{eventDateDisplay}
				</p>

				<div class="mt-6 space-y-4 border-t border-white/10 pt-5 text-sm">
					<div class="flex justify-between gap-4">
						<span class="text-[#fff3df]/65">Ticket</span>
						<span class="text-right font-bold text-white"
							>{selectedTicketOption?.label ?? 'Not selected'}</span
						>
					</div>
					<div class="flex justify-between gap-4">
						<span class="text-[#fff3df]/65">Quantity</span>
						<span class="font-bold text-white">{quantity}</span>
					</div>
					<div class="flex justify-between gap-4">
						<span class="text-[#fff3df]/65">Unit price</span>
						<span class="font-bold text-white"
							>{formatMoney(unitPrice, selectedTicketOption?.currency ?? 'EUR')}</span
						>
					</div>
					<div class="flex justify-between gap-4">
						<span class="text-[#fff3df]/65">Subtotal</span>
						<span class="font-bold text-white"
							>{formatMoney(subtotalAmount, selectedTicketOption?.currency ?? 'EUR')}</span
						>
					</div>
					{#if discountAmount > 0}
						<div class="flex justify-between gap-4 text-[#f3c15f]">
							<span
								>{selectedPricing?.earlyBirdDiscountActive
									? 'Early Bird discount'
									: 'Discount'}</span
							>
							<span class="font-bold"
								>-{formatMoney(discountAmount, selectedTicketOption?.currency ?? 'EUR')}</span
							>
						</div>
					{/if}
					<div class="border-t border-white/10 pt-4">
						<div class="flex justify-between gap-4 text-lg">
							<span class="font-black text-white">Total</span>
							<span class="font-black text-[#f3c15f]"
								>{formatMoney(totalAmount, selectedTicketOption?.currency ?? 'EUR')}</span
							>
						</div>
					</div>
				</div>
			</aside>
		</form>

		{#if showNonRefundableModal}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-[#020c10]/80 px-4 py-8"
				role="presentation"
			>
				<div
					class="conference-panel w-full max-w-lg border-[#f3c15f]/60 p-6 shadow-2xl sm:p-8"
					role="dialog"
					aria-modal="true"
					aria-labelledby="non-refundable-title"
					aria-describedby="non-refundable-description"
				>
					<p class="conference-kicker">Final Confirmation</p>
					<h3 id="non-refundable-title" class="mt-3 text-3xl font-black text-white">
						Non-refundable tickets
					</h3>
					<p id="non-refundable-description" class="mt-4 text-lg text-[#fff3df]/80">
						Tickets sold are non-refundable. Do you want to continue and submit your booking?
					</p>

					<div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
						<button
							type="button"
							data-testid="cancel-non-refundable-submit"
							class="conference-button-secondary px-6 py-3 text-sm"
							on:click={cancelNonRefundableConfirmation}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button
							type="button"
							data-testid="confirm-non-refundable-submit"
							class={`conference-button px-6 py-3 text-sm ${isSubmitting ? 'is-loading' : ''}`}
							aria-busy={isSubmitting}
							disabled={isSubmitting}
							on:click={confirmNonRefundableAndSubmit}
						>
							<span class="button-spinner" aria-hidden="true"></span>
							<span>{isSubmitting ? 'Submitting...' : 'Yes, Submit Booking'}</span>
						</button>
					</div>
				</div>
			</div>
		{/if}

		<div class="mt-6 text-center">
			<a href={publicNav.home} class="font-semibold text-[#f3c15f] underline underline-offset-4"
				>Back to Home</a
			>
		</div>
	</div>
</section>
