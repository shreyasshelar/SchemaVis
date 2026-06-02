package com.schemavis.service;

import com.schemavis.domain.Message;
import com.schemavis.domain.Session;
import com.schemavis.dto.*;
import com.schemavis.exception.AppException;
import com.schemavis.repository.SessionRepository;
import com.schemavis.service.ai.FallbackAiService;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    /**
     * "Schema as Memory" context-windowing constants.
     *
     * Below FULL_HISTORY_LIMIT  → send every message verbatim (normal path).
     * At or above the limit     → compress old history: replace it with two
     *   synthetic messages that inject the current diagram as the AI's memory,
     *   then append only the last RECENT_WINDOW real messages.
     *
     * Why this works for SchemaVis:
     *   The ER diagram IS the distilled memory of every design decision.
     *   "Add a users table with email" from message #3 is already encoded in
     *   the diagram — there's no information lost by dropping the raw message.
     *   Context size becomes bounded regardless of conversation length.
     */
    private static final int FULL_HISTORY_LIMIT = 30;  // messages before compression kicks in
    private static final int RECENT_WINDOW       = 8;  // recent messages kept verbatim

    private final SessionRepository  sessionRepository;
    private final FallbackAiService  aiService;
    private final DiagramParserService diagramParser;

    public ChatService(
            SessionRepository sessionRepository,
            FallbackAiService aiService,
            DiagramParserService diagramParser
    ) {
        this.sessionRepository = sessionRepository;
        this.aiService         = aiService;
        this.diagramParser     = diagramParser;
    }

    // ── List sessions for user ─────────────────────────────────

    @Transactional
    public List<SessionSummaryResponse> listSessions(String userId) {
        return sessionRepository.findByUserIdOrderByLastActivityDesc(userId).stream()
                .map(s -> new SessionSummaryResponse(
                        s.getId(),
                        s.getName(),
                        s.getCreatedAt(),
                        s.getLastActivity(),
                        s.isSchemaComplete(),
                        s.getCurrentDiagram() != null,
                        s.getMessages().size()
                ))
                .collect(Collectors.toList());
    }

    // ── Rename session ────────────────────────────────────────

    @Transactional
    public SessionSummaryResponse renameSession(String sessionId, String name, String userId) {
        Session session = requireOwned(sessionId, userId);
        session.setName(name);
        sessionRepository.save(session);
        return new SessionSummaryResponse(
                session.getId(),
                session.getName(),
                session.getCreatedAt(),
                session.getLastActivity(),
                session.isSchemaComplete(),
                session.getCurrentDiagram() != null,
                session.getMessages().size()
        );
    }

    // ── Create session ────────────────────────────────────────

    @Transactional
    public NewSessionResponse createSession(String ddl, String name, String userId,
                                            String seedDiagram) {
        Session session = Session.create(userId, name);

        // Build the opening user message
        String openingMessage = buildOpeningMessage(ddl, seedDiagram);
        session.addMessage(Message.of("user", openingMessage));

        // Get first AI reply
        String rawReply = aiService.generateReply(session.getMessages());
        Message aiMessage = Message.of("assistant", rawReply);
        session.addMessage(aiMessage);

        // Extract diagram and completion state
        String diagram = diagramParser.extractDiagram(rawReply).orElse(null);
        if (diagram != null) session.setCurrentDiagram(diagram);

        boolean complete = diagramParser.isComplete(rawReply);
        session.setSchemaComplete(complete);
        session.touch();

        sessionRepository.save(session);
        log.info("Created session {} name='{}' (ddl={})",
                session.getId(), session.getName(), ddl != null && !ddl.isBlank());

        return new NewSessionResponse(
                session.getId(),
                diagramParser.cleanMessage(rawReply),
                diagram,
                complete,
                session.getName()
        );
    }

    // ── Send message ──────────────────────────────────────────

    @Transactional
    public SendMessageResponse sendMessage(String sessionId, String content, String userId) {
        Session session = requireOwned(sessionId, userId);

        // Persist user message first so it's included in history
        session.addMessage(Message.of("user", content));

        // Build the context window sent to the AI.
        // For short conversations, this is the full history.
        // For long ones, old messages are replaced by the current diagram (see buildContextWindow).
        List<Message> history    = session.getMessages();
        List<Message> aiMessages = buildContextWindow(history, session.getCurrentDiagram());
        String rawReply = aiService.generateReply(aiMessages);

        // Persist AI reply
        Message aiMessage = Message.of("assistant", rawReply);
        session.addMessage(aiMessage);

        // Update diagram if a new one was returned
        String newDiagram = diagramParser.extractDiagram(rawReply).orElse(null);
        if (newDiagram != null) session.setCurrentDiagram(newDiagram);

        boolean complete = diagramParser.isComplete(rawReply);
        session.setSchemaComplete(complete);
        session.touch();

        sessionRepository.save(session);
        log.debug("Message sent in session {}, complete={}", sessionId, complete);

        return new SendMessageResponse(
                aiMessage.getId(),
                diagramParser.cleanMessage(rawReply),
                // Return diagram only if it changed this turn (avoids resending unchanged Mermaid)
                newDiagram,
                complete
        );
    }

    // ── Get session detail ────────────────────────────────────

    @Transactional
    public SessionDetailResponse getSession(String sessionId, String userId) {
        Session session = requireOwned(sessionId, userId);

        List<SessionDetailResponse.MessageDto> dtos = session.getMessages().stream()
                .map(m -> new SessionDetailResponse.MessageDto(
                        m.getId(), m.getRole(), m.getContent(),
                        m.getCreatedAt(), m.getPosition()))
                .toList();

        return new SessionDetailResponse(
                session.getId(),
                session.getName(),
                session.getCreatedAt(),
                session.getLastActivity(),
                session.getCurrentDiagram(),
                session.isSchemaComplete(),
                dtos
        );
    }

    // ── Delete session ────────────────────────────────────────

    @Transactional
    public void deleteSession(String sessionId, String userId) {
        requireOwned(sessionId, userId);
        sessionRepository.deleteById(sessionId);
        log.info("Deleted session {}", sessionId);
    }

    // ── Ownership guard ───────────────────────────────────────

    private Session requireOwned(String sessionId, String userId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> AppException.notFound("Session", sessionId));
        if (userId != null && !userId.equals(session.getUserId())) {
            throw AppException.forbidden("session");
        }
        return session;
    }

    // ── Private helpers ───────────────────────────────────────

    /**
     * Builds the opening user message for a new session.
     *
     * Three cases:
     *  1. seedDiagram provided   → continuing an existing schema (cross-session continuity)
     *  2. ddl provided           → fresh session seeded with SQL DDL
     *  3. nothing provided       → blank-slate guided mode
     */
    private String buildOpeningMessage(String ddl, String seedDiagram) {
        if (seedDiagram != null && !seedDiagram.isBlank()) {
            // Cross-session continuity: inject prior schema so AI picks up exactly where left off
            String ddlSection = (ddl != null && !ddl.isBlank())
                    ? "\n\nAdditionally, here is new DDL to merge into the schema:\n```sql\n" + ddl.trim() + "\n```"
                    : "";
            return """
                    I want to continue working on an existing database schema.
                    Here is the current state of the schema we designed previously:

                    [DIAGRAM]
                    %s
                    [/DIAGRAM]
                    %s
                    Please treat this as our current schema, acknowledge what tables and \
                    relationships already exist, and ask what I'd like to change or add next.
                    """.formatted(seedDiagram.trim(), ddlSection);
        }

        if (ddl != null && !ddl.isBlank()) {
            return """
                    Here is my database DDL:

                    ```sql
                    %s
                    ```

                    Please analyse this schema thoroughly. Identify all tables, columns, data types,
                    primary keys, foreign keys, and relationships. Ask any questions needed to
                    fill gaps and produce a complete ER diagram.
                    """.formatted(ddl.trim());
        }

        return "I want to visualise my database schema as an ER diagram. " +
               "Please guide me through describing it step by step.";
    }

    /**
     * Schema-as-Memory context windowing.
     *
     * For conversations up to FULL_HISTORY_LIMIT messages, returns the full history.
     *
     * Beyond that limit, the older messages are discarded and replaced by two synthetic
     * messages that inject the current diagram as a compact memory anchor:
     *
     *   [user]      "Here is the schema as it stands — all prior decisions are reflected here."
     *   [assistant] "Understood. I have the full schema state and will continue from here."
     *   [... last RECENT_WINDOW real messages ...]
     *
     * This keeps total context size bounded at O(RECENT_WINDOW + diagram_size) regardless
     * of how many turns the conversation has had, while preserving 100% of the semantic
     * knowledge (because every past decision IS the diagram).
     */
    private List<Message> buildContextWindow(List<Message> history, String currentDiagram) {
        if (history.size() <= FULL_HISTORY_LIMIT || currentDiagram == null || currentDiagram.isBlank()) {
            return history;
        }

        log.debug("Context window active: {} messages → compressing to anchor + last {}",
                history.size(), RECENT_WINDOW);

        List<Message> windowed = new ArrayList<>();

        // Synthetic anchor: diagram IS the memory of all prior turns
        windowed.add(Message.of("user",
            "[SCHEMA STATE — represents all design decisions made so far]\n\n" +
            "[DIAGRAM]\n" + currentDiagram.trim() + "\n[/DIAGRAM]\n\n" +
            "This is the complete, up-to-date schema. Please use it as your memory " +
            "of the full conversation history and continue helping me refine it."));

        windowed.add(Message.of("assistant",
            "Understood. I have the full schema state above and will continue " +
            "from where we left off."));

        // Append only the most recent messages verbatim for conversation coherence
        List<Message> recent = history.subList(
                Math.max(0, history.size() - RECENT_WINDOW), history.size());
        windowed.addAll(recent);

        return windowed;
    }
}
