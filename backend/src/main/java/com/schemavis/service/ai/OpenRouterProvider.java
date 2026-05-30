package com.schemavis.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Order(3)
public class OpenRouterProvider extends OpenAiCompatProvider {

    @Value("${ai.openrouter.api-key:}")
    private String apiKey;

    @Value("${ai.openrouter.model:meta-llama/llama-3.1-8b-instruct:free}")
    private String model;

    @Value("${ai.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    public OpenRouterProvider(RestTemplate restTemplate, ObjectMapper objectMapper) {
        super(restTemplate, objectMapper);
    }

    @Override public String getName()    { return "OpenRouter"; }
    @Override protected String getBaseUrl()  { return baseUrl; }
    @Override protected String getApiKey()   { return apiKey; }
    @Override protected String getModel()    { return model; }
}
