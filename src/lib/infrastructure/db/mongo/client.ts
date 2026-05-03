import mongoose from "mongoose";
import { appConfig } from "$lib/infrastructure/config/env.server";
import { logger } from "$lib/infrastructure/logging/logger";

mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 0);

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
