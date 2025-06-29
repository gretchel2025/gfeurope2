import type { Email, Booking } from "$lib/entities/models";
import * as emailService from "$lib/server/external_services/email";
import * as bookingWorkflows from "$lib/server/workflows/bookings";
import {error} from "@sveltejs/kit";
import type { QRCode, Ticket } from "$lib/entities/models";

// Send an email
export async function Send(email: Email): Promise<void> {
    // TODO maybe add validation here

    try {
        await emailService.Send(email)
    } catch (e) {
        console.error(`[ERROR] failed sending email to ${email.to}. Resp body:`, e)
        throw e
    }

    return
}

export async function SendTicketsEmail(booking_reference_no: string): Promise<void> {
    // get booking
    const aBooking: Booking | null = await bookingWorkflows.GetByID(booking_reference_no)

    if (!aBooking){
        throw error(404, "booking not found")
    }

    // get tickets
    const tickets: Ticket[] = await bookingWorkflows.GetRelatedTickets(booking_reference_no)

    // send email
    const booking: Booking = aBooking

    //   TICKET EMAIL TEMPLATE
    const email: Email = {
        from: "",
        to: booking.email,
        subject: "Your Tickets " + booking.reference_no,
        message: `
        <html>
            <style>
                        body {
                            font-family: "Tahoma", sans-serif;
                            line-height: 1.6;
                        }
                        h1, h2 {
                            color: #333;
                            font-family: "Tahoma", sans-serif;
                        }
                        p {
                            margin: 0.5em 0;
                            font-family: "Tahoma", sans-serif;
                        }
                        ul {
                            list-style-type: none;
                            padding: 0;
                            margin-left: 20px; /* Indent the list */
                        }
                        ul li {
                            margin: 0.5em 0;
                            font-family: "Tahoma", sans-serif;
                        }
                        .highlight {
                            font-weight: bold;
                            color: #000;
                            font-family: "Tahoma", sans-serif;
                        }
                        .container {
                            background-color: #f7f5ed;
                            padding: 20px;
                            max-width: 650px;
                            margin: 0 auto;
                        }
                        .image img {
                            display: block;
                            width: 100%;
                            user-select: none;
                            pointer-events: none;
                            -webkit-user-drag: none;
                        }
                    </style>
                </head>
                <body style="padding: 0; margin: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="left">
                                <div class="container" style="background-color: #f7f5ed; font-family: "Tahoma", sans-serif;">
                                    <h2>Dear ${booking.name},</h2>
                                    <p>
                                        Here are your eTickets for the 2025 EU and UK Grand Feast in Oslo. 
                                        Please remember to bring your e-ticket with the QR code, as you'll need it for entry at the venue. 
                                        Having your e-ticket ready for scanning will make check-in quick and easy.
                                    </p>
                                    <br>
                                
                                    <hr>
                                    <!-- TICKETS + QR CODE SECTION -->
                                    ${
                                        tickets.map((ticket, i) => `
                                            <div>
                                                <h2>${i+1}: eTicket ${ticket.ticket_id}</h2>
                                                Name: ${ticket.name}<br>
                                                Ticket Class: ${ticket.ticket_type}<br>
                                                Checkin QR Code <br>
                                                <div>
                                                    <img src="${ticket.checkin_qr_code_image_url}" alt="QR Code"/>
                                                </div>
                                            </div>
                                            <hr>
                                        `).join("")
                                    }
                                    
                                    <h2>Booking Summary</h2>
                                    <h3>Booking reference number: ${booking.reference_no}</h3>
                                    <br>

                                    <!-- BOOKING DETAILS SECTION -->
                                    ${booking.ticket_ids.length} ${booking.ticket_type} tickets, ${booking.amount_total} EUR, ${booking.payment_status} <br>

                                    ${booking.guests.length} guests: <br>
                                    <ol>
                                        ${ booking.guests.map(guest => `
                                            <li>
                                                ${guest}
                                            </li>`)
                                            .join("")
                                        }
                                    </ol>

                                    Event Details: <br>
                                    <ul>
                                        <li>2025 EU and UK Grand Feast in Oslo</li>
                                        <li>Date: September 20, 2024</li>
                                        <li>Time: 1:00 PM to 5:00 PM CET</li>
                                        <li>Venue: Lambertseter kirke</li>
                                        <li>Address: Langbølgen 33, 1150 Oslo, Norway</li>
                                    </ul>


                                    <!-- PARTING MESSAGE -->
                                    We hope you have a great time at the event! <br>
                                    <br>

                                    Have a blessed day! <br>
                                    Grand Feast EU and UK Team <br>
                                    <br>

                                    <hr>
                                </div>
                            </td>
                        </tr>
                    </table>
                </body>
        </html>
        `
    };

    await Send(email)
}

export async function SendPaymentReminder(booking_reference_no: string): Promise<void> {
    // retrieve booking
    const aBooking: Booking | null = await bookingWorkflows.GetByID(booking_reference_no)


    if (!aBooking){
        throw error(404, "booking not found")
    }

    const booking = aBooking
    const paypalBaseUrl = "https://paypal.me/TheFeastNorway";
    const amount = booking.amount_total;
    const reference = booking.reference_no;
    const paypalUrl = `${paypalBaseUrl}/${amount}?country.x=NO&locale.x=en_US&item_name=${reference}`;

    const EXCHANGE_RATE_EUR_TO_NOK = 11.52;
    const amountNOK = Math.round(amount * EXCHANGE_RATE_EUR_TO_NOK);


    // send the email
    const email: Email = {
        from: "",
        to: booking.email,
        subject: "Gentle Reminder: Your Ticket Reservation " + booking.reference_no + " is Waiting",
        message: `
        <html>
                <head>
                    <style>
                        body {
                        font-family: Tahoma, sans-serif;
                        background-color: #b1c1c7;
                        margin: 0;
                        padding: 0;
                        }
                        .container {
                        background-color: #f7f5ed;
                        padding: 20px;
                        max-width: 650px;
                        margin: 20px auto;
                        }
                        h1, h2, h3 {
                        color: #333;
                        }
                        p {
                        margin: 0.5em 0;
                        }
                        .highlight {
                        font-weight: bold;
                        color: #000;
                        }
                        ul {
                        list-style: none;
                        padding-left: 20px;
                        }
                        ul li {
                        margin: 0.5em 0;
                        }
                        .paypal-button {
                        background-color: #0070ba;
                        color: #ffffff !important;
                        padding: 14px 28px;
                        text-decoration: none;
                        font-weight: bold;
                        border-radius: 6px;
                        display: inline-block;
                        font-family: Tahoma, sans-serif;
                        font-size: 16px;
                        }
                    </style>
                </head>
                <body style="padding: 0; margin: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #b1c1c7;">
                        <tr>
                            <td align="left">
                                <div class="container">
                                
                                    <h1>Hello ${booking.name},</h1>
                                    <h3>A gentle reminder that your ticket reservation is awaiting payment.</h3>
                
                                    <p>
                                        Please note that your reservation may be <span class="highlight">canceled</span> if payment is not received within five business days. 
                                        If you have already completed your payment, kindly disregard this email.
                                    </p>
                                    <br>
                                    <p>
                                        In this email you will find the instructions on how to pay for your ticket reservation. 
                                        Please make your payment within <span class="highlight">24H</span>, and remember to state 
                                        your booking reference number <span class="highlight">${booking.reference_no}</span>.
                                    </p>
                                     <p>
                                        Choose one of the following ways:
                                     </p>

                                    <h2>Option 1: Pay via PayPal</h2>
                                     <div style="text-align: center; margin: 20px 0;">
                                       <a href="${paypalUrl}" 
                                        style="background-color: #0070ba; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Tahoma, sans-serif;">
                                        Pay Now via PayPal
                                        </a>
                                    </div>

                                    <br>
                                    <h2>Option 2: Or by Bank Transfer</h2>
                                    <ul>
                                        <li>Recipient: <span class="highlight">Light of Jesus Family (The Feast Norway)</span></li>
                                        <li>Bank Details: <span class="highlight">NO2215202093202</span></li>
                                        <li>BIC: <span class="highlight">DNBANOKKXXX</span></li>
                                        <li>Bank Name: <span class="highlight">DNB Bank ASA</span></li>
                                        <li>Purpose: <span class="highlight">${booking.reference_no}</span></li>
                                        <li>Payable Amount: <span class="highlight">${booking.amount_total} €</span> (EURO)</li>
                                        <li>Equivalent in NOK: <span class="highlight">${amountNOK} kr</span> (approx)</li>
                                    </ul>
                                    <br>
                                    
                                    <p>
                                        Remember to indicate the unique BOOKING REFERENCE number: <span class="highlight">${booking.reference_no}</span> 
                                        in the message or as purpose. This will help to identify and allocate your payment.
                                        We want to inform you that it may take up to <span class="highlight">48H</span> 
                                        to verify your payment.
                                        Once payment has been verified, you will receive your eTickets.
                                    </p>
                                    <br>

                                    <p>
                                        If you need help with your booking, please contact us at 
                                        <span class="highlight">help@grandfeast.eu</span>
                                    </p> 
                                    <br>
                                    <p>
                                        Thank you for your booking, and we are excited to see you at The Grand Feast in Oslo.
                                    </p>
                                    <br>
                                    <br>
                                    <p>Best regards,</p>
                                    <p><span class="highlight">Grand Feast EU and UK Team</span></p>
                                    
                                    <br>
                                    <hr>

                                        <h2>Booking Summary</h2>
                                        <h3>Booking reference number: ${booking.reference_no}</h3>

                                        <!-- BOOKING DETAILS SECTION -->
                                        ${booking.amount_total} EUR, ${booking.payment_status} <br>
                                        ${booking.guests.length} ${booking.ticket_type} guests: <br>
                                        <ol>
                                            ${ booking.guests.map(guest => `
                                                <li>
                                                    ${guest}
                                                </li>`)
                                                .join("")
                                            }
                                        </ol>

                                </div>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `
    };

    await Send(email)
}


export async function SendBookingConfirmation(booking: Booking): Promise<void> {
    const paypalBaseUrl = "https://paypal.me/TheFeastNorway";
    const amount = booking.amount_total;
    const reference = booking.reference_no;
    const paypalUrl = `${paypalBaseUrl}/${amount}?country.x=NO&locale.x=en_US&item_name=${reference}`;

    const EXCHANGE_RATE_EUR_TO_NOK = 11.52;
    const amountNOK = Math.round(amount * EXCHANGE_RATE_EUR_TO_NOK);

    const email: Email = {
        from: "",
        to: booking.email,
        subject: "Your Ticket Reservation " + booking.reference_no,
        message: `
        <html>
                <head>
                    <style>
                        body {
                            font-family: "Tahoma", sans-serif;
                            line-height: 1.6;
                            background-color: #b1c1c7;
                        }
                        h1, h2 {
                            color: #333;
                            font-family: "Tahoma", sans-serif;
                        }
                        p {
                            margin: 0.5em 0;
                            font-family: "Tahoma", sans-serif;
                        }
                        ul {
                            list-style-type: none;
                            padding: 0;
                            margin-left: 20px; /* Indent the list */
                        }
                        ul li {
                            margin: 0.5em 0;
                            font-family: "Tahoma", sans-serif;
                        }
                        .highlight {
                            font-weight: bold;
                            color: #000;
                            font-family: "Tahoma", sans-serif;
                        }
                        .container {
                            background-color: #f7f5ed;
                            padding: 20px;
                            max-width: 650px;
                            margin: 0 auto;
                        }
                        .image img {
                            display: block;
                            width: 100%;
                            user-select: none;
                            pointer-events: none;
                            -webkit-user-drag: none;
                        }
                        .paypal-button {
                        background-color: #0070ba;
                        color: #ffffff !important;
                        padding: 14px 28px;
                        text-decoration: none;
                        font-weight: bold;
                        border-radius: 6px;
                        display: inline-block;
                        font-family: Tahoma, sans-serif;
                        font-size: 16px;
                    </style>
                </head>
                <body style="padding: 0; margin: 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #b1c1c7;">
                        <tr>
                            <td align="left">
                                <div class="container">
                                
                                    <h1>Hello ${booking.name},</h1>
                                    <h2>Greetings from the Grand Feast EU and UK!</h2>

                                    <p>
                                        In this email you will find the instructions on how to pay for your ticket reservation. 
                                        Please transfer your payment to the following account within <span class="highlight">24H</span>, 
                                        stating the purpose <span class="highlight">${booking.reference_no}</span>.
                                    </p>
                                     <p>
                                        Choose one of the following ways:
                                     </p>

                                    <h2>Option 1: Pay via PayPal</h2>
                                     <div style="text-align: center; margin: 20px 0;">
                                       <a href="${paypalUrl}" 
                                        style="background-color: #0070ba; color: white; font-weight: bold; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Tahoma, sans-serif;">
                                        Pay Now via PayPal
                                        </a>
                                    </div>

                                    <br>
                                    <h2>Option 2: Or by Bank Transfer</h2>
                        
                                    <ul>
                                        <li>Recipient: <span class="highlight">Light of Jesus Family (The Feast Norway)</span></li>
                                        <li>Bank Details: <span class="highlight">NO2215202093202</span></li>
                                        <li>BIC: <span class="highlight">DNBANOKKXXX</span></li>
                                        <li>Bank Name: <span class="highlight">DNB Bank ASA</span></li>
                                        <li>Purpose: <span class="highlight">${booking.reference_no}</span></li>
                                        <li>Payable Amount: <span class="highlight">${booking.amount_total} €</span> (EURO)</li>
                                        <li>Equivalent in NOK: <span class="highlight">${amountNOK} kr</span> (approx)</li>
                                    </ul>
                                    <br>
                                    
                                    <p>
                                        Remember to indicate the unique booking reference number: <span class="highlight">${booking.reference_no}</span> 
                                        in the message or as purpose so that we can allocate your payment.
                                        We want to inform you that it may take up to <span class="highlight">48H</span> 
                                        to verify your payment.
                                        Once payment has been verified, you will receive your eTickets.
                                    </p>
                                    <br>

                                    <p>
                                        If you need help with your booking, please contact us at 
                                        <span class="highlight">help@grandfeast.eu</span>
                                    </p> 
                                    <br>
                                    <p>
                                        Thank you for your booking, and we are excited to see you at The Grand Feast in Oslo.
                                    </p>
                                    <br>
                                    <br>
                                    <p>Best regards,</p>
                                    <p><span class="highlight">Grand Feast EU and UK Team</span></p>

                                    <br>
                                    <hr>

                                        <h2>Booking Summary</h2>
                                        <h3>Booking reference number: ${booking.reference_no}</h3>

                                        <!-- BOOKING DETAILS SECTION -->
                                        ${booking.amount_total} EUR, ${booking.payment_status} <br>
                                        ${booking.guests.length} ${booking.ticket_type} guests: <br>
                                        <ol>
                                            ${ booking.guests.map(guest => `
                                                <li>
                                                    ${guest}
                                                </li>`)
                                                .join("")
                                            }
                                        </ol>

                                </div>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `
    };

    await Send(email)
}

// SendTicketsEmail_Backup is a backup of the old SendTicketsEmail function.
// It uses embedded QRCode image in the email HTML body
// export async function SendTicketsEmail_Backup(booking_reference_no: string): Promise<void> {
//     // get booking
//     const aBooking: Booking | null = await bookingWorkflows.GetByID(booking_reference_no)
//
//     if (!aBooking){
//         throw error(404, "booking not found")
//     }
//
//     // get tickets + their QR Codes
//     const ticketsDataX: {ticket: Ticket, qrCodeData: QRCode}[]  = await bookingWorkflows.GetRelatedTicketsWithCheckinQRCode(booking_reference_no)
//
//     // send email
//     // const tickets = ticketsData.map(td => td.ticket)
//
//     const booking = aBooking
//     const ticketsData = ticketsDataX
//
//
//     const email: Email = {
//         from: "",
//         to: aBooking.email,
//         subject: "Your Tickets " + aBooking.reference_no,
//         message: `
//         <html>
//             <style>
//                         body {
//                             font-family: "Tahoma", sans-serif;
//                             line-height: 1.6;
//                         }
//                         h1, h2 {
//                             color: #333;
//                             font-family: "Tahoma", sans-serif;
//                         }
//                         p {
//                             margin: 0.5em 0;
//                             font-family: "Tahoma", sans-serif;
//                         }
//                         ul {
//                             list-style-type: none;
//                             padding: 0;
//                             margin-left: 20px; /* Indent the list */
//                         }
//                         ul li {
//                             margin: 0.5em 0;
//                             font-family: "Tahoma", sans-serif;
//                         }
//                         .highlight {
//                             font-weight: bold;
//                             color: #000;
//                             font-family: "Tahoma", sans-serif;
//                         }
//                         .container {
//                             background-color: #f7f5ed;
//                             padding: 20px;
//                             max-width: 650px;
//                             margin: 0 auto;
//                         }
//                         .image img {
//                             display: block;
//                             width: 100%;
//                             user-select: none;
//                             pointer-events: none;
//                             -webkit-user-drag: none;
//                         }
//                     </style>
//                 </head>
//                 <body style="padding: 0; margin: 0;">
//                     <table width="100%" cellpadding="0" cellspacing="0" border="0">
//                         <tr>
//                             <td align="left">
//                                 <div class="container" style="background-color: #f7f5ed; font-family: "Tahoma", sans-serif;">
//                                     <h1>Booking: ${booking.reference_no}</h1>
//                                     <hr>
//                                     <!-- TICKETS + QR CODE SECTION -->
//                                     ${
//             ticketsData.map((ticketData, i) => `
//                                             <div>
//                                                 <h2>${i+1}: Ticket ${ticketData.ticket.ticket_id}</h2>
//                                                 Name: ${ticketData.ticket.name}<br>
//                                                 Ticket Class: ${ticketData.ticket.ticket_type}<br>
//                                                 Checkin QR Code <br>
//                                                 <div>
//                                                     <img src="${ticketData.qrCodeData.imageData}" alt="QR Code"/>
//                                                 </div>
//                                             </div>
//                                             <hr>
//                                         `).join("")
//         }
//
//                                     <h2>Booking Summary</h2>
//                                     ${booking.name} <br>
//                                     <br>
//
//                                     <!-- BOOKING DETAILS SECTION -->
//                                     ${booking.ticket_ids.length} ${booking.ticket_type} tickets, ${booking.amount_total} EUR, ${booking.payment_status} <br>
//
//                                     ${booking.guests.length} guests: <br>
//                                     <ol>
//                                         ${ booking.guests.map(guest => `
//                                             <li>
//                                                 ${guest}
//                                             </li>`)
//             .join("")
//         }
//                                     </ol>
//
//                                     Event Details: <br>
//                                     <ul>
//                                         <li>The Grand Feast Europe and UK 2024</li>
//                                         <li>Date: September 22, 2024</li>
//                                         <li>Time: 9:00 AM to 12:00 PM CET</li>
//                                         <li>Venue: Hotel nhow Brussels Bloom: Rue Royale</li>
//                                         <li>Address: Koningsstraat 250 1210 Brussels Belgium</li>
//                                     </ul>
//
//
//                                     <!-- PARTING MESSAGE -->
//                                     We hope you have a great time at the event! <br>
//                                     <br>
//
//                                     Have a blessed day! <br>
//                                     The Feast Europe and UK Team <br>
//                                     <br>
//
//                                     <hr>
//                                 </div>
//                             </td>
//                         </tr>
//                     </table>
//                 </body>
//         </html>
//         `
//     };
//
//     await Send(email)
// }