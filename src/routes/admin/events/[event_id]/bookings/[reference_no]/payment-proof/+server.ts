import { redirect, type RequestHandler } from '@sveltejs/kit';
import { NotFoundError } from '$lib/application/errors';
import { getCloudinaryPaymentProofSignedUrl } from '$lib/infrastructure/media/cloudinaryPaymentProofStorage';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { requireRouteParam, withKitErrors } from '$lib/server/http/handlers';
import { requireAdminRequest } from '$lib/server/http/guards';

export const GET: RequestHandler = withKitErrors(async (event) => {
	await requireAdminRequest(event);
	const {
		eventId,
		services: { bookingService }
	} = await getEventServiceContext(event);
	const referenceNo = requireRouteParam(event.params, 'reference_no');
	const booking = await bookingService.getRequiredById(referenceNo);
	if (booking.event_id !== eventId) {
		throw new NotFoundError('booking not found');
	}

	const proofUrl = booking.payment_proof_url;
	if (!proofUrl) {
		throw new NotFoundError('payment proof not found');
	}

	if (proofUrl.startsWith('data:')) {
		return dataUrlResponse(proofUrl, referenceNo);
	}

	throw redirect(302, getCloudinaryPaymentProofSignedUrl(proofUrl) ?? proofUrl);
});

function dataUrlResponse(dataUrl: string, referenceNo: string): Response {
	const match = /^data:([^;,]+)(;base64)?,(.*)$/.exec(dataUrl);
	if (!match) {
		throw new NotFoundError('payment proof not found');
	}

	const [, contentType, base64Flag, body] = match;
	const bytes = base64Flag
		? Uint8Array.from(atob(body), (character) => character.charCodeAt(0))
		: new TextEncoder().encode(decodeURIComponent(body));

	return new Response(bytes, {
		headers: {
			'content-type': contentType,
			'content-disposition': `inline; filename="payment-proof-${referenceNo}"`
		}
	});
}
