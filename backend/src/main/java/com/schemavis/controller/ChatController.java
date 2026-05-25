package com.schemavis.controller;

import com.schemavis.config.RateLimitConfig;
import com.schemavis.dto.SendMessageRequest;
import com.schemavis.dto.SendMessageResponse;
import com.schemavis.exception.AppException;
import com.schemavis.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
@Tag(name = "Chat", description = "Send messages within a session")
public class ChatController {

    private final ChatService chatService;
    private final RateLimitConfig rateLimiter;

    public ChatController(ChatService chatService, RateLimitConfig rateLimiter) {
        this.chatService = chatService;
        this.rateLimiter = rateLimiter;
    }

    // ── POST /api/sessions/{id}/messages ──────────────────────

    @PostMapping("/{id}/messages")
    @Operation(
            summary = "Send a message",
            description = "Sends a user message and returns the AI reply. " +
                          "If the AI updated the ER diagram, 'diagram' contains the new Mermaid string; " +
                          "otherwise it is null (client should keep the last known diagram). " +
                          "'complete' becomes true when the AI signals the schema is fully captured."
    )
    @ApiResponse(responseCode = "200", description = "AI reply returned")
    @ApiResponse(responseCode = "400", description = "Validation error — content blank or too long")
    @ApiResponse(responseCode = "404", description = "Session not found")
    @ApiResponse(responseCode = "429", description = "Rate limit exceeded")
    @ApiResponse(responseCode = "503", description = "AI service unavailable")
    public ResponseEntity<SendMessageResponse> sendMessage(
            @PathVariable String id,
            @Valid @RequestBody SendMessageRequest request,
            HttpServletRequest httpRequest
    ) {
        checkRateLimit(httpRequest);
        return ResponseEntity.ok(chatService.sendMessage(id, request.content()));
    }

    // ── Rate limit helper ─────────────────────────────────────

    private void checkRateLimit(HttpServletRequest httpRequest) {
        String ip = extractClientIp(httpRequest);
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
