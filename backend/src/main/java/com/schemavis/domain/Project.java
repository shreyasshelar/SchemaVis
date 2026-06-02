package com.schemavis.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/** A named folder that groups multiple schema-chat sessions under one project. */
@Entity
@Table(name = "projects")
public class Project {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", length = 36, nullable = false)
    private String userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Project() {}

    public static Project create(String userId, String name) {
        Project p = new Project();
        p.id        = UUID.randomUUID().toString();
        p.userId    = userId;
        p.name      = (name != null && !name.isBlank()) ? name.trim() : "New Folder";
        p.createdAt = Instant.now();
        return p;
    }

    // ── Getters & setters ─────────────────────────────────────
    public String  getId()         { return id; }
    public String  getUserId()     { return userId; }
    public String  getName()       { return name; }
    public Instant getCreatedAt()  { return createdAt; }

    public void setName(String n) {
        this.name = (n != null && !n.isBlank()) ? n.trim() : this.name;
    }
}
