<script lang="ts">
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
	};

	const now = new Date();
	const earlyBirdActive = isStandardEarlyBirdActive(now);

	const ticketOptions: TicketOption[] = [
		{
			value: TicketType.STANDARD,
			label: formatTicketTypeLabel(TicketType.STANDARD),
			available: data.standardTicketCounter.available,
			description: earlyBirdActive
				? `Early Bird Promo: ${TicketPrice.STANDARD_EARLY_BIRD} EUR until August 31`
				: `${TicketPrice.STANDARD} EUR`
		},
		{
			value: TicketType.GRAND_FEAST_PLUS,
			label: formatTicketTypeLabel(TicketType.GRAND_FEAST_PLUS),
			available: data.grandFeastPlusTicketCounter.available,
			description: `${TicketPrice.GRAND_FEAST_PLUS} EUR, includes pilgrimage to Our Lady of Knock on Oct 4 plus sightseeing`
		}
	];

	const quantityOptions = Array.from({ length: 11 }, (_, number) => number);

	let ticketType: TicketType | '' = '';
	let quantity = 0;
	let previousQuantity = 0;
	let email = '';
	let guests: string[] = [];

	$: selectedTicketOption = ticketOptions.find((option) => option.value === ticketType);
	$: availableTickets = selectedTicketOption?.available ?? 0;
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
	$: emailValidationMessage = email && !isValidEmail ? 'Please enter a valid email address.' : '';
	$: quantityMessage =
		quantity < 1 ? 'Please select the number of tickets you would like to reserve.' : '';
	$: ticketAvailabilityMessage =
		selectedTicketOption && quantity > availableTickets
			? `Only ${availableTickets} ${selectedTicketOption.label.toLowerCase()} tickets available.`
			: '';
	$: canReserve =
		Boolean(selectedTicketOption) && quantity > 0 && quantity <= availableTickets && isValidEmail;

	$: if (quantity !== previousQuantity) {
		guests = Array.from({ length: quantity }, (_, index) => guests[index] ?? '');
		previousQuantity = quantity;
	}
</script>

<section class="px-4 py-12">
	<div class="mx-auto max-w-3xl">
		<hgroup class="mb-8 space-y-3 text-center">
			<p class="conference-kicker">Ticket Reservation</p>
			<h1 class="conference-section-title text-4xl sm:text-5xl">Book Your Tickets Now</h1>

			<h2 class="text-2xl font-black tracking-normal text-[#f3c15f] sm:text-3xl">
				Grand Feast EU and UK 2026 - Dublin
			</h2>

			<p class="text-md font-medium text-[#fff3df]/75 sm:text-lg">
				St. Helen's Hotel - October 3, 2026 <br class="hidden sm:inline" />
				(Registration starts at 12:00 PM)
			</p>
		</hgroup>

		<form method="POST" class="public-form-card conference-panel mx-auto mt-8 p-6 sm:p-8">
			<div class="grid gap-4">
				<div class="grid gap-2">
					<label for="name" class="font-bold text-white">Name*</label>
					<input
						id="name"
						name="name"
						type="text"
						placeholder="First and Surname"
						required
						class="w-full px-4 py-3"
					/>
				</div>

				<div class="grid gap-2">
					<label for="email" class="font-bold text-white">Email address*</label>
					<input
						id="email"
						name="email"
						type="email"
						placeholder="name@gmail.com"
						bind:value={email}
						required
						class="w-full px-4 py-3"
					/>
					{#if emailValidationMessage}
						<p
							class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
						>
							{emailValidationMessage}
						</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<label for="city" class="font-bold text-white">Feast City (if applicable)</label>
					<input
						id="city"
						name="city"
						type="text"
						placeholder="City name"
						required
						class="w-full px-4 py-3"
					/>
				</div>

				<div class="grid gap-2">
					<label for="ticket_type" class="font-bold text-white">Ticket Type*</label>
					<select
						id="ticket_type"
						name="ticket_type"
						bind:value={ticketType}
						required
						class="w-full px-4 py-3"
					>
						<option value="">Select Ticket Type</option>
						{#each ticketOptions as option}
							<option value={option.value}>{option.label} - {option.description}</option>
						{/each}
					</select>
				</div>

				<div class="grid gap-2">
					<label for="quantity" class="font-bold text-white">Quantity*</label>
					{#if ticketAvailabilityMessage}
						<p
							class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
						>
							{ticketAvailabilityMessage}
						</p>
					{/if}
					{#if quantity < 1}
						<p
							class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
						>
							{quantityMessage}
						</p>
					{/if}
					<select
						id="quantity"
						name="quantity"
						bind:value={quantity}
						required
						class="w-full px-4 py-3"
					>
						{#each quantityOptions as number}
							<option value={number}>{number}</option>
						{/each}
					</select>
				</div>

				{#if quantity > 0}
					<fieldset class="grid gap-3">
						<legend class="font-bold text-white">Guests</legend>
						{#each guests as guest, index}
							<div class="grid gap-2">
								<label for={`guest_${index + 1}`} class="font-bold text-white"
									>Guest {index + 1}</label
								>
								<input
									id={`guest_${index + 1}`}
									name={`guest_${index + 1}`}
									type="text"
									bind:value={guest}
									placeholder={`Guest ${index + 1} - Full Name`}
									required
									class="w-full px-4 py-3"
								/>
							</div>
						{/each}
					</fieldset>
				{/if}

				<div class="conference-card p-4 text-white">
					<p>Payment Method: Bank Transfer</p>
					{#if selectedTicketOption}
						<p class="mt-2">Unit Price: {unitPrice} EUR</p>
						{#if selectedTicketOption.value === TicketType.STANDARD && earlyBirdActive}
							<p class="text-sm font-semibold text-[#f3c15f]">
								Early Bird Promo applied until August 31: standard tickets are 30 EUR.
							</p>
						{/if}
						<p>Subtotal: {subtotalAmount} EUR</p>
						{#if familyDiscountAmount > 0}
							<p class="text-sm font-semibold text-[#f3c15f]">
								Family Discount: -{familyDiscountAmount} EUR (10% off 5 or more tickets)
							</p>
						{/if}
					{/if}
					<p class="mt-2 font-semibold">Total Amount Payable: {totalAmount} EUR</p>
				</div>

				<button
					type="submit"
					class="conference-button px-10 py-4 text-base disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
					disabled={!canReserve}
				>
					Reserve Now
				</button>

				<p
					class="border border-[#d64b55]/40 bg-[#d64b55]/15 px-6 py-4 text-center text-base font-bold text-[#fff3df] shadow-md"
				>
					By clicking Reserve Now, you agree that tickets sold are non-refundable.
				</p>
			</div>
		</form>

		<div class="mt-6 text-center">
			<a href="/" class="font-semibold text-[#f3c15f] underline underline-offset-4">Back to Home</a>
		</div>
	</div>
</section>
