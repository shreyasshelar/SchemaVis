package com.schemavis.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Move a session to a different folder (or ungroup it)")
public record MoveSessionRequest(

        @Schema(description = "Target project folder ID, or null to ungroup the session")
        String projectId
) {}
