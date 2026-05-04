<script lang="ts">
	import { TicketPrice, TicketType } from '$lib/domain/shared/enums';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	type TicketOption = {
		value: TicketType;
		label: string;
		price: TicketPrice;
		available: number;
	};

	const ticketOptions: TicketOption[] = [
		{
			value: TicketType.STANDARD,
			label: 'Standard',
			price: TicketPrice.STANDARD,
			available: data.standardTicketCounter.available
		},
		{
			value: TicketType.VIP,
			label: 'Premium',
			price: TicketPrice.VIP,
			available: data.vipTicketCounter.available
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
	$: totalAmount = selectedTicketOption ? selectedTicketOption.price * quantity : 0;
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

<main class="container mx-auto px-4 py-8">
	<hgroup class="mb-8 space-y-2 text-center">
		<h1 class="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl">
			Book Your Tickets Now
		</h1>

		<h2 class="text-2xl font-semibold tracking-wide text-yellow-200 sm:text-3xl">
			Grand Feast 2025 - Oslo
		</h2>

		<p class="text-md font-light text-blue-100 sm:text-lg">
			Lambertseter Kirke - Sept 20, 2025 <br class="hidden sm:inline" />
			(Registration starts at 1:00 PM)
		</p>

		<div
			class="mx-auto mt-3 h-1 w-20 rounded-full bg-gradient-to-r from-yellow-300 via-teal-300 to-blue-400"
		></div>
	</hgroup>

	<form
		method="POST"
		class="mx-auto mt-8 max-w-3xl rounded-xl bg-white/10 p-6 shadow-md backdrop-blur-md"
	>
		<div class="grid gap-4">
			<div class="grid gap-2">
				<label for="name" class="font-medium text-white">Name*</label>
				<input
					id="name"
					name="name"
					type="text"
					placeholder="First and Surname"
					required
					class="w-full rounded-md bg-white px-4 py-2 text-gray-900"
				/>
			</div>

			<div class="grid gap-2">
				<label for="email" class="font-medium text-white">Email address*</label>
				<input
					id="email"
					name="email"
					type="email"
					placeholder="name@gmail.com"
					bind:value={email}
					required
					class="w-full rounded-md bg-white px-4 py-2 text-gray-900"
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
				<label for="city" class="font-medium text-white">Feast City (if applicable)</label>
				<input
					id="city"
					name="city"
					type="text"
					placeholder="City name"
					required
					class="w-full rounded-md bg-white px-4 py-2 text-gray-900"
				/>
			</div>

			<div class="grid gap-2">
				<label for="ticket_type" class="font-medium text-white">Ticket Type*</label>
				<select
					id="ticket_type"
					name="ticket_type"
					bind:value={ticketType}
					required
					class="w-full rounded-md bg-white px-4 py-2 text-gray-900"
				>
					<option value="">Select Ticket Type</option>
					{#each ticketOptions as option}
						<option value={option.value}>{option.label} - {option.price} EUR</option>
					{/each}
				</select>
			</div>

			<div class="grid gap-2">
				<label for="quantity" class="font-medium text-white">Quantity*</label>
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
					class="w-full rounded-md bg-white px-4 py-2 text-gray-900"
				>
					{#each quantityOptions as number}
						<option value={number}>{number}</option>
					{/each}
				</select>
			</div>

			{#if quantity > 0}
				<fieldset class="grid gap-3">
					<legend class="font-medium text-white">Guests</legend>
					{#each guests as guest, index}
						<div class="grid gap-2">
							<label for={`guest_${index + 1}`} class="font-medium text-white"
								>Guest {index + 1}</label
							>
							<input
								id={`guest_${index + 1}`}
								name={`guest_${index + 1}`}
								type="text"
								bind:value={guest}
								placeholder={`Guest ${index + 1} - Full Name`}
								required
								class="w-full rounded-md bg-white px-4 py-2 text-gray-900"
							/>
						</div>
					{/each}
				</fieldset>
			{/if}

			<div class="rounded-lg bg-white/10 p-4 text-white">
				<p>Payment Method: Bank Transfer</p>
				<p class="mt-2 font-semibold">Total Amount Payable: {totalAmount} EUR</p>
			</div>

			<button
				type="submit"
				class="rounded-full bg-gradient-to-r from-blue-600 to-teal-400 px-10 py-4 text-base font-bold uppercase tracking-wider text-white shadow-lg transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
				disabled={!canReserve}
			>
				Reserve Now
			</button>

			<p class="rounded-md bg-white px-6 py-4 text-center text-lg font-bold text-red-600 shadow-md">
				By clicking Reserve Now, you agree that tickets sold are non-refundable.
			</p>
		</div>
	</form>

	<div class="mt-4 text-center">
		<a href="/" class="text-blue-400 underline">Back to Home</a>
	</div>
</main>
