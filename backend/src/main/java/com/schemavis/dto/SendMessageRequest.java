package com.schemavis.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "A chat message sent by the user")
public record SendMessageRequest(

        @NotBlank(message = "Message content must not be blank")
        @Size(max = 8000, message = "Message must be under 8 000 characters")
        @Schema(description = "The user's message text", example = "One user can have many orders")
        String content
) {}
