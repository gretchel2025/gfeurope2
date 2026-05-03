/**
 * Purpose:
 * This file exports the shared process logger instance.
 *
 * Why this structure is good:
 * Having one logger instance avoids ad hoc console logging and makes it easier
 * to standardize formatting and destinations later.
 */
import pino from "pino";

/** Shared logger used across infrastructure and bootstrap code. */
export const logger = pino({});
