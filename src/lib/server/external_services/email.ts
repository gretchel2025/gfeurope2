// Module email provides functionality to send emails using external service Postmark (www.postmarkapp.com)

import { env } from '$env/dynamic/private'

import type { Email } from "$lib/entities/models";
import {error} from "@sveltejs/kit";

// load api key from ENV
const apiToken = env.MY_POSTMARK_API_KEY

// Send sends an email. The "from" value will be overwritten by the required constant value.
export async function Send(email: Email): Promise<any>{
    // convert from our email format to the service's format
    email.from = "help@grandfeast.eu" // hard-coded, defined at the service
    const svcEmail = convertEmail(email)

    // send the email
    const response = await fetch("https://api.postmarkapp.com/email",
        {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": apiToken,
            },
            body: JSON.stringify(svcEmail),
        });

    // parse the response
    const apiResp = await response.json(); // parses JSON response into native JavaScript objects
    if (response.status != 200) {
        // throw error(response.status, { status: response.status, message: apiResp })
        throw error(response.status, "email svc: failed to send email:" + JSON.stringify(apiResp) )
        // throw error(500, "email svc: failed to send email:" + JSON.stringify(apiResp) )
    }

    // respond
    return apiResp
}

// convertEmail converts our internal Model into the format required by the service we're using
function convertEmail(email: Email) {
    return {
        From: email.from,
        To: email.to,
        Subject: email.subject,
        HtmlBody: email.message,
        MessageStream: "outbound",
    }
}