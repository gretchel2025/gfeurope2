import { NotFoundError, ValidationError } from '$lib/application/errors';
import type {
	EventLogger,
	EventRepository,
	MerchProductRepository,
	MerchReservationRepository
} from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import type { NotificationService } from '$lib/application/services/notificationService';
import {
	AuditAction,
	AuditEntityType,
	systemAuditActor,
	type AuditActor
} from '$lib/domain/auditEvent';
import {
	isMerchProductCategory,
	merchProductCategories,
	MerchReservationEmailStatus,
	sortMerchProductsByCategoryAndName,
	type CreateMerchProductInput,
	type CreateMerchReservationInput,
	type MerchProduct,
	type MerchReservation,
	type UpdateMerchProductInput
} from '$lib/domain/merchandise';

const maxImagesPerProduct = 5;
const maxReservationItems = 20;

export class MerchandiseService {
	constructor(
		private readonly merchProductRepository: MerchProductRepository,
		private readonly merchReservationRepository: MerchReservationRepository,
		private readonly eventRepository: EventRepository,
		private readonly notificationService: NotificationService,
		private readonly eventLogger: EventLogger,
		private readonly auditEventService: AuditEventService,
		private readonly randomIdGenerator: (size: number) => string
	) {}

	async createProduct(
		input: CreateMerchProductInput,
		actor: AuditActor = systemAuditActor
	): Promise<MerchProduct> {
		await this.requireEvent(input.event_id);
		const normalized = normalizeCreateProductInput(input);

		const product = await this.merchProductRepository.insert(normalized);
		await this.auditEventService.record({
			...actor,
			event_id: product.event_id,
			action: AuditAction.MerchProductCreated,
			entity_type: AuditEntityType.MerchProduct,
			entity_id: product.product_id,
			metadata: productAuditMetadata(product)
		});
		this.eventLogger.log('MERCH_PRODUCT_CREATED', actor.actor_email ?? 'admin', {
			event_id: product.event_id,
			product_id: product.product_id,
			name: product.name
		});
		return product;
	}

	async updateProduct(
		eventId: string,
		input: UpdateMerchProductInput,
		actor: AuditActor = systemAuditActor
	): Promise<MerchProduct> {
		await this.requireProduct(eventId, input.product_id);
		const normalized = normalizeUpdateProductInput(input);
		const product = await this.merchProductRepository.update(eventId, normalized);
		await this.auditEventService.record({
			...actor,
			event_id: product.event_id,
			action: AuditAction.MerchProductUpdated,
			entity_type: AuditEntityType.MerchProduct,
			entity_id: product.product_id,
			metadata: productAuditMetadata(product)
		});
		this.eventLogger.log('MERCH_PRODUCT_UPDATED', actor.actor_email ?? 'admin', {
			event_id: product.event_id,
			product_id: product.product_id,
			name: product.name
		});
		return product;
	}

	async deleteProduct(
		eventId: string,
		productId: string,
		actor: AuditActor = systemAuditActor
	): Promise<void> {
		const product = await this.requireProduct(eventId, productId);
		await this.merchProductRepository.softDelete(eventId, productId);
		await this.auditEventService.record({
			...actor,
			event_id: eventId,
			action: AuditAction.MerchProductDeleted,
			entity_type: AuditEntityType.MerchProduct,
			entity_id: productId,
			metadata: productAuditMetadata(product)
		});
		this.eventLogger.log('MERCH_PRODUCT_DELETED', actor.actor_email ?? 'admin', {
			event_id: eventId,
			product_id: productId,
			name: product.name
		});
	}

	async listProducts(eventId: string): Promise<MerchProduct[]> {
		await this.requireEvent(eventId);
		return sortMerchProductsByCategoryAndName(await this.merchProductRepository.list(eventId));
	}

	async getProduct(eventId: string, productId: string): Promise<MerchProduct | null> {
		await this.requireEvent(eventId);
		return await this.merchProductRepository.findById(eventId, productId);
	}

	async listAvailableProducts(eventId: string): Promise<MerchProduct[]> {
		await this.requireEvent(eventId);
		return sortMerchProductsByCategoryAndName(
			await this.merchProductRepository.listAvailable(eventId)
		);
	}

	async createReservation(
		input: CreateMerchReservationInput,
		actor: AuditActor = systemAuditActor
	): Promise<MerchReservation> {
		await this.requireEvent(input.event_id);
		const normalized = normalizeCreateReservationInput(input);
		const reservation = await this.merchReservationRepository.insertReservation(
			normalized,
			this.generateReservationId()
		);

		await this.auditEventService.record({
			...actor,
			event_id: reservation.event_id,
			action: AuditAction.MerchReservationCreated,
			entity_type: AuditEntityType.MerchReservation,
			entity_id: reservation.reservation_id,
			metadata: {
				reservation_id: reservation.reservation_id,
				customer_name: reservation.customer_name,
				email: reservation.email,
				mobile: reservation.mobile,
				amount_total: reservation.amount_total,
				item_count: reservation.items.length,
				items: reservation.items.map((item) => ({
					product_id: item.product_id,
					product_name: item.product_name,
					quantity: item.quantity,
					selected_size: item.selected_size,
					selected_color: item.selected_color
				}))
			}
		});

		try {
			const emailResult =
				await this.notificationService.sendMerchReservationConfirmation(reservation);
			await this.merchReservationRepository.updateConfirmationEmailStatus(
				reservation.event_id,
				reservation.reservation_id,
				emailResult.status === 'SENT'
					? MerchReservationEmailStatus.Sent
					: MerchReservationEmailStatus.Skipped,
				undefined,
				emailResult.providerMessageId
			);
			return {
				...reservation,
				confirmation_email_status:
					emailResult.status === 'SENT'
						? MerchReservationEmailStatus.Sent
						: MerchReservationEmailStatus.Skipped,
				confirmation_email_provider_id: emailResult.providerMessageId
			};
		} catch (caught) {
			const emailError = formatEmailSendError(caught);
			await this.merchReservationRepository.updateConfirmationEmailStatus(
				reservation.event_id,
				reservation.reservation_id,
				MerchReservationEmailStatus.Failed,
				emailError
			);
			this.eventLogger.log('MERCH_RESERVATION_EMAIL_FAILED', reservation.email, {
				event_id: reservation.event_id,
				reservation_id: reservation.reservation_id,
				email: reservation.email,
				error: emailError
			});
			return {
				...reservation,
				confirmation_email_status: MerchReservationEmailStatus.Failed,
				confirmation_email_error: emailError
			};
		}
	}

	async getReservation(eventId: string, reservationId: string): Promise<MerchReservation | null> {
		await this.requireEvent(eventId);
		return await this.merchReservationRepository.findById(eventId, reservationId);
	}

	async listReservations(eventId: string): Promise<MerchReservation[]> {
		await this.requireEvent(eventId);
		return await this.merchReservationRepository.list(eventId);
	}

	private async requireEvent(eventId: string): Promise<void> {
		const event = await this.eventRepository.findById(eventId);
		if (!event) {
			throw new NotFoundError('event not found');
		}
	}

	private async requireProduct(eventId: string, productId: string): Promise<MerchProduct> {
		const product = await this.merchProductRepository.findById(eventId, productId);
		if (!product) {
			throw new NotFoundError('merch product not found');
		}
		return product;
	}

	private generateReservationId(): string {
		return `MR-${this.randomIdGenerator(8)}`;
	}
}

function normalizeCreateProductInput(input: CreateMerchProductInput): CreateMerchProductInput {
	return {
		event_id: normalizeRequiredText(input.event_id, 'event_id'),
		name: normalizeRequiredText(input.name, 'name'),
		description: normalizeText(input.description),
		category: normalizeMerchProductCategory(input.category),
		unit_price: normalizeMoney(input.unit_price, 'unit_price'),
		currency: normalizeText(input.currency || 'EUR').toUpperCase() || 'EUR',
		stock_count: normalizeStock(input.stock_count),
		sizes: normalizeList(input.sizes ?? []),
		colors: normalizeList(input.colors ?? []),
		image_urls: normalizeProductImageUrls(input.image_urls ?? []),
		is_active: input.is_active ?? true
	};
}

function normalizeUpdateProductInput(input: UpdateMerchProductInput): UpdateMerchProductInput {
	const productId = normalizeRequiredText(input.product_id, 'product_id');
	if (!/^[a-zA-Z0-9_-]+$/.test(productId)) {
		throw new ValidationError(
			'product_id can only contain letters, numbers, hyphens, and underscores'
		);
	}

	return {
		product_id: productId,
		name: normalizeRequiredText(input.name, 'name'),
		description: normalizeText(input.description),
		category: normalizeMerchProductCategory(input.category),
		unit_price: normalizeMoney(input.unit_price, 'unit_price'),
		currency: normalizeText(input.currency || 'EUR').toUpperCase() || 'EUR',
		stock_count: normalizeStock(input.stock_count),
		sizes: normalizeList(input.sizes ?? []),
		colors: normalizeList(input.colors ?? []),
		image_urls: normalizeProductImageUrls(input.image_urls ?? []),
		is_active: input.is_active ?? true
	};
}

function normalizeProductImageUrls(imageUrls: string[]): string[] {
	const normalized = normalizeList(imageUrls);
	if (normalized.length > maxImagesPerProduct) {
		throw new ValidationError(`a product can have at most ${maxImagesPerProduct} images`);
	}

	return normalized;
}

function normalizeMerchProductCategory(value: string): string {
	const category = normalizeRequiredText(value, 'category');
	if (!isMerchProductCategory(category)) {
		throw new ValidationError(`category must be one of ${merchProductCategories.join(', ')}`);
	}

	return category;
}

function normalizeCreateReservationInput(
	input: CreateMerchReservationInput
): CreateMerchReservationInput {
	const items = input.items.filter((item) => item.quantity > 0);
	if (items.length < 1) {
		throw new ValidationError('choose at least one merchandise item');
	}
	if (items.length > maxReservationItems) {
		throw new ValidationError(`a reservation can include at most ${maxReservationItems} lines`);
	}

	const email = normalizeRequiredText(input.email, 'email').toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new ValidationError('a valid email is required');
	}

	return {
		event_id: normalizeRequiredText(input.event_id, 'event_id'),
		customer_name: normalizeRequiredText(input.customer_name, 'customer_name'),
		email,
		mobile: normalizeRequiredText(input.mobile, 'mobile'),
		items: items.map((item) => ({
			product_id: normalizeRequiredText(item.product_id, 'product_id'),
			quantity: normalizeQuantity(item.quantity),
			selected_size: normalizeOptionalText(item.selected_size),
			selected_color: normalizeOptionalText(item.selected_color)
		}))
	};
}

function productAuditMetadata(product: MerchProduct) {
	return {
		product_id: product.product_id,
		name: product.name,
		category: product.category,
		unit_price: product.unit_price,
		currency: product.currency,
		stock_count: product.stock_count,
		sizes: product.sizes,
		colors: product.colors,
		image_count: product.image_urls.length,
		is_active: product.is_active
	};
}

function normalizeRequiredText(value: string, label: string): string {
	const normalized = normalizeText(value);
	if (!normalized) {
		throw new ValidationError(`${label} is required`);
	}
	return normalized;
}

function normalizeOptionalText(value: string | undefined): string | undefined {
	const normalized = normalizeText(value ?? '');
	return normalized || undefined;
}

function normalizeText(value: string): string {
	return value.trim().replace(/\s+/g, ' ');
}

function normalizeList(values: string[]): string[] {
	const normalized = values.map(normalizeText).filter(Boolean);
	return Array.from(new Set(normalized));
}

function normalizeMoney(value: number, label: string): number {
	if (!Number.isFinite(value) || value < 0) {
		throw new ValidationError(`${label} must be zero or greater`);
	}
	return Math.round(value * 100) / 100;
}

function normalizeStock(value: number): number {
	if (!Number.isInteger(value) || value < 0) {
		throw new ValidationError('stock_count must be a whole number zero or greater');
	}
	return value;
}

function normalizeQuantity(value: number): number {
	if (!Number.isInteger(value) || value < 1 || value > 99) {
		throw new ValidationError('quantity must be between 1 and 99');
	}
	return value;
}

function formatEmailSendError(caught: unknown): string {
	if (caught instanceof Error) {
		return caught.message;
	}
	return 'email send failed';
}
