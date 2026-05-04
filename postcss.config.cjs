/**
 * Purpose:
 * This root PostCSS config lets Vite compile Tailwind during local dev and builds.
 *
 * Why this structure is good:
 * Keeping build-tool config at the project root matches Vite's default lookup
 * behavior, so the app does not need to rely on the browser CDN for Tailwind.
 */
module.exports = {
	plugins: {
		'@tailwindcss/postcss': {},
		autoprefixer: {}
	}
};
