package com.schemavis.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Order(2)
public class GroqProvider extends OpenAiCompatProvider {

    @Value("${ai.groq.api-key:}")
    private String apiKey;

    @Value("${ai.groq.model:llama-3.3-70b-versatile}")
    private String model;

    @Value("${ai.groq.base-url:https://api.groq.com/openai/v1}")
    private String baseUrl;

    public GroqProvider(RestTemplate restTemplate, ObjectMapper objectMapper) {
        super(restTemplate, objectMapper);
    }

    @Override public String getName()    { return "Groq"; }
    @Override protected String getBaseUrl()  { return baseUrl; }
    @Override protected String getApiKey()   { return apiKey; }
    @Override protected String getModel()    { return model; }
}
