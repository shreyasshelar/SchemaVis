package com.schemavis.repository;

import com.schemavis.domain.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {

    /** All sessions belonging to a user, newest activity first. */
    List<Session> findByUserIdOrderByLastActivityDesc(String userId);

    /** Ownership check — does this session belong to this user? */
    boolean existsByIdAndUserId(String id, String userId);

    /** Purge sessions idle longer than the given cutoff (nightly cleanup). */
    @Modifying
    @Query("DELETE FROM Session s WHERE s.lastActivity < :cutoff")
    int deleteIdleSessions(Instant cutoff);
}
