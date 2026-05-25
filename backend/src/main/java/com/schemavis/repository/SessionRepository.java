package com.schemavis.repository;

import com.schemavis.domain.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {

    /** Purge sessions idle longer than the given cutoff (nightly cleanup). */
    @Modifying
    @Query("DELETE FROM Session s WHERE s.lastActivity < :cutoff")
    int deleteIdleSessions(Instant cutoff);
}
