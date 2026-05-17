/**
 * Purpose:
 * This file owns Mongo connection setup.
 *
 * Why this structure is good:
 * Database connection policy belongs in infrastructure. Centralizing it here
 * keeps timeouts, logging, and connection behavior consistent across the app.
 */
import mongoose from "mongoose";
import { appConfig } from "$lib/infrastructure/config/env.server";
import { logger } from "$lib/infrastructure/logging/logger";

/** Disables Mongoose buffering so missing connections fail fast instead of hanging. */
mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 0);

/** Connects to Mongo and returns a boolean so startup code can degrade gracefully. */
export async function connectMongo(): Promise<boolean> {
    logger.info("[INFO] connecting to db...");

    if (!appConfig.mongoUri) {
        logger.error("[ERROR] failed connection to DB: MONGO_URI is not configured");
        return false;
    }

    try {
        const conn = await mongoose.connect(appConfig.mongoUri, {
            serverSelectionTimeoutMS: appConfig.mongoConnectTimeoutMs,
        });
        logger.info(`[INFO] successfully connected to mongoDB: ${conn.connection.name}`);
        return true;
    } catch (error) {
        logger.error({ error }, "[ERROR] failed connection to DB");
        return false;
    }
}
