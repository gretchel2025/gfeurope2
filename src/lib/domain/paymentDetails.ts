export type PaymentDetails = {
	accountNameLabel: string;
	accountName: string;
	bankNameLabel: string;
	bankName: string;
	ibanLabel: string;
	iban: string;
	bicSwiftLabel: string;
	bicSwift: string;
};

export const grandFeastPaymentDetails: PaymentDetails = {
	accountNameLabel: 'Account name',
	accountName: 'Light Of Jesus Family Ireland CLG',
	bankNameLabel: 'Bank name',
	bankName: 'Bank of Ireland',
	ibanLabel: 'IBAN',
	iban: 'IE12 BOFI 9000 1780 5681 80',
	bicSwiftLabel: 'BIC/SWIFT',
	bicSwift: 'BOFIIE2DXXX'
};

export const jewelsPaymentDetails: PaymentDetails = {
	accountNameLabel: 'Recipient',
	accountName: 'THE FEAST BRUSSELS (LIGHT OF JESUS FAMILY)',
	bankNameLabel: 'Bank Name',
	bankName: 'BNP PARIBAS',
	ibanLabel: 'Bank Details',
	iban: 'BE85001896796806',
	bicSwiftLabel: 'BIC',
	bicSwift: 'GEBABEBB'
};

export function getPaymentDetailsForEvent(eventId: string): PaymentDetails {
	if (eventId === 'jewels2026') {
		return jewelsPaymentDetails;
	}

	return grandFeastPaymentDetails;
}
