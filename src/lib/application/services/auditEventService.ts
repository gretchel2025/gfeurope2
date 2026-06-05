import type { AuditEventRepository } from '$lib/application/ports';
import type {
	AuditEntityType,
	AuditEvent,
	AuditEventListOptions,
	CreateAuditEventInput
} from '$lib/domain/auditEvent';

type AuditInsertFailureHandler = (caught: unknown, input: CreateAuditEventInput) => void;

const noopFailureHandler: AuditInsertFailureHandler = () => {};

/** Records durable audit events without blocking completed domain actions on insert failure. */
export class AuditEventService {
	constructor(
		private readonly auditEventRepository: AuditEventRepository,
		private readonly handleInsertFailure: AuditInsertFailureHandler = noopFailureHandler
	) {}

	async record(input: CreateAuditEventInput): Promise<void> {
		try {
			await this.auditEventRepository.insert(input);
		} catch (caught) {
			this.handleInsertFailure(caught, input);
		}
	}

	async listByEvent(eventId: string, options: AuditEventListOptions = {}): Promise<AuditEvent[]> {
		return await this.auditEventRepository.listByEvent(eventId, options);
	}

	async listByEntity(
		eventId: string,
		entityType: AuditEntityType,
		entityId: string,
		options: AuditEventListOptions = {}
	): Promise<AuditEvent[]> {
		return await this.auditEventRepository.listByEntity(eventId, entityType, entityId, options);
	}
}
