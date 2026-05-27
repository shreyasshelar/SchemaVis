package com.schemavis.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email(message = "Must be a valid email") @NotBlank String email,
        @NotBlank @Size(min = 8, max = 100, message = "Password must be 8–100 characters") String password,
        @NotBlank @Size(min = 2, max = 50, message = "Display name must be 2–50 characters") String displayName
) {}
