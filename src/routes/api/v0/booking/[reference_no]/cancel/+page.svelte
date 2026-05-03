<script lang="ts">
    import { Alert } from '@sveltestrap/sveltestrap';
    import type { Booking } from "$lib/domain/booking";
    import { canCancelBooking } from "$lib/domain/booking";

    // data is the object received from the server
    export let data: {
        aRecord: Booking
    }

    const booking = data.aRecord

    let userHasConfirmed = false
    let userHasUnderstood = false

    // flags for disabling buttons
    const bookingCanBeCancelled = canCancelBooking(booking)
    $: canDoCancel = bookingCanBeCancelled && userHasConfirmed && userHasUnderstood
</script>

<main class="container">

    <article>
        <hgroup>
            <h1>Cancel Booking Reservation</h1>
            <h2>Permanently cancels the booking reservation.<br>Returns related Reserved tickets back to Available.</h2>
        </hgroup>

        reference_no: {booking.reference_no} <br>
        name: {booking.name} -- ({booking.email}) <br>
        payment_status: {booking.payment_status} <br>
        amount_total: {booking.amount_total} <br>
        guests: {booking.guests} <br>
        ticket_ids: <br>
        <ul>
            {#each booking.ticket_ids as ticket_id}
                <li>
                    <a href="/api/v0/ticket/{ticket_id}/details">{ticket_id}</a>
                </li>
            {/each}
        </ul>


        <Alert color="danger">
            Warning, cancellation cannot be undone!
        </Alert>

        <input type="checkbox" bind:checked={userHasConfirmed}/> I confirm that I wish to cancel this booking<br>
        <input type="checkbox" bind:checked={userHasUnderstood}/> I understand that cancelled bookings cannot be restored<br>
        <br>


        <form action="?/cancelBooking" method="POST">
            <button type="submit" disabled={!canDoCancel}>yes, proceed to cancel</button>
        </form>

        <form action="/api/v0/booking/{booking.reference_no}/details" method="GET">
            <button type="submit">No, Back to Safety</button>
        </form>

        <a href="/api/v0/booking/{booking.reference_no}/details">back to details</a> |
        <a href="/api/v0/booking/list">list bookings</a> |
        <a href="/api/v0/booking/search">search</a>

    </article>

    <a href="/api">admin home</a>
</main>
