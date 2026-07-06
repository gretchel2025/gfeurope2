import { describe, expect, it } from 'vitest';
import { getCityOptionsForCountry, getCountryOptions } from './locationOptions';

describe('location options', () => {
	it('limits country options to Europe and the UK', () => {
		const countryNames = getCountryOptions().map((country) => country.name);
		expect(countryNames).toContain('Finland');
		expect(countryNames).toContain('United Kingdom');
		expect(countryNames).not.toContain('United States');
	});

	it('includes Helsinki in Finland city options', () => {
		expect(getCityOptionsForCountry('Finland', 'helsinki')).toEqual([
			{
				label: 'Helsinki',
				value: 'Helsinki',
				searchKey: 'helsinki'
			}
		]);
	});
});
