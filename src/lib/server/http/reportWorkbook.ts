import ExcelJS from 'exceljs';
import type {
	CityTicketSalesExportRow,
	GeneratedTicketReportRow
} from '$lib/application/services/reportingService';

export const xlsxContentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type WorksheetColumn = {
	header: string;
	key: string;
	width: number;
	numFmt?: string;
};

const headerFill = {
	type: 'pattern' as const,
	pattern: 'solid' as const,
	fgColor: { argb: 'FFE2E8F0' }
};

const totalFill = {
	type: 'pattern' as const,
	pattern: 'solid' as const,
	fgColor: { argb: 'FFDBEAFE' }
};

export async function createCitySalesWorkbookBuffer(
	rows: CityTicketSalesExportRow[]
): Promise<BodyInit> {
	const workbook = createWorkbook();
	const worksheet = workbook.addWorksheet('City Sales', {
		views: [{ state: 'frozen', ySplit: 1 }],
		pageSetup: {
			paperSize: 9,
			orientation: 'landscape',
			fitToPage: true,
			fitToWidth: 1,
			fitToHeight: 0
		}
	});

	const columns: WorksheetColumn[] = [
		{ header: 'Rank', key: 'rank', width: 10 },
		{ header: 'City', key: 'cityName', width: 26 },
		{ header: 'Tickets Sold', key: 'ticketsSold', width: 16 },
		{ header: 'Paid Bookings', key: 'paidBookings', width: 16 },
		{ header: 'Paid Amount (EUR)', key: 'amountPaid', width: 18, numFmt: '"€"#,##0.00' },
		{ header: '% of Paid Tickets', key: 'percentOfPaidTickets', width: 18, numFmt: '0.0%' }
	];

	configureWorksheet(worksheet, columns);
	for (const row of rows) {
		worksheet.addRow({
			rank: row.rank,
			cityName: row.cityName,
			ticketsSold: row.ticketsSold,
			paidBookings: row.paidBookings,
			amountPaid: row.amountPaid,
			percentOfPaidTickets: row.percentOfPaidTickets
		});
	}
	styleGrandTotalRow(worksheet, rows);

	return await workbook.xlsx.writeBuffer();
}

export async function createGeneratedTicketsWorkbookBuffer(
	rows: GeneratedTicketReportRow[]
): Promise<BodyInit> {
	const workbook = createWorkbook();
	const worksheet = workbook.addWorksheet('Generated Tickets', {
		views: [{ state: 'frozen', ySplit: 1 }],
		pageSetup: {
			paperSize: 9,
			orientation: 'landscape',
			fitToPage: true,
			fitToWidth: 1,
			fitToHeight: 0
		}
	});

	const columns: WorksheetColumn[] = [
		{ header: '#', key: 'rowNumber', width: 8 },
		{ header: 'Ticket ID', key: 'ticketId', width: 18 },
		{ header: 'Guest Name', key: 'guestName', width: 28 },
		{ header: 'Ticket Type', key: 'ticketType', width: 18 },
		{ header: 'Status', key: 'status', width: 16 },
		{ header: 'Paid', key: 'paid', width: 10 },
		{ header: 'Booking Reference', key: 'bookingReferenceNo', width: 20 },
		{ header: 'City', key: 'cityName', width: 24 }
	];

	configureWorksheet(worksheet, columns);
	for (const row of rows) {
		worksheet.addRow(row);
	}

	return await workbook.xlsx.writeBuffer();
}

export function xlsxAttachmentResponse(body: BodyInit, filename: string): Response {
	return new Response(body, {
		headers: {
			'content-type': xlsxContentType,
			'content-disposition': `attachment; filename="${filename}"`,
			'cache-control': 'no-store'
		}
	});
}

export function datedXlsxFilename(eventId: string, reportName: string, now = new Date()): string {
	const datePart = now.toISOString().slice(0, 10);
	return `${eventId}-${reportName}-${datePart}.xlsx`;
}

function createWorkbook(): ExcelJS.Workbook {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Grand Feast Europe';
	workbook.lastModifiedBy = 'Grand Feast Europe';
	workbook.created = new Date();
	workbook.modified = new Date();
	return workbook;
}

function configureWorksheet(worksheet: ExcelJS.Worksheet, columns: WorksheetColumn[]): void {
	worksheet.columns = columns;
	worksheet.autoFilter = {
		from: 'A1',
		to: `${columnLetter(columns.length)}1`
	};

	const headerRow = worksheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FF0F172A' } };
	headerRow.fill = headerFill;
	headerRow.alignment = { vertical: 'middle', wrapText: true };

	for (const [index, column] of columns.entries()) {
		if (column.numFmt) {
			worksheet.getColumn(index + 1).numFmt = column.numFmt;
		}
	}
}

function styleGrandTotalRow(worksheet: ExcelJS.Worksheet, rows: CityTicketSalesExportRow[]): void {
	const totalRowIndex = rows.findIndex((row) => row.isGrandTotal);
	if (totalRowIndex === -1) {
		return;
	}

	const worksheetRow = worksheet.getRow(totalRowIndex + 2);
	worksheetRow.font = { bold: true, color: { argb: 'FF0F172A' } };
	worksheetRow.fill = totalFill;
}

function columnLetter(columnNumber: number): string {
	let column = '';
	let current = columnNumber;
	while (current > 0) {
		const remainder = (current - 1) % 26;
		column = String.fromCharCode(65 + remainder) + column;
		current = Math.floor((current - 1) / 26);
	}
	return column;
}
