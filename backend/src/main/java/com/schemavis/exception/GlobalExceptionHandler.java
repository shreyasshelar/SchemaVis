package com.schemavis.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── Domain exceptions ─────────────────────────────────────
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorBody> handleApp(AppException ex) {
        log.warn("AppException [{}]: {}", ex.getCode(), ex.getMessage());
        return ResponseEntity.status(ex.getStatus())
                .body(new ErrorBody(ex.getCode(), ex.getMessage(), null));
    }

    // ── Validation errors ─────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorBody> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult()
                .getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid",
                        (a, b) -> a
                ));
        return ResponseEntity.badRequest()
                .body(new ErrorBody("VALIDATION_ERROR", "Request validation failed", fieldErrors));
    }

    // ── Catch-all ─────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorBody> handleAll(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorBody("INTERNAL_ERROR", "An unexpected error occurred", null));
    }

    // ── Error response shape ──────────────────────────────────
    public record ErrorBody(
            String code,
            String message,
            Object details,
            Instant timestamp
    ) {
        public ErrorBody(String code, String message, Object details) {
            this(code, message, details, Instant.now());
        }
    }
}
