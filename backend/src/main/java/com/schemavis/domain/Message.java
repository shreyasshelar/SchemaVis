package com.schemavis.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    /** "user" or "assistant" */
    @Column(length = 10, nullable = false)
    private String role;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Zero-based order within the session. */
    @Column(nullable = false)
    private int position;

    protected Message() {}

    // ── Factory ───────────────────────────────────────────────
    public static Message of(String role, String content) {
        Message m = new Message();
        m.id = UUID.randomUUID().toString();
        m.role = role;
        m.content = content;
        m.createdAt = Instant.now();
        return m;
    }

    // ── Getters & setters ─────────────────────────────────────
    public String getId()          { return id; }
    public Session getSession()    { return session; }
    public String getRole()        { return role; }
    public String getContent()     { return content; }
    public Instant getCreatedAt()  { return createdAt; }
    public int getPosition()       { return position; }

    public void setSession(Session s)  { this.session = s; }
    public void setPosition(int p)     { this.position = p; }
}
