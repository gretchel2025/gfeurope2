import type { RequestEvent } from '@sveltejs/kit';
import { auth } from '$lib/infrastructure/auth/authConfig';

export type AppSession = {
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
	};
	user: {
		id: string;
		email: string;
		name: string;
		image?: string | null;
		emailVerified?: boolean;
	};
};

export async function getAuthSession(event: RequestEvent): Promise<AppSession | null> {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	return session as AppSession | null;
}
