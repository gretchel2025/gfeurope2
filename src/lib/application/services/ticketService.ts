import { NotFoundError, ValidationError } from "$lib/application/errors";
import type {
    BookingRepository,
    EventLogger,
    ImageStorage,
    QrCodeGenerator,
    TicketRepository,
} from "$lib/application/ports";
import type { CreateTicketInput, QRCode, Ticket } from "$lib/domain/ticket";
import { canCheckInTicket, canCheckOutTicket, normalizeTicketType } from "$lib/domain/ticket";
import { TicketStatus } from "$lib/domain/shared/enums";

export class TicketService {
    constructor(
        private readonly bookingRepository: BookingRepository,
        private readonly ticketRepository: TicketRepository,
        private readonly imageStorage: ImageStorage,
        private readonly qrCodeGenerator: QrCodeGenerator,
        private readonly eventLogger: EventLogger,
        private readonly appBaseUrl: string,
        private readonly randomIdGenerator: (size: number) => string,
    ) {}

    async createNew(input: CreateTicketInput): Promise<Ticket> {
        const ticketType = normalizeTicketType(input.ticket_type);
        const ticketId = this.generateTicketId();
        const qrCode = await this.getCheckinQRCode(ticketId, input.booking_reference_no);
        const qrCodeImageUrl = await this.imageStorage.uploadImage(qrCode.imageData);

        const ticket: Ticket = {
            ticket_id: ticketId,
            name: input.name,
            ticket_type: ticketType,
            description: input.description,
            status: TicketStatus.CREATED,
            is_paid: input.is_paid,
            booking_reference_no: input.booking_reference_no,
            checkin_qr_code_image_url: qrCodeImageUrl,
        };

        await this.ticketRepository.insert(ticket);
        this.eventLogger.log("TICKET_CREATED", "system", {
            ticket_id: ticket.ticket_id,
            ticket_guest_name: ticket.name,
            related_booking_reference_no: ticket.booking_reference_no,
        });

        return ticket;
    }

    async getById(ticketId: string): Promise<Ticket | null> {
        return await this.ticketRepository.findByTicketId(ticketId);
    }

    async getRequiredById(ticketId: string): Promise<Ticket> {
        const ticket = await this.getById(ticketId);
        if (!ticket) {
            throw new NotFoundError("ticket not found");
        }
        return ticket;
    }

    async getAll(): Promise<Ticket[]> {
        return await this.ticketRepository.list();
    }

    async deleteById(ticketId: string): Promise<void> {
        await this.ticketRepository.deleteByTicketId(ticketId);
    }

    async checkIn(ticketId: string): Promise<void> {
        const { ticket, booking } = await this.getTicketAndBooking(ticketId);
        if (!canCheckInTicket(booking, ticket)) {
            throw new ValidationError("ticket state is not allowed for check in");
        }

        await this.ticketRepository.updateStatus(ticketId, TicketStatus.CHECKED_IN);
        this.eventLogger.log("TICKET_CHECKED_IN", "system", {
            ticket_id: ticket.ticket_id,
            ticket_guest_name: ticket.name,
            related_booking_reference_no: ticket.booking_reference_no,
        });
    }

    async checkOut(ticketId: string): Promise<void> {
        const { ticket, booking } = await this.getTicketAndBooking(ticketId);
        if (!canCheckOutTicket(booking, ticket)) {
            throw new ValidationError("ticket state is not allowed for check out");
        }

        await this.ticketRepository.updateStatus(ticketId, TicketStatus.CHECKED_OUT);
        this.eventLogger.log("TICKET_CHECKED_OUT", "system", {
            ticket_id: ticket.ticket_id,
            ticket_guest_name: ticket.name,
            related_booking_reference_no: ticket.booking_reference_no,
        });
    }

    async getCheckinQRCode(ticketId: string, bookingReferenceNo: string): Promise<QRCode> {
        const encodedToken = Buffer.from(`${bookingReferenceNo}:${ticketId}`).toString("base64");
        const url = `${this.appBaseUrl}/api/v0/ticket/${ticketId}/checkin?token=${encodedToken}`;
        const qrCodeImage = await this.qrCodeGenerator.generate(url);

        return {
            imageData: qrCodeImage,
            targetURL: url,
        };
    }

    private async getTicketAndBooking(ticketId: string) {
        const ticket = await this.getRequiredById(ticketId);
        const booking = await this.bookingRepository.findByReferenceNo(ticket.booking_reference_no);
        if (!booking) {
            throw new NotFoundError("booking not found");
        }
        return { ticket, booking };
    }

    private generateTicketId(): string {
        const part1 = this.randomIdGenerator(3);
        const part2 = this.randomIdGenerator(4);
        return `T${part1}-${part2}`;
    }
}
