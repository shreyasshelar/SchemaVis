package com.schemavis.service.ai;

import com.schemavis.domain.Message;
import com.schemavis.exception.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Tries AI providers in @Order sequence: Gemini → Groq → OpenRouter.
 * Any RuntimeException from a provider causes fallback to the next one.
 * Throws aiUnavailable only when all providers are exhausted.
 */
@Service
public class FallbackAiService {

    private static final Logger log = LoggerFactory.getLogger(FallbackAiService.class);

    private final List<AiProvider> providers;

    /** Spring injects all AiProvider beans in @Order sequence. */
    public FallbackAiService(List<AiProvider> providers) {
        this.providers = providers;
        log.info("AI provider chain: {}",
                providers.stream().map(AiProvider::getName).toList());
    }

    public String generateReply(List<Message> messages) {
        RuntimeException lastError = null;

        for (AiProvider provider : providers) {
            try {
                String reply = provider.generateReply(messages);
                if (lastError != null) {
                    log.info("Recovered via {}", provider.getName());
                }
                return reply;
            } catch (RuntimeException e) {
                log.warn("Provider {} failed ({}), trying next", provider.getName(), e.getMessage());
                lastError = e;
            }
        }

        log.error("All AI providers exhausted");
        throw AppException.aiUnavailable("All AI providers are currently unavailable — try again later");
    }
}
