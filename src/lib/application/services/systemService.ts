/**
 * Purpose:
 * This service owns simple system-level toggles.
 *
 * Why this structure is good:
 * It keeps global runtime settings behind a small application API instead of
 * letting routes reach directly into storage details.
 */
import type { SystemSettingsStore } from '$lib/application/ports';

/** Application facade for mutable system settings. */
export class SystemService {
	constructor(private readonly store: SystemSettingsStore) {}

	/** Reads whether new public bookings are currently allowed. */
	getNewBookingsAllowed(): boolean {
		return this.store.getNewBookingsAllowed();
	}

	/** Enables or disables new public bookings. */
	setNewBookingsAllowed(enabled: boolean): void {
		this.store.setNewBookingsAllowed(enabled);
	}
}
