import { City, Country } from 'country-state-city';

export type CountryOption = {
	name: string;
	isoCode: string;
	searchKey: string;
};

export type CityOption = {
	label: string;
	value: string;
	searchKey: string;
};

const MAX_LOCATION_OPTIONS = 40;
const EUROPE_AND_UK_COUNTRY_CODES = new Set([
	'AD',
	'AL',
	'AT',
	'AX',
	'BA',
	'BE',
	'BG',
	'BY',
	'CH',
	'CY',
	'CZ',
	'DE',
	'DK',
	'EE',
	'ES',
	'FI',
	'FO',
	'FR',
	'GB',
	'GG',
	'GI',
	'GR',
	'HR',
	'HU',
	'IE',
	'IM',
	'IS',
	'IT',
	'JE',
	'LI',
	'LT',
	'LU',
	'LV',
	'MC',
	'MD',
	'ME',
	'MK',
	'MT',
	'NL',
	'NO',
	'PL',
	'PT',
	'RO',
	'RS',
	'SE',
	'SI',
	'SK',
	'SM',
	'TR',
	'UA',
	'VA',
	'XK'
]);
let countryOptionsCache: CountryOption[] | undefined;
const cityOptionsByCountryIso = new Map<string, CityOption[]>();

export function getCountryOptions(): CountryOption[] {
	countryOptionsCache ??= Country.getAllCountries()
		.filter((country) => EUROPE_AND_UK_COUNTRY_CODES.has(country.isoCode))
		.map((country) => ({
			name: country.name,
			isoCode: country.isoCode,
			searchKey: normalizeLocationValue(country.name)
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	return countryOptionsCache;
}

export function getCityOptionsForCountry(countryName: string, search = ''): CityOption[] {
	const countryOption = getCountryOptions().find(
		(country) => country.searchKey === normalizeLocationValue(countryName)
	);
	if (!countryOption) return [];

	const cityOptions = getCachedCityOptions(countryOption.isoCode);
	const normalizedSearch = normalizeLocationValue(search);
	const options = normalizedSearch
		? cityOptions.filter((city) => city.searchKey.includes(normalizedSearch))
		: cityOptions;

	return [...options]
		.sort(
			(a, b) =>
				rankLocationKey(a.searchKey, normalizedSearch) -
					rankLocationKey(b.searchKey, normalizedSearch) || a.value.localeCompare(b.value)
		)
		.slice(0, MAX_LOCATION_OPTIONS);
}

function getCachedCityOptions(countryIsoCode: string): CityOption[] {
	const cachedOptions = cityOptionsByCountryIso.get(countryIsoCode);
	if (cachedOptions) return cachedOptions;

	const cityOptionsBySearchKey = new Map<string, CityOption>();
	for (const city of City.getCitiesOfCountry(countryIsoCode) ?? []) {
		const searchKey = normalizeLocationValue(city.name);
		if (!searchKey || cityOptionsBySearchKey.has(searchKey)) continue;
		cityOptionsBySearchKey.set(searchKey, {
			label: city.name,
			value: city.name,
			searchKey
		});
	}

	const cityOptions = [...cityOptionsBySearchKey.values()].sort((a, b) =>
		a.value.localeCompare(b.value)
	);
	cityOptionsByCountryIso.set(countryIsoCode, cityOptions);
	return cityOptions;
}

function rankLocationKey(normalizedLabel: string, search: string) {
	if (!search) return 0;
	if (normalizedLabel === search) return 0;
	if (normalizedLabel.startsWith(search)) return 1;
	return 2;
}

function normalizeLocationValue(value: string) {
	return value.trim().toLowerCase();
}
