package com.schemavis.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.schemavis.domain.Message;
import com.schemavis.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Shared base for any OpenAI-compatible provider (Groq, OpenRouter, etc.).
 * Subclasses supply name, baseUrl, apiKey, and model.
 */
public abstract class OpenAiCompatProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatProvider.class);

    protected final RestTemplate restTemplate;
    protected final ObjectMapper objectMapper;

    protected OpenAiCompatProvider(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    protected abstract String getBaseUrl();
    protected abstract String getApiKey();
    protected abstract String getModel();

    @Override
    public String generateReply(List<Message> messages) {
        String url    = getBaseUrl() + "/chat/completions";
        String body   = buildRequest(messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(getApiKey());
        // OpenRouter requires this header to identify the caller
        headers.set("HTTP-Referer", "https://schemavis.shreyasshelar.uk");
        headers.set("X-Title",      "SchemaVis");

        try {
            ResponseEntity<String> resp =
                restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
            return parseReply(resp.getBody());
        } catch (HttpClientErrorException e) {
            log.warn("{} error {} — {}", getName(), e.getStatusCode(), e.getResponseBodyAsString());
            throw AppException.aiUnavailable(getName() + " HTTP " + e.getStatusCode().value());
        } catch (Exception e) {
            log.warn("{} unexpected error: {}", getName(), e.getMessage());
            throw AppException.aiUnavailable(getName() + ": " + e.getMessage());
        }
    }

    private String buildRequest(List<Message> messages) {
        try {
            ObjectNode root     = objectMapper.createObjectNode();
            ArrayNode  msgArray = objectMapper.createArrayNode();

            // System message first
            msgArray.addObject()
                    .put("role",    "system")
                    .put("content", SystemPrompt.TEXT);

            for (Message m : messages) {
                msgArray.addObject()
                        .put("role",    m.getRole())   // "user" / "assistant"
                        .put("content", m.getContent());
            }

            root.put("model",       getModel());
            root.set("messages",    msgArray);
            root.put("temperature", 0.3);
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build " + getName() + " request", e);
        }
    }

    private String parseReply(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            return root.path("choices").get(0)
                       .path("message").path("content").asText();
        } catch (Exception e) {
            log.error("{} malformed response: {}", getName(), body);
            throw AppException.aiUnavailable(getName() + ": malformed response");
        }
    }
}
