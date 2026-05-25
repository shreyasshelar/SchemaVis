package com.schemavis.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "AI reply to a user message")
public record SendMessageResponse(

        @Schema(description = "Unique message identifier")
        String messageId,

        @Schema(description = "AI response text (diagram tags stripped)")
        String content,

        @Schema(description = "Updated Mermaid erDiagram string — null if diagram unchanged")
        String diagram,

        @Schema(description = "True once the AI signals the schema is fully captured")
        boolean complete
) {}
