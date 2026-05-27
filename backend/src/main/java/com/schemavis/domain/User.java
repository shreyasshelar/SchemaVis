package com.schemavis.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected User() {}

    public static User create(String email, String passwordHash, String displayName) {
        User u = new User();
        u.id           = UUID.randomUUID().toString();
        u.email        = email;
        u.passwordHash = passwordHash;
        u.displayName  = displayName;
        u.createdAt    = Instant.now();
        return u;
    }

    // ── Getters ───────────────────────────────────────────────
    public String  getId()           { return id; }
    public String  getEmail()        { return email; }
    public String  getPasswordHash() { return passwordHash; }
    public String  getDisplayName()  { return displayName; }
    public Instant getCreatedAt()    { return createdAt; }
}
