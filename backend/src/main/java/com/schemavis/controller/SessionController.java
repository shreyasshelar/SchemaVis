package com.schemavis.controller;

import com.schemavis.config.RateLimitConfig;
import com.schemavis.dto.NewSessionRequest;
import com.schemavis.dto.NewSessionResponse;
import com.schemavis.dto.SessionDetailResponse;
import com.schemavis.exception.AppException;
import com.schemavis.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@Tag(name = "Sessions", description = "Create and manage schema chat sessions")
public class SessionController {

    private final ChatService chatService;
    private final RateLimitConfig rateLimiter;

    public SessionController(ChatService chatService, RateLimitConfig rateLimiter) {
        this.chatService = chatService;
        this.rateLimiter = rateLimiter;
    }

    // ── POST /api/sessions ────────────────────────────────────

    @PostMapping
    @Operation(
            summary = "Create a new session",
            description = "Creates a session, optionally seeded with SQL DDL. " +
                          "The AI immediately responds with an analysis or opening question."
    )
    @ApiResponse(responseCode = "201", description = "Session created — first AI message returned")
    @ApiResponse(responseCode = "429", description = "Rate limit exceeded")
    public ResponseEntity<NewSessionResponse> createSession(
            @RequestBody NewSessionRequest request,
            HttpServletRequest httpRequest
    ) {
        checkRateLimit(httpRequest);
        NewSessionResponse response = chatService.createSession(request.ddl());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── GET /api/sessions/{id} ────────────────────────────────

    @GetMapping("/{id}")
    @Operation(
            summary = "Get session state",
            description = "Returns the full message history and current diagram for a session."
    )
    @ApiResponse(responseCode = "200", description = "Session found")
    @ApiResponse(responseCode = "404", description = "Session not found")
    public ResponseEntity<SessionDetailResponse> getSession(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getSession(id));
    }

    // ── DELETE /api/sessions/{id} ─────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a session and all its messages")
    @ApiResponse(responseCode = "204", description = "Session deleted")
    @ApiResponse(responseCode = "404", description = "Session not found")
    public ResponseEntity<Void> deleteSession(@PathVariable String id) {
        chatService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    // ── Rate limit helper ─────────────────────────────────────

    private void checkRateLimit(HttpServletRequest request) {
        String ip = extractClientIp(request);
        if (!rateLimiter.tryConsume(ip)) {
            throw AppException.rateLimited();
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
