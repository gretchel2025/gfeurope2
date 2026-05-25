import { describe, expect, it } from 'vitest';
import { evaluateFormOrigin } from './csrfOrigin';

const baseInput = {
	method: 'POST',
	contentType: 'application/x-www-form-urlencoded',
	origin: 'https://dev.grandfeast.eu',
	requestOrigin: 'https://dev--grand-feast-uk-x-europe.netlify.app',
	appBaseUrl: 'https://dev.grandfeast.eu'
};

describe('evaluateFormOrigin', () => {
	it('allows non-form requests without an origin', () => {
		expect(
			evaluateFormOrigin({
				...baseInput,
				contentType: 'application/json',
				origin: null
			})
		).toEqual({ allowed: true });
	});

	it('allows regular same-origin form posts', () => {
		expect(
			evaluateFormOrigin({
				...baseInput,
				origin: 'https://dev--grand-feast-uk-x-europe.netlify.app'
			})
		).toEqual({ allowed: true });
	});

	it('allows the configured app origin when Netlify reconstructs the request origin differently', () => {
		expect(evaluateFormOrigin(baseInput)).toEqual({ allowed: true });
	});

	it('allows the production apex and www origins', () => {
		expect(
			evaluateFormOrigin({
				...baseInput,
				origin: 'https://grandfeast.eu',
				requestOrigin: 'https://grand-feast-uk-x-europe.netlify.app',
				appBaseUrl: 'https://www.grandfeast.eu'
			})
		).toEqual({ allowed: true });
	});

	it('blocks untrusted cross-site form posts', () => {
		expect(
			evaluateFormOrigin({
				...baseInput,
				origin: 'https://attacker.example'
			})
		).toEqual({ allowed: false });
	});

	it('blocks unsafe form posts that omit origin', () => {
		expect(
			evaluateFormOrigin({
				...baseInput,
				origin: null
			})
		).toEqual({ allowed: false });
	});
});
