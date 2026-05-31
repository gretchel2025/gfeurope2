import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { SupabaseBrowserConfig } from '$lib/infrastructure/auth/authClient';
import type { PublicSession } from '$lib/infrastructure/auth/session';

// See https://kit.svelte.dev/docs/types#app for information about these interfaces
declare global {
	interface Window {
		__grandfeastLastClientError?: {
			type?: string;
			name?: string;
			message?: string;
			path?: string;
			timestamp?: string;
			filename?: string;
			lineno?: number;
			colno?: number;
			resource?: string;
			stack?: string;
			userAgent?: string;
		};
	}

	namespace App {
		interface Error {
			message: string;
			code?: string;
			name?: string;
			path?: string;
			stack?: string;
			cause?: string;
			routeId?: string | null;
			url?: string;
			userAgent?: string;
			timestamp?: string;
		}
		interface Locals {
			supabase?: SupabaseClient;
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
		}
		interface PageData {
			session?: PublicSession | null;
			supabaseAuth?: SupabaseBrowserConfig;
		}
		// interface Platform {}
	}
}

export {};
