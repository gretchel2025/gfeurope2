import { describe, expect, it, vi } from 'vitest';
import type { BookingRepository, EmailSender, TicketRepository } from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import { NotificationService } from '$lib/application/services/notificationService';
import { AuditAction, AuditEntityType } from '$lib/domain/auditEvent';
import type { Booking } from '$lib/domain/booking';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';

describe('NotificationService audit events', () => {
	it('records booking.tickets_email_sent after the ticket email sends', async () => {
		const booking: Booking = {
			event_id: 'gfeu2026',
			reference_no: 'BREF001',
			name: 'Ada Lovelace',
			email: 'ada@example.com',
			city: 'Dublin',
			ticket_type: TicketType.STANDARD,
			book_date: '2026-01-01T00:00:00.000Z',
			payment_status: BookingPaymentStatus.PAID,
			amount_total: 35,
			guests: ['Ada Lovelace'],
			ticket_ids: ['TICKET001'],
			tickets_sent_to_client: false
		};
		const ticket: Ticket = {
			ticket_id: 'TICKET001',
			name: 'Ada Lovelace',
			ticket_type: TicketType.STANDARD,
			description: '',
			status: TicketStatus.CREATED,
			is_paid: true,
			booking_reference_no: 'BREF001',
			checkin_qr_code_image_url: 'https://example.com/qr.png'
		};
		const bookingRepository = {
			findByReferenceNo: vi.fn(async () => booking),
			markTicketsSentToClient: vi.fn()
		} as unknown as BookingRepository;
		const ticketRepository = {
			findByTicketId: vi.fn(async () => ticket)
		} as unknown as TicketRepository;
		const emailSender = { send: vi.fn() } satisfies EmailSender;
		const auditEventService = {
			record: vi.fn()
		} as unknown as AuditEventService;
		const service = new NotificationService(
			bookingRepository,
			ticketRepository,
			emailSender,
			auditEventService
		);

		await service.sendTicketsEmail('BREF001');

		expect(emailSender.send).toHaveBeenCalledOnce();
		expect(bookingRepository.markTicketsSentToClient).toHaveBeenCalledWith('BREF001');
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AuditAction.BookingTicketsEmailSent,
				entity_type: AuditEntityType.Booking,
				entity_id: 'BREF001',
				metadata: expect.objectContaining({
					booking_reference_no: 'BREF001',
					email: 'ada@example.com',
					ticket_type: TicketType.STANDARD,
					quantity: 1,
					ticket_ids: ['TICKET001'],
					amount_total: 35,
					payment_status: BookingPaymentStatus.PAID
				})
			})
		);
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AuditAction.BookingMarkedTicketsAsSent,
				entity_type: AuditEntityType.Booking,
				entity_id: 'BREF001',
				metadata: expect.objectContaining({
					booking_reference_no: 'BREF001',
					email: 'ada@example.com',
					ticket_type: TicketType.STANDARD,
					quantity: 1,
					ticket_ids: ['TICKET001'],
					previous_tickets_sent_to_client: false,
					tickets_sent_to_client: true
				})
			})
		);
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: expect.not.objectContaining({
					message: expect.anything()
				})
			})
		);
	});

	it('does not send or mark when generated ticket records are incomplete', async () => {
		const booking: Booking = {
			event_id: 'gfeu2026',
			reference_no: 'BREF001',
			name: 'Ada Lovelace',
			email: 'ada@example.com',
			city: 'Dublin',
			ticket_type: TicketType.STANDARD,
			book_date: '2026-01-01T00:00:00.000Z',
			payment_status: BookingPaymentStatus.PAID,
			amount_total: 35,
			guests: ['Ada Lovelace'],
			ticket_ids: ['TICKET001'],
			tickets_sent_to_client: false
		};
		const bookingRepository = {
			findByReferenceNo: vi.fn(async () => booking),
			markTicketsSentToClient: vi.fn()
		} as unknown as BookingRepository;
		const ticketRepository = {
			findByTicketId: vi.fn(async () => null)
		} as unknown as TicketRepository;
		const emailSender = { send: vi.fn() } satisfies EmailSender;
		const auditEventService = {
			record: vi.fn()
		} as unknown as AuditEventService;
		const service = new NotificationService(
			bookingRepository,
			ticketRepository,
			emailSender,
			auditEventService
		);

		await expect(service.sendTicketsEmail('BREF001')).rejects.toThrow(
			'booking ticket records are incomplete'
		);

		expect(emailSender.send).not.toHaveBeenCalled();
		expect(bookingRepository.markTicketsSentToClient).not.toHaveBeenCalled();
		expect(auditEventService.record).not.toHaveBeenCalled();
	});

	it('records booking.payment_reminder_sent after the reminder email sends', async () => {
		const booking: Booking = {
			event_id: 'gfeu2026',
			reference_no: 'BREF001',
			name: 'Ada Lovelace',
			email: 'ada@example.com',
			city: 'Dublin',
			ticket_type: TicketType.STANDARD,
			book_date: '2026-01-01T00:00:00.000Z',
			payment_status: BookingPaymentStatus.UNPAID,
			amount_total: 35,
			guests: ['Ada Lovelace'],
			ticket_ids: [],
			tickets_sent_to_client: false
		};
		const bookingRepository = {
			findByReferenceNo: vi.fn(async () => booking)
		} as unknown as BookingRepository;
		const ticketRepository = {} as unknown as TicketRepository;
		const emailSender = { send: vi.fn() } satisfies EmailSender;
		const auditEventService = {
			record: vi.fn()
		} as unknown as AuditEventService;
		const service = new NotificationService(
			bookingRepository,
			ticketRepository,
			emailSender,
			auditEventService
		);

		await service.sendPaymentReminder('BREF001');

		expect(emailSender.send).toHaveBeenCalledOnce();
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AuditAction.BookingPaymentReminderSent,
				entity_type: AuditEntityType.Booking,
				entity_id: 'BREF001',
				metadata: expect.not.objectContaining({
					message: expect.anything()
				})
			})
		);
	});
});
