const jewelsSocialPreviewPath = '/events/jewels2026';
const jewelsSocialPreviewImagePath = `${jewelsSocialPreviewPath}/social-preview.jpg?v=20260628`;
const jewelsSocialPreviewTitle = 'JEWELS CONFERENCE 2026 | JEWELS Europe';
const jewelsSocialPreviewDescription =
	'JEWELS Europe gathers in Malta for Becoming, JEWELS CONFERENCE 2026.';
const jewelsSocialPreviewImageAlt = 'JEWELS Conference 2026 Becoming event artwork';
const socialPreviewCrawlerPattern =
	/facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|skypeuripreview/i;

export default async (request: Request, context: { next: () => Promise<Response> }) => {
	const url = new URL(request.url);
	const normalizedPath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
	const userAgent = request.headers.get('user-agent');

	if (
		normalizedPath !== jewelsSocialPreviewPath ||
		!userAgent ||
		!socialPreviewCrawlerPattern.test(userAgent)
	) {
		return context.next();
	}

	return new Response(renderJewelsSocialPreviewHtml(url.origin), {
		headers: {
			'cache-control': 'public, max-age=0, must-revalidate',
			'content-type': 'text/html; charset=utf-8',
			vary: 'user-agent'
		}
	});
};

function renderJewelsSocialPreviewHtml(origin: string): string {
	const eventUrl = `${origin}${jewelsSocialPreviewPath}`;
	const imageUrl = `${origin}${jewelsSocialPreviewImagePath}`;

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width" />
		<title>${jewelsSocialPreviewTitle}</title>
		<meta name="description" content="${jewelsSocialPreviewDescription}" />
		<link rel="canonical" href="${eventUrl}" />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Grand Feast Europe" />
		<meta property="og:url" content="${eventUrl}" />
		<meta property="og:title" content="${jewelsSocialPreviewTitle}" />
		<meta property="og:description" content="${jewelsSocialPreviewDescription}" />
		<meta property="og:image" content="${imageUrl}" />
		<meta property="og:image:secure_url" content="${imageUrl}" />
		<meta property="og:image:type" content="image/jpeg" />
		<meta property="og:image:width" content="1280" />
		<meta property="og:image:height" content="640" />
		<meta property="og:image:alt" content="${jewelsSocialPreviewImageAlt}" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="${jewelsSocialPreviewTitle}" />
		<meta name="twitter:description" content="${jewelsSocialPreviewDescription}" />
		<meta name="twitter:image" content="${imageUrl}" />
		<meta name="twitter:image:alt" content="${jewelsSocialPreviewImageAlt}" />
	</head>
	<body>
		<main>
			<h1>${jewelsSocialPreviewTitle}</h1>
			<p>${jewelsSocialPreviewDescription}</p>
			<p><a href="${eventUrl}">Open JEWELS Conference 2026</a></p>
		</main>
	</body>
</html>`;
}
