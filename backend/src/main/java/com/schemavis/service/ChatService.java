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

    // ── Create session ────────────────────────────────────────

    @Transactional
    public NewSessionResponse createSession(String ddl) {
        Session session = Session.create();

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
        log.info("Created session {} (ddl={})", session.getId(), ddl != null && !ddl.isBlank());

        return new NewSessionResponse(
                session.getId(),
                diagramParser.cleanMessage(rawReply),
                diagram,
                complete
        );
    }

    // ── Send message ──────────────────────────────────────────

    @Transactional
    public SendMessageResponse sendMessage(String sessionId, String content) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> AppException.notFound("Session", sessionId));

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
    public SessionDetailResponse getSession(String sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> AppException.notFound("Session", sessionId));

        List<SessionDetailResponse.MessageDto> dtos = session.getMessages().stream()
                .map(m -> new SessionDetailResponse.MessageDto(
                        m.getId(), m.getRole(), m.getContent(),
                        m.getCreatedAt(), m.getPosition()))
                .toList();

        return new SessionDetailResponse(
                session.getId(),
                session.getCreatedAt(),
                session.getLastActivity(),
                session.getCurrentDiagram(),
                session.isSchemaComplete(),
                dtos
        );
    }

    // ── Delete session ────────────────────────────────────────

    @Transactional
    public void deleteSession(String sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw AppException.notFound("Session", sessionId);
        }
        sessionRepository.deleteById(sessionId);
        log.info("Deleted session {}", sessionId);
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
