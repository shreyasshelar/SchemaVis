package com.schemavis.service;

import com.schemavis.domain.Project;
import com.schemavis.domain.Session;
import com.schemavis.dto.ProjectSummaryResponse;
import com.schemavis.dto.ProjectTreeResponse;
import com.schemavis.dto.SessionSummaryResponse;
import com.schemavis.exception.AppException;
import com.schemavis.repository.ProjectRepository;
import com.schemavis.repository.SessionRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final SessionRepository sessionRepository;

    public ProjectService(ProjectRepository projectRepository,
                          SessionRepository sessionRepository) {
        this.projectRepository = projectRepository;
        this.sessionRepository = sessionRepository;
    }

    // ── Full sidebar tree ──────────────────────────────────────

    @Transactional
    public ProjectTreeResponse getTree(String userId) {
        List<ProjectSummaryResponse> folders = projectRepository
                .findByUserIdOrderByCreatedAtAsc(userId)
                .stream()
                .map(f -> {
                    List<SessionSummaryResponse> sessions = sessionRepository
                            .findByProjectIdAndUserIdOrderByLastActivityDesc(f.getId(), userId)
                            .stream().map(this::toSummary).toList();
                    return new ProjectSummaryResponse(f.getId(), f.getName(), f.getCreatedAt(), sessions);
                })
                .toList();

        List<SessionSummaryResponse> ungrouped = sessionRepository
                .findByProjectIdIsNullAndUserIdOrderByLastActivityDesc(userId)
                .stream().map(this::toSummary).toList();

        return new ProjectTreeResponse(folders, ungrouped);
    }

    // ── CRUD ──────────────────────────────────────────────────

    @Transactional
    public ProjectSummaryResponse createProject(String name, String userId) {
        Project p = Project.create(userId, name);
        projectRepository.save(p);
        return new ProjectSummaryResponse(p.getId(), p.getName(), p.getCreatedAt(), List.of());
    }

    @Transactional
    public ProjectSummaryResponse renameProject(String projectId, String name, String userId) {
        Project p = requireOwned(projectId, userId);
        p.setName(name);
        projectRepository.save(p);
        List<SessionSummaryResponse> sessions = sessionRepository
                .findByProjectIdAndUserIdOrderByLastActivityDesc(p.getId(), userId)
                .stream().map(this::toSummary).toList();
        return new ProjectSummaryResponse(p.getId(), p.getName(), p.getCreatedAt(), sessions);
    }

    /**
     * Delete a folder. All sessions that were inside it become ungrouped (projectId → null).
     * No sessions are deleted.
     */
    @Transactional
    public void deleteProject(String projectId, String userId) {
        Project p = requireOwned(projectId, userId);
        // Ungroup all sessions in this folder
        sessionRepository
                .findByProjectIdAndUserIdOrderByLastActivityDesc(projectId, userId)
                .forEach(s -> { s.setProjectId(null); sessionRepository.save(s); });
        projectRepository.delete(p);
    }

    // ── Move session ──────────────────────────────────────────

    @Transactional
    public void moveSession(String sessionId, String targetProjectId, String userId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> AppException.notFound("Session", sessionId));
        if (!userId.equals(session.getUserId())) throw AppException.forbidden("session");

        if (targetProjectId != null && !targetProjectId.isBlank()) {
            // Validate target folder belongs to same user
            if (!projectRepository.existsByIdAndUserId(targetProjectId, userId)) {
                throw AppException.notFound("Project", targetProjectId);
            }
            session.setProjectId(targetProjectId);
        } else {
            session.setProjectId(null); // ungroup
        }
        sessionRepository.save(session);
    }

    // ── Helper ────────────────────────────────────────────────

    private Project requireOwned(String projectId, String userId) {
        Project p = projectRepository.findById(projectId)
                .orElseThrow(() -> AppException.notFound("Project", projectId));
        if (!userId.equals(p.getUserId())) throw AppException.forbidden("project");
        return p;
    }

    private SessionSummaryResponse toSummary(Session s) {
        return new SessionSummaryResponse(
                s.getId(), s.getName(), s.getCreatedAt(), s.getLastActivity(),
                s.isSchemaComplete(), s.getCurrentDiagram() != null,
                s.getMessages().size(), s.getProjectId()
        );
    }
}
