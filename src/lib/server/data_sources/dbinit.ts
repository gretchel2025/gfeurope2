import { env } from '$env/dynamic/private'
import mongoose from 'mongoose';

mongoose.set("bufferCommands", false)
mongoose.set("bufferTimeoutMS", 0)

const MONGO_URI = env.MONGO_URI
const MONGO_DB_CONNECT_TIMEOUT_MS = Number.parseInt(env.MONGO_DB_CONNECT_TIMEOUT_MS ?? "5000", 10)

export const connectDB = async (): Promise<boolean> => {
    console.log(`[INFO] connecting to db...`);

    if (!MONGO_URI) {
        console.error("[ERROR] failed connection to DB: MONGO_URI is not configured")
        return false
    }

    try {
        const conn = await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: Number.isFinite(MONGO_DB_CONNECT_TIMEOUT_MS) ? MONGO_DB_CONNECT_TIMEOUT_MS : 5000
        });
        console.info(`[INFO] successfully connected to mongoDB: ${conn.connection.name}`);
        return true
    } catch (error) {
        console.error(`[ERROR] failed connection to DB`, error);
        return false
    }
};
