---
name: do-test-booking
description: 'Prepare the local Grand Feast `/newbooking` flow for manual final submission. Use when Codex needs to create a repeatable local test booking setup: fill two Standard tickets, generate varied guest names, upload the fake bank-transfer receipt, open the non-refundable confirmation modal, and stop before clicking the final submit button.'
---

# Do Test Booking

## Purpose

Prepare a local Grand Feast test booking through the browser UI. Stop with the final
non-refundable confirmation modal visible; never click `Yes, Submit Booking`.

## Safety Rules

- Use only local app URLs: `http://127.0.0.1:5173/newbooking` or
  `http://localhost:5173/newbooking`.
- Abort before submitting if the current page is not on `127.0.0.1`, `localhost`, or `::1`.
- Do not use hosted, Netlify, production, or dev domains.
- Do not persist the attendee email or generated guest names to disk.
- Do not click `Yes, Submit Booking`. That is the user's final action.

## Session Email

- If the current Codex conversation already includes a `do-test-booking` attendee email, reuse it.
- If no attendee email is known for this conversation, ask the user for one before filling the form.
- Treat an email provided in the same user request as the session email.

## Booking Values

- Ticket type: `Standard`
- Quantity: `2`
- Country: `Germany`
- City: `Berlin`
- Proof file: `test/resources/fake-bank-transfer-receipt.jpg` from the current repo

Generate two distinct guest names for each run:

- Format: exactly two title-cased words.
- First word: choose from `Smart`, `Lucky`, `Running`, `Feisty`, `Bright`, `Swift`, `Brave`,
  `Calm`, `Kind`, `Daring`, `Cheerful`, `Nimble`.
- Second word: choose from `Ada`, `Chloe`, `Bob`, `Fred`, `Maya`, `Lina`, `Grace`, `Nora`,
  `Theo`, `Ivy`, `Owen`, `Mila`.
- Examples: `Smart Ada`, `Lucky Chloe`, `Running Bob`, `Feisty Fred`.

## Browser Workflow

Use the Browser plugin / in-app browser when available.

1. Open or navigate to `http://127.0.0.1:5173/newbooking`.
2. Confirm the page is local.
3. On step 1, select `Standard` and increment quantity to `2`.
4. Click `Continue`.
5. On step 2, fill the session email, `Germany`, and `Berlin`.
6. Click `Continue`.
7. On step 3, fill the two generated guest names.
8. Click `Continue`.
9. On step 4, upload `test/resources/fake-bank-transfer-receipt.jpg`.
10. Click `Reserve Now` to open the final confirmation modal.
11. Verify the modal text includes `Non-refundable tickets` and the button
    `Yes, Submit Booking`.
12. Stop and tell the user the booking is ready for their personal final confirmation.

## Failure Handling

- If the fake receipt is missing, stop and report that
  `test/resources/fake-bank-transfer-receipt.jpg` must exist.
- If the browser automation surface cannot set file inputs and native file-picker automation is
  unavailable, click the proof upload input, ask the user to choose
  `test/resources/fake-bank-transfer-receipt.jpg`, then continue after the page shows the attached
  file name. Do not fake a final-ready booking without a real selected file.
- If there are fewer than two Standard tickets available, stop and report the visible inventory state.
- If a form field cannot be filled from labels, use stable DOM selectors from the current page
  (`#visible-email`, `#country`, `#city`, `#visible-guest-1`, `#visible-guest-2`,
  `#payment-proof`) after confirming the page is local.
- If the confirmation modal does not appear after `Reserve Now`, report the visible validation
  message or blocking state instead of retrying blindly.
