package com.schemavis.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request body for creating a new schema chat session")
public record NewSessionRequest(

        @Schema(description = "Optional SQL DDL to seed the session with",
                example = "CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(255));")
        String ddl,

        @Schema(description = "Human-friendly project name", example = "E-Commerce DB")
        String name,

        @Schema(description = "Optional Mermaid erDiagram from a previous session — lets the AI "
                            + "continue from where you left off without replaying the full history",
                example = "erDiagram\n  users { int id PK\n  varchar email }")
        String seedDiagram
) {}
