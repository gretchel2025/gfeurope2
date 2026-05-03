import { dev } from "$app/environment";
import fs from "node:fs";
import path from "node:path";

const fileEnv = loadDotEnvFile(path.resolve(process.cwd(), ".env"));

export type AppConfig = {
    dev: boolean;
    appBaseUrl: string;
    mongoUri: string;
    mongoConnectTimeoutMs: number;
    authSecret: string;
    googleClientId: string;
    googleClientSecret: string;
    localAdminEmails: string[];
    bootstrap: {
        standardTicketsInitialAvailable: number;
        vipTicketsInitialAvailable: number;
        youthTicketsInitialAvailable: number;
    };
    integrations: {
        postmarkApiKey: string;
        cloudinaryCloudName: string;
        cloudinaryApiKey: string;
        cloudinaryApiSecret: string;
    };
};

export const appConfig: AppConfig = {
    dev,
    appBaseUrl: readEnv("APP_BASE_URL") || "http://localhost:5173",
    mongoUri: readEnv("MONGO_URI") || "",
    mongoConnectTimeoutMs: parsePositiveInt(readEnv("MONGO_DB_CONNECT_TIMEOUT_MS"), 5000),
    authSecret: readEnv("AUTH_SECRET") || (dev ? "local-dev-auth-secret-change-me" : ""),
    googleClientId: readEnv("GOOGLE_ID") || "",
    googleClientSecret: readEnv("GOOGLE_SECRET") || "",
    localAdminEmails: parseEmailList(readEnv("LOCAL_ADMIN_EMAILS")),
    bootstrap: {
        standardTicketsInitialAvailable: parsePositiveInt(readEnv("STANDARD_TICKETS_INITIAL_AVAILABLE"), 100),
        vipTicketsInitialAvailable: parsePositiveInt(readEnv("VIP_TICKETS_INITIAL_AVAILABLE"), 50),
        youthTicketsInitialAvailable: parsePositiveInt(readEnv("YOUTH_TICKETS_INITIAL_AVAILABLE"), 25),
    },
    integrations: {
        postmarkApiKey: readEnv("MY_POSTMARK_API_KEY") || "",
        cloudinaryCloudName: readEnv("CLOUDINARY_CLOUD_NAME") || "",
        cloudinaryApiKey: readEnv("CLOUDINARY_API_KEY") || "",
        cloudinaryApiSecret: readEnv("CLOUDINARY_API_SECRET") || "",
    },
};

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

function parseEmailList(raw: string | undefined): string[] {
    if (!raw) {
        return [];
    }

    return raw
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

function readEnv(key: string): string | undefined {
    return process.env[key] ?? fileEnv[key];
}

function loadDotEnvFile(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, "utf8");
    const result: Record<string, string> = {};

    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            continue;
        }

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) {
            continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        let value = trimmed.slice(separatorIndex + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        result[key] = value;
    }

    return result;
}
