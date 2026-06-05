-- V3: Project folders — named groups that contain multiple schema sessions
-- Sessions gain an optional project_id FK (NULL = ungrouped).
--
-- WHY: added in backend PR #4 (Session.projectId + Project entity) but the
-- Flyway migration was missing, causing hibernate validate to fail on deploy.

CREATE TABLE projects (
    id            VARCHAR(36)  NOT NULL,
    user_id       VARCHAR(36)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_projects PRIMARY KEY (id)
);

CREATE INDEX idx_projects_user ON projects(user_id);

ALTER TABLE sessions
    ADD COLUMN project_id VARCHAR(36) REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX idx_sessions_project ON sessions(project_id);
