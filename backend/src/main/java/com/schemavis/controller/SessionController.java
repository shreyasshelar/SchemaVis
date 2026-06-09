package com.schemavis.controller;

import com.schemavis.config.RateLimitConfig;
import com.schemavis.domain.User;
import com.schemavis.dto.*;
import com.schemavis.exception.AppException;
import com.schemavis.service.ChatService;
import com.schemavis.service.ProjectService;
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

    private final ChatService     chatService;
    private final ProjectService  projectService;
    private final RateLimitConfig rateLimiter;

    public SessionController(ChatService chatService,
                             ProjectService projectService,
                             RateLimitConfig rateLimiter) {
        this.chatService    = chatService;
        this.projectService = projectService;
        this.rateLimiter    = rateLimiter;
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
                request.ddl(), request.name(), user.getId(),
                request.seedDiagram(), request.projectId());
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

    // ── POST /api/sessions/{id}/complete ─────────────────────
    // Explicitly mark (or un-mark) a session as schema-complete.
    // Only called when the user clicks "Mark complete" in the approval banner.
    // The AI's [COMPLETE] signal alone does NOT call this endpoint.

    @PostMapping("/{id}/complete")
    @Operation(
            summary = "Mark schema as complete (user-confirmed)",
            description = "Sets schemaComplete=true only when the user explicitly approves. " +
                          "Pass complete=false to revert (e.g. user continues refining)."
    )
    @ApiResponse(responseCode = "204", description = "Updated")
    @ApiResponse(responseCode = "403", description = "Session belongs to another user")
    @ApiResponse(responseCode = "404", description = "Session not found")
    public ResponseEntity<Void> markComplete(
            @PathVariable String id,
            @RequestParam(defaultValue = "true") boolean complete,
            @AuthenticationPrincipal User user
    ) {
        chatService.markComplete(id, user.getId(), complete);
        return ResponseEntity.noContent().build();
    }

    // ── PUT /api/sessions/{id}/project ───────────────────────
    // Move a session into a folder, or ungroup it (projectId = null).

    @PutMapping("/{id}/project")
    @Operation(summary = "Move a session to a different folder (or ungroup it)")
    public ResponseEntity<Void> moveToProject(
            @PathVariable String id,
            @RequestBody MoveSessionRequest request,
            @AuthenticationPrincipal User user
    ) {
        projectService.moveSession(id, request.projectId(), user.getId());
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
