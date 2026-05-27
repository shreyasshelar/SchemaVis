package com.schemavis.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_activity", nullable = false)
    private Instant lastActivity;

    @Column(name = "current_diagram", columnDefinition = "TEXT")
    private String currentDiagram;

    @Column(name = "schema_complete", nullable = false)
    private boolean schemaComplete = false;

    @Column(name = "user_id", length = 36)
    private String userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name = "New Schema";

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC")
    private List<Message> messages = new ArrayList<>();

    protected Session() {}

    // ── Factory ───────────────────────────────────────────────
    public static Session create(String userId, String name) {
        Session s = new Session();
        s.id           = UUID.randomUUID().toString();
        s.createdAt    = Instant.now();
        s.lastActivity = Instant.now();
        s.userId       = userId;
        s.name         = (name != null && !name.isBlank()) ? name.trim() : "New Schema";
        return s;
    }

    /** Backward-compat factory (anonymous) */
    public static Session create() {
        return create(null, "New Schema");
    }

    public void touch() {
        this.lastActivity = Instant.now();
    }

    public void addMessage(Message message) {
        message.setSession(this);
        message.setPosition(this.messages.size());
        this.messages.add(message);
    }

    // ── Getters & setters ─────────────────────────────────────
    public String getId()                  { return id; }
    public Instant getCreatedAt()          { return createdAt; }
    public Instant getLastActivity()       { return lastActivity; }
    public String getCurrentDiagram()      { return currentDiagram; }
    public boolean isSchemaComplete()      { return schemaComplete; }
    public List<Message> getMessages()     { return messages; }

    public String  getUserId()    { return userId; }
    public String  getName()      { return name; }

    public void setCurrentDiagram(String d)   { this.currentDiagram = d; }
    public void setSchemaComplete(boolean c)  { this.schemaComplete = c; }
    public void setLastActivity(Instant t)    { this.lastActivity = t; }
    public void setName(String n)             { this.name = (n != null && !n.isBlank()) ? n.trim() : this.name; }
}
