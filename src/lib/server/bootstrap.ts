import { env } from "$env/dynamic/private";
import * as counters from "$lib/server/data_sources/counters";
import * as users from "$lib/server/data_sources/users";
import type { User } from "$lib/entities/models";

const DEFAULT_STANDARD_AVAILABLE = parsePositiveInt(env.STANDARD_TICKETS_INITIAL_AVAILABLE, 100);
const DEFAULT_VIP_AVAILABLE = parsePositiveInt(env.VIP_TICKETS_INITIAL_AVAILABLE, 50);
const DEFAULT_YOUTH_AVAILABLE = parsePositiveInt(env.YOUTH_TICKETS_INITIAL_AVAILABLE, 25);

const COUNTER_DEFAULTS = [
    { id: "standard_tickets", available: DEFAULT_STANDARD_AVAILABLE },
    { id: "vip_tickets", available: DEFAULT_VIP_AVAILABLE },
    { id: "youth_tickets", available: DEFAULT_YOUTH_AVAILABLE },
];

export async function ensureRequiredData(): Promise<void> {
    await ensureCounters();
    await ensureLocalAdminUsers();
}

async function ensureCounters(): Promise<void> {
    for (const counter of COUNTER_DEFAULTS) {
        const existing = await counters.GetByID(counter.id);
        if (existing) {
            continue;
        }

        await counters.Create(counter.id, {
            available: counter.available,
            reserved: 0,
            sold: 0,
        });
        console.log(`[INFO] bootstrap: created counter ${counter.id} with available=${counter.available}`);
    }
}

async function ensureLocalAdminUsers(): Promise<void> {
    const emails = parseEmailList(env.LOCAL_ADMIN_EMAILS);
    for (const email of emails) {
        const existing = await users.GetByID(email);
        if (existing) {
            continue;
        }

        const user: User = {
            _id: email,
            roles: ["admin", "superuser"],
        };
        await users.Insert(user);
        console.log(`[INFO] bootstrap: created local admin user ${email}`);
    }
}

function parseEmailList(raw: string | undefined): string[] {
    if (!raw) {
        return [];
    }

    return raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    if (!raw) {
        return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return fallback;
    }

    return parsed;
}
