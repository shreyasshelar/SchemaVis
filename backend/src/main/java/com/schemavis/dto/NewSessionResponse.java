package com.schemavis.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response after creating a new session — includes first AI message and initial diagram")
public record NewSessionResponse(

        @Schema(description = "Unique session identifier (UUID)")
        String sessionId,

        @Schema(description = "First AI message — asks questions or acknowledges DDL")
        String message,

        @Schema(description = "Mermaid erDiagram string — null if not yet generated")
        String diagram,

        @Schema(description = "True once the AI signals the schema is fully captured")
        boolean complete,

        @Schema(description = "Human-friendly project name")
        String name
) {}
