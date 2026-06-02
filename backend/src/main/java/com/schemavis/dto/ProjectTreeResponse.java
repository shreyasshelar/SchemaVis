package com.schemavis.dto;

import java.util.List;

/** Full sidebar tree: folders with their sessions + ungrouped sessions. */
public record ProjectTreeResponse(
        List<ProjectSummaryResponse> folders,
        List<SessionSummaryResponse> ungrouped
) {}
