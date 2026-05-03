import type { SystemSettingsStore } from "$lib/application/ports";

let newBookingsAllowed = true;

export class InMemorySystemSettingsStore implements SystemSettingsStore {
    getNewBookingsAllowed(): boolean {
        return newBookingsAllowed;
    }

    setNewBookingsAllowed(enabled: boolean): void {
        newBookingsAllowed = enabled;
    }
}
