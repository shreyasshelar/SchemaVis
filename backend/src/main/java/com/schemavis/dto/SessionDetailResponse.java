package com.schemavis.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Full session state — messages and current diagram")
public record SessionDetailResponse(

        String sessionId,
        Instant createdAt,
        Instant lastActivity,
        String currentDiagram,
        boolean complete,
        List<MessageDto> messages
) {
    @Schema(description = "A single chat message")
    public record MessageDto(
            String id,
            String role,
            String content,
            Instant createdAt,
            int position
    ) {}
}
