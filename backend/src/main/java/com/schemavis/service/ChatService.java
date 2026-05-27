package com.schemavis.service;

import com.schemavis.domain.Message;
import com.schemavis.domain.Session;
import com.schemavis.dto.*;
import com.schemavis.exception.AppException;
import com.schemavis.repository.SessionRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Orchestrates the full chat → AI → diagram pipeline.
 *
 * Responsibilities:
 *  1. Manage Session lifecycle (create, fetch, delete)
 *  2. Persist user and AI messages
 *  3. Delegate AI generation to GeminiService
 *  4. Parse diagram and completion markers via DiagramParserService
 *  5. Map domain objects to DTOs
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final SessionRepository sessionRepository;
    private final GeminiService geminiService;
    private final DiagramParserService diagramParser;

    public ChatService(
            SessionRepository sessionRepository,
            GeminiService geminiService,
            DiagramParserService diagramParser
    ) {
        this.sessionRepository = sessionRepository;
        this.geminiService = geminiService;
        this.diagramParser = diagramParser;
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
    public NewSessionResponse createSession(String ddl, String name, String userId) {
        Session session = Session.create(userId, name);

        // Build the opening user message
        String openingMessage = buildOpeningMessage(ddl);
        session.addMessage(Message.of("user", openingMessage));

        // Get first AI reply
        String rawReply = geminiService.generateReply(session.getMessages());
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

        // Persist user message
        session.addMessage(Message.of("user", content));

        // Call AI with full history
        List<Message> history = session.getMessages();
        String rawReply = geminiService.generateReply(history);

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

    private String buildOpeningMessage(String ddl) {
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
}
