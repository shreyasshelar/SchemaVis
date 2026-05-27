-- V2: User accounts + session ownership
-- Sessions become named "projects" owned by a user

CREATE TABLE users (
    id            VARCHAR(36)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_users       PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

ALTER TABLE sessions
    ADD COLUMN user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN name    VARCHAR(100) NOT NULL DEFAULT 'New Schema';

CREATE INDEX idx_sessions_user ON sessions(user_id);
