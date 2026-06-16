import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import {
	createCitySalesWorkbookBuffer,
	createGeneratedTicketsWorkbookBuffer,
	createMerchReservationsWorkbookBuffer,
	datedXlsxFilename,
	xlsxAttachmentResponse,
	xlsxContentType
} from '$lib/server/http/reportWorkbook';
import { MerchReservationEmailStatus, MerchReservationStatus } from '$lib/domain/merchandise';

describe('reportWorkbook', () => {
	it('builds XLSX attachment responses with download headers', async () => {
		const response = xlsxAttachmentResponse(new Uint8Array([1, 2, 3]), 'report.xlsx');

		expect(response.headers.get('content-type')).toBe(xlsxContentType);
		expect(response.headers.get('content-disposition')).toBe('attachment; filename="report.xlsx"');
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2, 3]);
	});

	it('builds dated event-scoped filenames', () => {
		expect(datedXlsxFilename('gfeu2026', 'city-sales', new Date('2026-06-16T09:00:00Z'))).toBe(
			'gfeu2026-city-sales-2026-06-16.xlsx'
		);
	});

	it('builds a valid city sales workbook', async () => {
		const buffer = await createCitySalesWorkbookBuffer([
			{
				rank: 1,
				cityName: 'Berlin',
				ticketsSold: 3,
				paidBookings: 2,
				amountPaid: 105,
				percentOfPaidTickets: 0.75,
				isGrandTotal: false
			},
			{
				rank: '',
				cityName: 'Grand total',
				ticketsSold: 3,
				paidBookings: 2,
				amountPaid: 105,
				percentOfPaidTickets: 1,
				isGrandTotal: true
			}
		]);
		const workbook = await loadWorkbook(buffer);
		const worksheet = workbook.getWorksheet('City Sales');

		expect(worksheet?.getCell('B1').value).toBe('City');
		expect(worksheet?.getCell('B2').value).toBe('Berlin');
		expect(worksheet?.getCell('B3').value).toBe('Grand total');
	});

	it('builds a valid generated tickets workbook', async () => {
		const buffer = await createGeneratedTicketsWorkbookBuffer([
			{
				rowNumber: 1,
				ticketId: 'T001',
				guestName: 'Ada Lovelace',
				ticketType: 'Standard',
				status: 'CREATED',
				paid: 'Yes',
				bookingReferenceNo: 'BREF001',
				cityName: 'Berlin'
			}
		]);
		const workbook = await loadWorkbook(buffer);
		const worksheet = workbook.getWorksheet('Generated Tickets');

		expect(worksheet?.getCell('C1').value).toBe('Guest Name');
		expect(worksheet?.getCell('C2').value).toBe('Ada Lovelace');
		expect(worksheet?.getCell('H2').value).toBe('Berlin');
	});

	it('builds a valid merchandise reservations workbook', async () => {
		const buffer = await createMerchReservationsWorkbookBuffer([
			{
				event_id: 'gfeu2026',
				reservation_id: 'MR-TEST123',
				customer_name: 'Codex Test Customer',
				email: 'codex@example.test',
				mobile: '+3530000000',
				reserved_at: '2026-06-16T09:30:00.000Z',
				status: MerchReservationStatus.Reserved,
				amount_total: 27.5,
				currency: 'EUR',
				confirmation_email_status: MerchReservationEmailStatus.Sent,
				items: [
					{
						event_id: 'gfeu2026',
						reservation_id: 'MR-TEST123',
						product_id: 'MP-TEST',
						product_name: 'Codex Test Mug',
						quantity: 2,
						unit_price: 13.75,
						currency: 'EUR',
						selected_size: 'One Size',
						selected_color: 'Gold'
					}
				]
			}
		]);
		const workbook = await loadWorkbook(buffer);
		const worksheet = workbook.getWorksheet('Merch Reservations');

		expect(worksheet?.getCell('B1').value).toBe('Reference');
		expect(worksheet?.getCell('B2').value).toBe('MR-TEST123');
		expect(worksheet?.getCell('C2').value).toBe('Codex Test Customer');
		expect(worksheet?.getCell('G2').value).toBe('2x Codex Test Mug (One Size / Gold)');
	});
});

async function loadWorkbook(buffer: BodyInit): Promise<ExcelJS.Workbook> {
	const workbook = new ExcelJS.Workbook();
	const arrayBuffer = await new Response(buffer).arrayBuffer();
	await workbook.xlsx.load(arrayBuffer as Parameters<typeof workbook.xlsx.load>[0]);
	return workbook;
}
