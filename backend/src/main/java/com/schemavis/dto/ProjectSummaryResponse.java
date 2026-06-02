package com.schemavis.dto;

import java.time.Instant;
import java.util.List;

/** A project folder with its nested sessions. */
public record ProjectSummaryResponse(
        String projectId,
        String name,
        Instant createdAt,
        List<SessionSummaryResponse> sessions
) {}
