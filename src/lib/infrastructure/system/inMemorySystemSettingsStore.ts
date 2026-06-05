/**
 * Purpose:
 * This file provides an in-memory implementation of system settings storage.
 *
 * Why this structure is good:
 * It gives the application a simple settings backend today while preserving a
 * clean seam for a database-backed implementation later.
 */
import type { SystemSettingsStore } from '$lib/application/ports';

/** Module-level state for the current process. */
let newBookingsAllowed = true;

/** Lightweight in-memory settings store used by the system service. */
export class InMemorySystemSettingsStore implements SystemSettingsStore {
	/** Reads the current booking toggle from in-memory state. */
	getNewBookingsAllowed(): boolean {
		return newBookingsAllowed;
	}

	/** Updates the booking toggle in in-memory state. */
	setNewBookingsAllowed(enabled: boolean): void {
		newBookingsAllowed = enabled;
	}
}
