package com.schemavis.exception;

import org.springframework.http.HttpStatus;

/**
 * Domain-level exception that carries an HTTP status.
 * The GlobalExceptionHandler turns this into a consistent JSON error body.
 */
public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AppException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode()       { return code; }

    // ── Factory shorthands ────────────────────────────────────
    public static AppException notFound(String resource, String id) {
        return new AppException(HttpStatus.NOT_FOUND, "NOT_FOUND",
                resource + " not found: " + id);
    }

    public static AppException aiUnavailable(String detail) {
        return new AppException(HttpStatus.SERVICE_UNAVAILABLE, "AI_UNAVAILABLE",
                "AI service error: " + detail);
    }

    public static AppException rateLimited() {
        return new AppException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                "Too many requests — please slow down.");
    }

    public static AppException unauthorized(String message) {
        return new AppException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
    }

    public static AppException forbidden(String resource) {
        return new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN",
                "Access denied to " + resource);
    }

    public static AppException conflict(String message) {
        return new AppException(HttpStatus.CONFLICT, "CONFLICT", message);
    }
}
