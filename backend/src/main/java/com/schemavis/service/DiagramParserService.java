package com.schemavis.service;

import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts and strips the [DIAGRAM]...[/DIAGRAM] block from raw AI responses.
 *
 * Keeping this in its own service means the parsing logic is testable in
 * isolation and can be evolved (e.g. validate Mermaid syntax) without
 * touching ChatService.
 */
@Service
public class DiagramParserService {

    private static final Pattern DIAGRAM_PATTERN =
            Pattern.compile("\\[DIAGRAM\\](.*?)\\[/DIAGRAM\\]", Pattern.DOTALL);

    private static final String COMPLETE_MARKER = "[COMPLETE]";

    /**
     * Extracts the Mermaid diagram string if present.
     *
     * @param rawResponse full AI response text
     * @return diagram code without the [DIAGRAM] tags, or empty if not found
     */
    public Optional<String> extractDiagram(String rawResponse) {
        Matcher m = DIAGRAM_PATTERN.matcher(rawResponse);
        if (m.find()) {
            return Optional.of(m.group(1).trim());
        }
        return Optional.empty();
    }

    /**
     * Returns the AI message text with all diagram blocks and markers removed,
     * ready for display in the chat panel.
     */
    public String cleanMessage(String rawResponse) {
        return rawResponse
                .replaceAll("\\[DIAGRAM\\][\\s\\S]*?\\[/DIAGRAM\\]", "")
                .replace(COMPLETE_MARKER, "")
                .trim();
    }

    /**
     * Returns true if the AI has flagged the schema as fully captured.
     */
    public boolean isComplete(String rawResponse) {
        return rawResponse.contains(COMPLETE_MARKER);
    }
}
