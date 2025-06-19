<script lang="ts">
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import { Alert } from '@sveltestrap/sveltestrap';
    import type { ServerData } from './+page.server';

    export let data: ServerData;
    const colors = [
        'primary',
        'secondary',
        'success',
        'danger',
        'warning',
        'info',
        'light',
        'dark',
    ];

    const standardTicketCounter = data.standardTicketCounter;
    const vipTicketCounter = data.vipTicketCounter;
    const youthTicketCounter = data.youthTicketCounter;

    let canReserve = true;
    let hasAgreed = false;

    let ticketAvailabilityMessage = '';
    let quantityMessage = '';
    let emailValidationMessage = ''; // Variable to hold the email validation message

    // Define a Ticket type for demonstration purposes
    interface Ticket {
        ticket_id: number;
        name: string;
        ticket_type: string;
        description: string;
    }

    // Reactive variables for form handling
    let ticketType: string = ''; // No default value selected initially
    let quantity: number = 0; // Default to 0
    let totalAmount: number = calculateTotal(ticketType, quantity);
    let email: string = ''; // Variable to store email input
    let guests: string[] = []; // Array to store guest names

    function calculateTotal(ticketType: string, quantity: number): number {
        let ticketPrice = 0; // Default price

        // Determine the ticket price based on the ticket type
        switch (ticketType) {
            case 'standard':
                ticketPrice = 35;
                break;
            case 'vip':
                ticketPrice = 55;
                break;
            case 'youth':
                ticketPrice = 15;
                break;
            default:
                ticketPrice = 0; // Default to 0 if no valid type is selected
        }

        // Return the total amount
        return ticketPrice * quantity;
    }

    // Function to update total amount when ticketType or quantity changes
    function updateTotal(): void {
        // Calculate the remaining tickets if reservation was successful
        let availableTickets = 0;
        switch (ticketType) {
            case 'standard':
                availableTickets = standardTicketCounter.available;
                break;
            case 'vip':
                availableTickets = vipTicketCounter.available;
                break;
            case 'youth':
                availableTickets = youthTicketCounter.available;
                break;
            default:
                availableTickets = 0; // Handle unexpected cases
        }
        const remainingTicketsAfterBooking = availableTickets - quantity;

        ticketAvailabilityMessage = '';
        quantityMessage = '';
        canReserve = true;

        // Prevent booking that will make the available tickets negative
        if (remainingTicketsAfterBooking < 0) {
            canReserve = false;
            ticketAvailabilityMessage = `*** Only ${availableTickets} ${ticketType} tickets available ***`;
        } else if (quantity < 1) {
            canReserve = false;
            quantityMessage = `Please select the number of tickets you would like to reserve.`;
        } else {
            canReserve = true;
        }

        totalAmount = calculateTotal(ticketType, quantity);
        // Ensure guests array matches quantity
        if (quantity > guests.length) {
            guests = Array(quantity)
                .fill('')
                .map((_, index) => guests[index] || '');
        } else if (quantity < guests.length) {
            guests = guests.slice(0, quantity);
        }
    }

    // Function to validate email format
    function validateEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    let isValidEmail = false;
    function doValidateEmail(): void {
        isValidEmail = validateEmail(email);
        emailValidationMessage = isValidEmail ? '' : 'Please enter a valid email address.';
    }

    // Create an event dispatcher to send the total amount to parent components if needed
    const dispatch = createEventDispatcher();

    onMount(() => {
        // Initial calculation
        updateTotal();
    });

    // Watch for changes in ticketType and quantity to update total
    $: updateTotal();
</script>

<style>

  input,
  select,
  button {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }


  .guest-fields {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .guest-fields > div {
    display: flex;
    flex-direction: column;
  }


  hgroup h1,
  hgroup h2 {
    margin: 0;
    text-align: center;
  }

  hgroup h1 {
    color: white;
    font-size: 1.75rem;
  }

  hgroup h2 {
    color: #fae6c8;
    font-size: 1.25rem;
  }

</style>

<main class="container mx-auto px-4 py-8">
  <hgroup class="text-center mb-8 space-y-2">
    <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
      🎟️ Book Your Tickets Now!
    </h1>

    <h2 class="text-2xl sm:text-3xl font-semibold text-yellow-200 tracking-wide">
      Grand Feast 2025 — Oslo
    </h2>

    <p class="text-md sm:text-lg text-blue-100 font-light">
      📍 Lambertseter Kirke — Sept 20, 2025 <br class="hidden sm:inline" />
      (Registration starts at 1:00 PM)
    </p>

    <div class="h-1 w-20 bg-gradient-to-r from-yellow-300 via-teal-300 to-blue-400 rounded-full mx-auto mt-3"></div>
  </hgroup>

  <form method="POST" class="mt-8 bg-white/10 p-6 rounded-xl shadow-md backdrop-blur-md">
    <div class="flex flex-col gap-4">
            <label for="name" class="font-medium text-white">Name*:</label>
            <input id="name" name="name" type="text" placeholder="First and Surname" required class="w-full px-4 py-2 rounded-md bg-white text-gray-900" />

            <label for="email" class="font-medium text-white">Email address*:</label>
            <input id="email" name="email" type="email" placeholder="name@gmail.com" bind:value={email} on:input={doValidateEmail} required class="w-full px-4 py-2 rounded-md bg-white text-gray-900" />
            {#if emailValidationMessage}
              <Alert color="danger">{emailValidationMessage}</Alert>
            {/if}

            <label for="city" class="font-medium text-white">Feast City (if applicable):</label>
            <input id="city" name="city" type="text" placeholder="City name" required class="w-full px-4 py-2 rounded-md bg-white text-gray-900" />

            <label for="ticket_type" class="font-medium text-white">Ticket Type*:</label>
            <select id="ticket_type" name="ticket_type" bind:value={ticketType} on:change={updateTotal} required class="w-full px-4 py-2 rounded-md bg-white text-gray-900">
              <option value="">Select Ticket Type</option>
              <option value="standard">Standard - 35€</option>
              <option value="vip">Premium - 55€</option>
            </select>

            <label for="quantity" class="font-medium text-white">Quantity*:</label>
            {#if ticketAvailabilityMessage}
              <Alert color="danger">{ticketAvailabilityMessage}</Alert>
            {/if}
            {#if quantity < 1}
              <Alert color="warning">{quantityMessage}</Alert>
            {/if}
            <select id="quantity" name="quantity" bind:value={quantity} on:change={updateTotal} required class="w-full px-4 py-2 rounded-md bg-white text-gray-900">
              {#each Array(11).fill(0).map((_, i) => i) as number}
                <option value={number}>{number}</option>
              {/each}
            </select>

            {#if quantity > 0}
              <div class="guest-fields space-y-2">
                {#each guests as guest, index}
                  <div class="flex flex-col">
                    <label for={`guest_${index + 1}`} class="font-medium text-white">Guest {index + 1}:</label>
                    <input id={`guest_${index + 1}`} name={`guest_${index + 1}`} type="text" bind:value={guests[index]} placeholder={`Guest ${index + 1} - Full Name`} required class="w-full px-4 py-2 rounded-md bg-white text-gray-900" />
                  </div>
                {/each}
              </div>
            {/if}

            <p class="text-white">Payment Method: Bank Transfer</p>

            <div class="flex flex-col text-white font-semibold">
              <label for="total-amount" class="mb-1">Total Amount Payable:</label>
              <span id="total-amount">{totalAmount}€</span>
            </div>

            <button
              type="submit"
              class="bg-gradient-to-r from-blue-600 to-teal-400 px-10 py-4 rounded-full text-white text-base sm:text-lg font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-transform duration-200"
              disabled={!canReserve || !isValidEmail}
            >
              RESERVE NOW
            </button>

     

            <p class="bg-white text-red-600 px-6 py-4 rounded-md text-lg mt-4 text-center font-bold shadow-md">
              *** By clicking  - RESERVE NOW - you agree that tickets sold are Non-refundable ***
            </p>
    </div>
  </form>

  <div class="text-center mt-4">
    <a href="/" class="text-blue-400 underline">Back to Home</a>
  </div>
</main>

