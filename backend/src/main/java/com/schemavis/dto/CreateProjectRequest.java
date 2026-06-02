package com.schemavis.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request body for creating or renaming a project folder")
public record CreateProjectRequest(

        @Schema(description = "Display name for the folder", example = "E-Commerce")
        String name
) {}
