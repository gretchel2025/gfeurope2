/**
 * Purpose:
 * This file defines the application-level error types used by services.
 *
 * Why this structure is good:
 * Keeping app errors in one place lets the application layer describe failures
 * without depending on SvelteKit or Mongo details. Routes can translate these
 * errors into HTTP responses at the edge.
 */
export class AppError extends Error {
    readonly code: string;
    readonly status: number;

    /** Base error for failures the application layer wants to classify. */
    constructor(message: string, status = 500, code = "APP_ERROR") {
        super(message);
        this.name = new.target.name;
        this.status = status;
        this.code = code;
    }
}

/** Raised when user input or a state transition is invalid. */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, "VALIDATION_ERROR");
    }
}

/** Raised when a signed-in user is missing or lacks required access. */
export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401, "UNAUTHORIZED");
    }
}

/** Raised when an expected domain record cannot be found. */
export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404, "NOT_FOUND");
    }
}

/** Raised when the request conflicts with the current state of the system. */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, "CONFLICT");
    }
}

/** Raised when an external dependency or persistence layer fails. */
export class InfrastructureError extends AppError {
    constructor(message: string, status = 503) {
        super(message, status, "INFRASTRUCTURE_ERROR");
    }
}
