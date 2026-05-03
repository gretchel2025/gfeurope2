import type { SystemSettingsStore } from "$lib/application/ports";

export class SystemService {
    constructor(private readonly store: SystemSettingsStore) {}

    getNewBookingsAllowed(): boolean {
        return this.store.getNewBookingsAllowed();
    }

    setNewBookingsAllowed(enabled: boolean): void {
        this.store.setNewBookingsAllowed(enabled);
    }
}
