const originHost = 'dev--grand-feast-uk-x-europe.netlify.app';
const publicOrigin = 'https://dev.grandfeast.eu';
const netlifyOrigin = `https://${originHost}`;

export default {
	async fetch(request) {
		const incomingUrl = new URL(request.url);
		const originUrl = new URL(request.url);
		originUrl.protocol = 'https:';
		originUrl.hostname = originHost;

		const headers = new Headers(request.headers);
		headers.set('Host', incomingUrl.host);
		headers.set('X-Forwarded-Host', incomingUrl.host);
		headers.set('X-Forwarded-Proto', incomingUrl.protocol.replace(':', ''));

		const originRequest = new Request(originUrl, {
			method: request.method,
			headers,
			body: request.body,
			redirect: 'manual'
		});

		const originResponse = await fetch(originRequest, {
			cf: {
				cacheTtl: 0,
				cacheEverything: false
			}
		});

		const responseHeaders = new Headers(originResponse.headers);
		const location = responseHeaders.get('Location');
		if (location) {
			responseHeaders.set('Location', location.replaceAll(netlifyOrigin, publicOrigin));
		}
		responseHeaders.set('Cache-Control', 'no-store');

		return new Response(originResponse.body, {
			status: originResponse.status,
			statusText: originResponse.statusText,
			headers: responseHeaders
		});
	}
};
