package com.schemavis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.schemavis.domain.Message;
import com.schemavis.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Calls the Gemini 2.0 Flash REST API and returns the model's reply.
 *
 * Why REST over an official SDK? There is no official Java SDK for Gemini at
 * this time. Using RestTemplate keeps the dependency footprint minimal and
 * makes it trivial to swap models (one property change).
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    // ── System prompt ─────────────────────────────────────────
    private static final String SYSTEM_PROMPT = """
            You are SchemaVis AI, an expert database schema analyst and ER diagram generator.

            MISSION: Through intelligent conversation, gather a complete picture of a database
            schema and produce accurate, well-structured Mermaid erDiagram output.

            CONVERSATION RULES:
            - If SQL DDL is provided, parse ALL tables, columns, types, constraints immediately.
            - Ask ONE focused question per turn to fill gaps (relationships, cardinalities,
              junction tables, soft-deletes, multi-tenancy, audit columns, enums).
            - Output an updated diagram after every meaningful exchange.
            - Be concise, technically precise, and professional.

            DIAGRAM OUTPUT — wrap every diagram in these exact tags (no exceptions):
            [DIAGRAM]
            erDiagram
                TABLE_NAME {
                    datatype column_name "constraint"
                }
                TABLE1 ||--o{ TABLE2 : "label"
            [/DIAGRAM]

            MERMAID CARDINALITY:
              ||--||   exactly-one to exactly-one
              ||--o{   exactly-one to zero-or-more
              ||--|{   exactly-one to one-or-more
              }o--o{   zero-or-more to zero-or-more

            COLUMN FORMAT:
              int        id         PK
              varchar    name
              int        user_id    FK
              timestamp  created_at

            COMPLETION — when the schema is fully captured, append [COMPLETE] at the end
            of your message (after [/DIAGRAM]).
            """;

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Sends the full conversation history to Gemini and returns the model reply.
     *
     * @param messages ordered list of messages (user + assistant alternating)
     * @return raw model text including any [DIAGRAM] blocks
     */
    public String generateReply(List<Message> messages) {
        String url = baseUrl + "/" + model + ":generateContent?key=" + apiKey;
        String requestBody = buildRequest(messages);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return parseReply(response.getBody());

        } catch (HttpClientErrorException e) {
            log.error("Gemini client error {} — {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw switch (e.getStatusCode().value()) {
                case 400 -> AppException.aiUnavailable("Invalid request — check API key format");
                case 403 -> AppException.aiUnavailable("Invalid API key — update GEMINI_API_KEY");
                case 429 -> AppException.aiUnavailable("Rate limit hit on free tier — wait 60 s");
                default  -> AppException.aiUnavailable("HTTP " + e.getStatusCode());
            };
        } catch (HttpServerErrorException e) {
            log.error("Gemini server error {}", e.getStatusCode());
            throw AppException.aiUnavailable("Gemini service returned " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini", e);
            throw AppException.aiUnavailable(e.getMessage());
        }
    }

    // ── JSON builders ─────────────────────────────────────────

    private String buildRequest(List<Message> messages) {
        try {
            ObjectNode root = objectMapper.createObjectNode();

            // System instruction
            ObjectNode sysInstr = objectMapper.createObjectNode();
            ArrayNode sysParts = objectMapper.createArrayNode();
            sysParts.addObject().put("text", SYSTEM_PROMPT);
            sysInstr.set("parts", sysParts);
            root.set("system_instruction", sysInstr);

            // Conversation history
            ArrayNode contents = objectMapper.createArrayNode();
            for (Message msg : messages) {
                ObjectNode content = objectMapper.createObjectNode();
                // Gemini uses "model" not "assistant"
                content.put("role", "assistant".equals(msg.getRole()) ? "model" : "user");
                ArrayNode parts = objectMapper.createArrayNode();
                parts.addObject().put("text", msg.getContent());
                content.set("parts", parts);
                contents.add(content);
            }
            root.set("contents", contents);

            // Generation config
            ObjectNode genConfig = objectMapper.createObjectNode();
            genConfig.put("temperature", 0.3);
            genConfig.put("maxOutputTokens", 2048);
            genConfig.put("topP", 0.9);
            root.set("generationConfig", genConfig);

            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build Gemini request JSON", e);
        }
    }

    private String parseReply(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty()) {
                log.warn("Empty candidates in Gemini response: {}", responseBody);
                return "I couldn't generate a response. Please try again.";
            }
            return candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", responseBody);
            throw AppException.aiUnavailable("Malformed response from Gemini");
        }
    }
}
