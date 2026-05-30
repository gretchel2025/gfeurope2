<script lang="ts">
	import { onMount } from 'svelte';
	import {
		computeFamilyDiscountAmount,
		computeSubtotalAmount,
		computeTotalAmountDue,
		getTicketUnitPrice,
		isStandardEarlyBirdActive
	} from '$lib/domain/booking';
	import { formatTicketTypeLabel, TicketPrice, TicketType } from '$lib/domain/shared/enums';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	type TicketOption = {
		value: TicketType;
		label: string;
		available: number;
		description: string;
		notes: string[];
	};

	type CountryOption = {
		isoCode: string;
		name: string;
	};

	type CityOption = {
		label: string;
		value: string;
	};

	const MAX_TYPEAHEAD_OPTIONS = 80;
	const steps = ['Ticket', 'Details', 'Guests', 'Review'];
	const now = new Date();
	const earlyBirdActive = isStandardEarlyBirdActive(now);

	const ticketOptions: TicketOption[] = [
		{
			value: TicketType.STANDARD,
			label: formatTicketTypeLabel(TicketType.STANDARD),
			available: data.standardTicketCounter.available,
			description: earlyBirdActive
				? `${TicketPrice.STANDARD_EARLY_BIRD} EUR Early Bird`
				: `${TicketPrice.STANDARD} EUR`,
			notes: earlyBirdActive
				? ['General admission', 'Standard seating', 'No extra 10% discount during Early Bird']
				: ['General admission', 'Standard seating', '10% group discount for 5+ tickets']
		},
		{
			value: TicketType.GRAND_FEAST_PLUS,
			label: formatTicketTypeLabel(TicketType.GRAND_FEAST_PLUS),
			available: data.grandFeastPlusTicketCounter.available,
			description: `${TicketPrice.GRAND_FEAST_PLUS} EUR`,
			notes: [
				'Grand Feast admission',
				'Our Lady of Knock pilgrimage',
				'Oct 4 sightseeing',
				'10% group discount for 5+ tickets'
			]
		}
	];

	let currentStep = 1;
	let ticketType: TicketType | '' = '';
	let quantity = 0;
	let previousQuantity = 0;
	let ticketStepSubmitted = false;
	let detailsStepSubmitted = false;
	let email = '';
	let countrySearch = '';
	let countryIso = '';
	let countryName = '';
	let previousCountryIso = '';
	let countries: CountryOption[] = [];
	let cities: CityOption[] = [];
	let citySearch = '';
	let citiesLoading = false;
	let paymentProofFileName = '';
	let paymentProofError = '';
	let paymentProofSelected = false;
	let guests: string[] = [];
	let bookingForm: HTMLFormElement;
	let showNonRefundableModal = false;
	let confirmedNonRefundable = false;

	onMount(async () => {
		const { Country } = await import('country-state-city');
		countries = Country.getAllCountries()
			.map((country) => ({ isoCode: country.isoCode, name: country.name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	$: selectedTicketOption = ticketOptions.find((option) => option.value === ticketType);
	$: availableTickets = selectedTicketOption?.available ?? 0;
	$: maxQuantity = availableTickets > 0 ? Math.min(10, availableTickets) : 0;
	$: unitPrice = selectedTicketOption ? getTicketUnitPrice(selectedTicketOption.value, now) : 0;
	$: subtotalAmount = selectedTicketOption
		? computeSubtotalAmount(selectedTicketOption.value, quantity, now)
		: 0;
	$: familyDiscountAmount = selectedTicketOption
		? computeFamilyDiscountAmount(selectedTicketOption.value, quantity, now)
		: 0;
	$: totalAmount = selectedTicketOption
		? computeTotalAmountDue(selectedTicketOption.value, quantity, now)
		: 0;
	$: isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	$: selectedCountry = findCountryByName(countrySearch);
	$: countryIso = selectedCountry?.isoCode ?? '';
	$: countryName = selectedCountry?.name ?? '';
	$: selectedCityName = citySearch.trim();
	$: primaryGuestName = guests[0]?.trim() ?? '';
	$: bookingLocation =
		selectedCityName && countryName ? `${selectedCityName}, ${countryName}` : selectedCityName;
	$: filteredCountries = filterCountryOptions(countrySearch);
	$: filteredCities = filterCityOptions(citySearch);
	$: emailValidationMessage = getEmailValidationMessage(email, detailsStepSubmitted);
	$: canContinueTicket =
		Boolean(selectedTicketOption) && quantity > 0 && quantity <= availableTickets;
	$: canContinueDetails = isValidEmail && countryName.length > 0 && selectedCityName.length > 0;
	$: canContinueGuests =
		guests.length === quantity && guests.every((guest) => guest.trim().length > 0);
	$: canReserve =
		canContinueTicket && canContinueDetails && canContinueGuests && paymentProofSelected;

	$: if (quantity !== previousQuantity) {
		guests = Array.from({ length: quantity }, (_, index) => guests[index] ?? '');
		previousQuantity = quantity;
	}

	$: if (countryIso !== previousCountryIso) {
		previousCountryIso = countryIso;
		citySearch = '';
		void loadCities(countryIso);
	}

	$: if (quantity > maxQuantity && maxQuantity > 0) {
		quantity = maxQuantity;
	}

	async function loadCities(isoCode: string) {
		cities = [];
		if (!isoCode) {
			return;
		}

		citiesLoading = true;
		const { City } = await import('country-state-city');
		const seen = new Set<string>();
		const cityNames = (City.getCitiesOfCountry(isoCode) ?? [])
			.map((city) => city.name.trim())
			.filter((name) => {
				const key = name.toLowerCase();
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			})
			.sort((a, b) => a.length - b.length || a.localeCompare(b));

		const simplifiedNames = cityNames.reduce<string[]>((names, cityName) => {
			const isDistrictVariant = names.some((parentName) =>
				isCityDistrictVariant(cityName, parentName)
			);
			return isDistrictVariant ? names : [...names, cityName];
		}, []);

		cities = simplifiedNames
			.sort((a, b) => a.localeCompare(b))
			.map((cityName) => ({ label: cityName, value: cityName }));
		citiesLoading = false;
	}

	function isCityDistrictVariant(cityName: string, parentName: string) {
		const city = cityName.toLowerCase();
		const parent = parentName.toLowerCase();
		return city !== parent && (city.startsWith(`${parent} `) || city.startsWith(`${parent}-`));
	}

	function findCountryByName(value: string) {
		const normalizedValue = normalizeTypeaheadValue(value);
		return countries.find((country) => normalizeTypeaheadValue(country.name) === normalizedValue);
	}

	function filterCountryOptions(search: string) {
		const normalizedSearch = normalizeTypeaheadValue(search);
		const options = normalizedSearch
			? countries.filter((country) =>
					normalizeTypeaheadValue(country.name).includes(normalizedSearch)
				)
			: countries;

		return [...options]
			.sort(
				(a, b) =>
					rankTypeaheadOption(a.name, normalizedSearch) -
					rankTypeaheadOption(b.name, normalizedSearch)
			)
			.slice(0, MAX_TYPEAHEAD_OPTIONS);
	}

	function filterCityOptions(search: string) {
		const normalizedSearch = normalizeTypeaheadValue(search);
		const options = normalizedSearch
			? cities.filter((city) => normalizeTypeaheadValue(city.label).includes(normalizedSearch))
			: cities;

		return [...options]
			.sort(
				(a, b) =>
					rankTypeaheadOption(a.label, normalizedSearch) -
					rankTypeaheadOption(b.label, normalizedSearch)
			)
			.slice(0, MAX_TYPEAHEAD_OPTIONS);
	}

	function rankTypeaheadOption(label: string, search: string) {
		const normalizedLabel = normalizeTypeaheadValue(label);
		if (!search) return 0;
		if (normalizedLabel === search) return 0;
		if (normalizedLabel.startsWith(search)) return 1;
		return 2;
	}

	function normalizeTypeaheadValue(value: string) {
		return value.trim().toLowerCase();
	}

	function getEmailValidationMessage(value: string, submitted: boolean) {
		if (!submitted && !value) return '';
		if (!value.trim()) return 'Email address is required.';
		if (!isValidEmail) return 'Please enter a valid email address.';
		return '';
	}

	function selectTicket(value: TicketType) {
		const option = ticketOptions.find((candidate) => candidate.value === value);
		if (!option || option.available < 1) return;
		ticketType = value;
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

		if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
			paymentProofError = 'Upload a PDF, PNG, JPG, or JPEG proof of payment.';
			input.value = '';
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			paymentProofError = 'Proof of payment must be 10 MB or smaller.';
			input.value = '';
			return;
		}

		paymentProofFileName = file.name;
		paymentProofSelected = true;
	}

	function handleSubmit(event: SubmitEvent) {
		if (currentStep !== 4 || !canReserve) {
			event.preventDefault();
			if (!paymentProofSelected) {
				paymentProofError = 'Please upload your proof of payment before submitting.';
			}
			return;
		}

		if (!confirmedNonRefundable) {
			event.preventDefault();
			showNonRefundableModal = true;
		}
	}

	function cancelNonRefundableConfirmation() {
		showNonRefundableModal = false;
		confirmedNonRefundable = false;
	}

	function confirmNonRefundableAndSubmit() {
		showNonRefundableModal = false;
		confirmedNonRefundable = true;
		bookingForm.requestSubmit();
	}

	function handleModalKeydown(event: KeyboardEvent) {
		if (showNonRefundableModal && event.key === 'Escape') {
			cancelNonRefundableConfirmation();
		}
	}
</script>

<svelte:window on:keydown={handleModalKeydown} />

<section class="px-4 py-12">
	<div class="mx-auto max-w-6xl">
		<hgroup class="mb-8 space-y-3 text-center">
			<p class="conference-kicker">Ticket Reservation</p>
			<h1 class="conference-section-title text-4xl sm:text-5xl">Reserve Your Seat</h1>

			<h2 class="text-xl font-black tracking-normal text-[#f3c15f] sm:text-2xl">
				Grand Feast EU and UK 2026 • Dublin • October 3, 2026
			</h2>
		</hgroup>

		<div class="mb-8 grid gap-3 sm:grid-cols-4">
			{#each steps as step, index}
				<button
					type="button"
					class={`border px-4 py-3 text-left font-black transition ${
						currentStep === index + 1
							? 'border-[#f3c15f] bg-[#d99a32]/20 text-white'
							: index + 1 < currentStep
								? 'border-[#f3c15f]/35 bg-[#005b72]/28 text-[#fff3df]'
								: 'border-white/10 bg-[#021821]/70 text-[#fff3df]/55'
					}`}
					on:click={() => goToStep(index + 1)}
				>
					<span class="text-sm text-[#f3c15f]">{index + 1}</span>
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

			<div class="conference-panel public-form-card p-5 sm:p-7">
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
								<button
									type="button"
									class={`conference-card p-5 text-left transition ${
										ticketType === option.value
											? 'border-[#f3c15f] ring-2 ring-[#f3c15f]/35'
											: option.available < 1
												? 'cursor-not-allowed opacity-55'
												: 'hover:border-[#f3c15f]/55'
									}`}
									aria-pressed={ticketType === option.value}
									disabled={option.available < 1}
									on:click={() => selectTicket(option.value)}
								>
									<div class="flex items-start justify-between gap-4">
										<div>
											<p class="text-2xl font-black text-white">{option.label}</p>
											{#if option.value === TicketType.STANDARD && earlyBirdActive}
												<div class="mt-2 space-y-1">
													<p class="text-lg font-black text-[#fff3df]/55 line-through">
														{TicketPrice.STANDARD} EUR
													</p>
													<p class="text-3xl font-black text-[#f3c15f]">
														{TicketPrice.STANDARD_EARLY_BIRD} EUR Early Bird
													</p>
													<p class="text-sm font-bold text-[#fff3df]/70">Until August 31, 2026</p>
												</div>
											{:else}
												<p class="mt-2 text-3xl font-black text-[#f3c15f]">
													{option.description}
												</p>
											{/if}
										</div>
										<span
											class={`flex h-8 w-8 items-center justify-center border text-sm font-black ${
												ticketType === option.value
													? 'border-[#f3c15f] bg-[#d99a32] text-[#061922]'
													: 'border-white/25 text-white/50'
											}`}
											aria-hidden="true"
										>
											{ticketType === option.value ? '✓' : ''}
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
								</button>
							{/each}
						</div>

						<div class="conference-card p-5">
							<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h4 class="text-xl font-black text-white">How many tickets?</h4>
									<p class="mt-1 text-sm text-[#fff3df]/70">
										5+ tickets get group discount where eligible.
									</p>
								</div>
								<div class="flex items-center gap-3">
									<button
										type="button"
										class="conference-button-secondary h-12 w-12 text-2xl"
										on:click={decreaseQuantity}
									>
										−
									</button>
									<div class="min-w-16 text-center text-4xl font-black text-white">{quantity}</div>
									<button
										type="button"
										class="conference-button-secondary h-12 w-12 text-2xl"
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
								<input
									id="country"
									type="text"
									list="country-options"
									placeholder="Type country, e.g. Germany"
									bind:value={countrySearch}
									autocomplete="off"
									class="w-full px-4 py-3"
								/>
								<datalist id="country-options">
									{#each filteredCountries as country}
										<option value={country.name}></option>
									{/each}
								</datalist>
								{#if countrySearch && !countryIso}
									<p class="text-sm font-semibold text-[#f3c15f]">
										Choose an exact country from the suggestions.
									</p>
								{/if}
							</div>

							<div class="grid gap-2">
								<label for="city" class="font-bold text-white">City*</label>
								<input
									id="city"
									type="text"
									list="city-options"
									placeholder={countryIso
										? citiesLoading
											? 'Loading cities...'
											: 'Type city, e.g. Berlin'
										: 'Choose country first'}
									bind:value={citySearch}
									autocomplete="off"
									class="w-full px-4 py-3"
									disabled={!countryIso || citiesLoading}
								/>
								<datalist id="city-options">
									{#each filteredCities as city}
										<option value={city.value}></option>
									{/each}
								</datalist>
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
								<div class="mt-4 space-y-2 border-l-4 border-[#f3c15f] pl-4 text-[#fff3df]">
									<p class="font-black">LIGHT OF JESUS FAMILY IRELAND</p>
									<p class="font-mono text-lg font-black tracking-wide text-[#f3c15f]">
										IE12 BOFI 9000 1780 5681 80
									</p>
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
										Accepted files: PDF, PNG, JPG, JPEG. Maximum 10 MB.
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
							class="conference-button px-8 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!canReserve}
						>
							Reserve Now
						</button>
					{/if}
				</div>
			</div>

			<aside class="conference-panel h-fit p-5 lg:sticky lg:top-6">
				<p class="conference-kicker">Your Booking</p>
				<h3 class="mt-2 text-2xl font-black text-white">Grand Feast EU and UK 2026</h3>
				<p class="mt-2 text-sm text-[#fff3df]/70">
					St. Helen's Hotel<br />
					October 3, 2026
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
						<span class="font-bold text-white">{unitPrice} EUR</span>
					</div>
					<div class="flex justify-between gap-4">
						<span class="text-[#fff3df]/65">Subtotal</span>
						<span class="font-bold text-white">{subtotalAmount} EUR</span>
					</div>
					{#if familyDiscountAmount > 0}
						<div class="flex justify-between gap-4 text-[#f3c15f]">
							<span>Group discount</span>
							<span class="font-bold">-{familyDiscountAmount} EUR</span>
						</div>
					{/if}
					<div class="border-t border-white/10 pt-4">
						<div class="flex justify-between gap-4 text-lg">
							<span class="font-black text-white">Total</span>
							<span class="font-black text-[#f3c15f]">{totalAmount} EUR</span>
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
							class="conference-button-secondary px-6 py-3 text-sm"
							on:click={cancelNonRefundableConfirmation}
						>
							Cancel
						</button>
						<button
							type="button"
							class="conference-button px-6 py-3 text-sm"
							on:click={confirmNonRefundableAndSubmit}
						>
							Yes, Submit Booking
						</button>
					</div>
				</div>
			</div>
		{/if}

		<div class="mt-6 text-center">
			<a href="/" class="font-semibold text-[#f3c15f] underline underline-offset-4">Back to Home</a>
		</div>
	</div>
</section>
