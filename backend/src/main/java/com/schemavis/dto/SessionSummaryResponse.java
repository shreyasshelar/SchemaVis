package com.schemavis.dto;

import java.time.Instant;

/** Lightweight session summary for the projects list — no message history. */
public record SessionSummaryResponse(
        String sessionId,
        String name,
        Instant createdAt,
        Instant lastActivity,
        boolean complete,
        boolean hasDiagram,
        int messageCount
) {}
