package com.schemavis.controller;

import com.schemavis.config.RateLimitConfig;
import com.schemavis.domain.User;
import com.schemavis.dto.*;
import com.schemavis.exception.AppException;
import com.schemavis.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@Tag(name = "Sessions", description = "Create and manage schema chat sessions (projects)")
public class SessionController {

    private final ChatService    chatService;
    private final RateLimitConfig rateLimiter;

    public SessionController(ChatService chatService, RateLimitConfig rateLimiter) {
        this.chatService  = chatService;
        this.rateLimiter  = rateLimiter;
    }

    // ── GET /api/sessions ─────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all schema projects for the current user")
    public ResponseEntity<List<SessionSummaryResponse>> listSessions(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(chatService.listSessions(user.getId()));
    }

    // ── POST /api/sessions ────────────────────────────────────

    @PostMapping
    @Operation(
            summary = "Create a new schema project",
            description = "Creates a session optionally seeded with SQL DDL. " +
                          "The AI immediately responds with an analysis or opening question."
    )
    @ApiResponse(responseCode = "201", description = "Session created")
    @ApiResponse(responseCode = "429", description = "Rate limit exceeded")
    public ResponseEntity<NewSessionResponse> createSession(
            @RequestBody NewSessionRequest request,
            @AuthenticationPrincipal User user,
            HttpServletRequest httpRequest
    ) {
        checkRateLimit(httpRequest);
        NewSessionResponse response = chatService.createSession(
                request.ddl(), request.name(), user.getId(), request.seedDiagram());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── GET /api/sessions/{id} ────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get full session state including message history")
    @ApiResponse(responseCode = "200", description = "Session found")
    @ApiResponse(responseCode = "403", description = "Session belongs to another user")
    @ApiResponse(responseCode = "404", description = "Session not found")
    public ResponseEntity<SessionDetailResponse> getSession(
            @PathVariable String id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(chatService.getSession(id, user.getId()));
    }

    // ── PUT /api/sessions/{id}/name ───────────────────────────

    @PutMapping("/{id}/name")
    @Operation(summary = "Rename a schema project")
    public ResponseEntity<SessionSummaryResponse> renameSession(
            @PathVariable String id,
            @Valid @RequestBody RenameSessionRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(chatService.renameSession(id, request.name(), user.getId()));
    }

    // ── DELETE /api/sessions/{id} ─────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a schema project and all its messages")
    @ApiResponse(responseCode = "204", description = "Session deleted")
    @ApiResponse(responseCode = "403", description = "Session belongs to another user")
    @ApiResponse(responseCode = "404", description = "Session not found")
    public ResponseEntity<Void> deleteSession(
            @PathVariable String id,
            @AuthenticationPrincipal User user
    ) {
        chatService.deleteSession(id, user.getId());
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
