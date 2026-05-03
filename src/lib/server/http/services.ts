import { BookingService } from "$lib/application/services/bookingService";
import { NotificationService } from "$lib/application/services/notificationService";
import { ReportingService } from "$lib/application/services/reportingService";
import { SystemService } from "$lib/application/services/systemService";
import { TicketCounterService } from "$lib/application/services/ticketCounterService";
import { TicketService } from "$lib/application/services/ticketService";
import { UserService } from "$lib/application/services/userService";
import {
    MongoBookingRepository,
    MongoTicketCounterRepository,
    MongoTicketRepository,
    MongoUserRepository,
} from "$lib/infrastructure/db/mongo/repositories";
import { PostmarkEmailSender } from "$lib/infrastructure/email/postmarkEmailSender";
import { CloudinaryImageStorage } from "$lib/infrastructure/media/cloudinaryImageStorage";
import { DefaultQrCodeGenerator } from "$lib/infrastructure/media/qrCodeGenerator";
import { PinoEventLogger } from "$lib/infrastructure/logging/eventLogger";
import { InMemorySystemSettingsStore } from "$lib/infrastructure/system/inMemorySystemSettingsStore";
import { appConfig } from "$lib/infrastructure/config/env.server";
import { customAlphabet } from "nanoid/non-secure";

const randomIdGenerator = customAlphabet("23456789ABCDEFGHJKLMNPRSTUVWXYZ", 10);

const bookingRepository = new MongoBookingRepository();
const ticketRepository = new MongoTicketRepository();
const ticketCounterRepository = new MongoTicketCounterRepository();
const userRepository = new MongoUserRepository();

const emailSender = new PostmarkEmailSender();
const imageStorage = new CloudinaryImageStorage();
const qrCodeGenerator = new DefaultQrCodeGenerator();
const eventLogger = new PinoEventLogger();
const systemSettingsStore = new InMemorySystemSettingsStore();

export const ticketCounterService = new TicketCounterService(ticketCounterRepository);
export const userService = new UserService(userRepository);
export const notificationService = new NotificationService(bookingRepository, ticketRepository, emailSender);
export const ticketService = new TicketService(
    bookingRepository,
    ticketRepository,
    imageStorage,
    qrCodeGenerator,
    eventLogger,
    appConfig.appBaseUrl,
    (size) => randomIdGenerator(size),
);
export const bookingService = new BookingService(
    bookingRepository,
    ticketCounterService,
    ticketService,
    notificationService,
    eventLogger,
    (size) => randomIdGenerator(size),
);
export const reportingService = new ReportingService();
export const systemService = new SystemService(systemSettingsStore);

export const repositories = {
    bookingRepository,
    ticketRepository,
    ticketCounterRepository,
    userRepository,
};
