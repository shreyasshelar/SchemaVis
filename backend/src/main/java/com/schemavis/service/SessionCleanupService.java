package com.schemavis.service;

import com.schemavis.repository.SessionRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Periodically removes sessions that have been idle for more than 24 hours.
 *
 * Why? Anonymous sessions have no owner — without a cleanup job the DB grows
 * indefinitely. When we add auth, tie cleanup to user account deletion instead.
 */
@Service
public class SessionCleanupService {

    private static final Logger log = LoggerFactory.getLogger(SessionCleanupService.class);

    private final SessionRepository sessionRepository;

    public SessionCleanupService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Runs every day at 03:00 UTC.
     * Deletes sessions with lastActivity older than 24 hours.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeIdleSessions() {
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        int deleted = sessionRepository.deleteIdleSessions(cutoff);
        log.info("Session cleanup: deleted {} idle sessions (cutoff={})", deleted, cutoff);
    }
}
