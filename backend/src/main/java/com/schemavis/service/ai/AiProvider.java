package com.schemavis.service.ai;

import com.schemavis.domain.Message;
import java.util.List;

/**
 * Abstraction over any LLM provider.
 * Implementations: GeminiService → GroqProvider → OpenRouterProvider (fallback order).
 */
public interface AiProvider {

    /** Human-readable name used in logs. */
    String getName();

    /**
     * Generate an AI reply from the full conversation history.
     * Throws any RuntimeException on rate-limit or unavailability
     * so FallbackAiService can try the next provider.
     */
    String generateReply(List<Message> messages);
}
