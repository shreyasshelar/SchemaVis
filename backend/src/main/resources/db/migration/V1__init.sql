-- SchemaVis — Initial schema
-- Flyway manages all DDL changes. Never ALTER manually.

CREATE TABLE sessions (
    id            VARCHAR(36)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_diagram TEXT,
    schema_complete BOOLEAN    NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_sessions PRIMARY KEY (id)
);

CREATE TABLE messages (
    id          VARCHAR(36)  NOT NULL,
    session_id  VARCHAR(36)  NOT NULL,
    role        VARCHAR(10)  NOT NULL,    -- 'user' | 'assistant'
    content     TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    position    INTEGER      NOT NULL,
    CONSTRAINT pk_messages    PRIMARY KEY (id),
    CONSTRAINT fk_msg_session FOREIGN KEY (session_id)
        REFERENCES sessions (id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_session ON messages (session_id, position);
