export class AppError extends Error {
    readonly code: string;
    readonly status: number;

    constructor(message: string, status = 500, code = "APP_ERROR") {
        super(message);
        this.name = new.target.name;
        this.status = status;
        this.code = code;
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, "VALIDATION_ERROR");
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401, "UNAUTHORIZED");
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404, "NOT_FOUND");
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, "CONFLICT");
    }
}

export class InfrastructureError extends AppError {
    constructor(message: string, status = 503) {
        super(message, status, "INFRASTRUCTURE_ERROR");
    }
}
