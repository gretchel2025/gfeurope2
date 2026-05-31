import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { SupabaseBrowserConfig } from '$lib/infrastructure/auth/authClient';
import type { PublicSession } from '$lib/infrastructure/auth/session';

// See https://kit.svelte.dev/docs/types#app for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
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
