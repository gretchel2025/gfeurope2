import type { RequestEvent } from '@sveltejs/kit';
import { AuditActorType, type AuditActor } from '$lib/domain/auditEvent';
import { getAuthSession } from '$lib/infrastructure/auth/session';

export function publicRequestAuditActor(email: string): AuditActor {
	return {
		actor_type: AuditActorType.Public,
		actor_id: null,
		actor_email: email
	};
}

export async function adminRequestAuditActor(event: RequestEvent): Promise<AuditActor> {
	const session = await getAuthSession(event);
	return {
		actor_type: AuditActorType.Admin,
		actor_id: session?.user.id ?? null,
		actor_email: session?.user.email ?? null
	};
}
