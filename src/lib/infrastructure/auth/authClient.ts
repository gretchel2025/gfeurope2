import { createBrowserClient } from '@supabase/ssr';

export type SupabaseBrowserConfig = {
	url: string;
	publishableKey: string;
};

export function hasSupabaseBrowserConfig(
	config: SupabaseBrowserConfig | null | undefined
): boolean {
	return Boolean(config?.url && config.publishableKey);
}

export function createAuthClient(config: SupabaseBrowserConfig | null | undefined) {
	if (!config?.url || !config.publishableKey) {
		throw new Error('Supabase auth is not configured');
	}

	return createBrowserClient(config.url, config.publishableKey);
}

export async function signOutCurrentUser(
	config: SupabaseBrowserConfig | null | undefined
): Promise<void> {
	const supabase = createAuthClient(config);
	await supabase.auth.signOut();
}
