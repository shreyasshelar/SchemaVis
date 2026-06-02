package com.schemavis.controller;

import com.schemavis.domain.User;
import com.schemavis.dto.CreateProjectRequest;
import com.schemavis.dto.ProjectSummaryResponse;
import com.schemavis.dto.ProjectTreeResponse;
import com.schemavis.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects", description = "Manage project folders that group schema sessions")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    // ── GET /api/projects ─────────────────────────────────────
    // Returns the full sidebar tree: folders with sessions + ungrouped sessions.

    @GetMapping
    @Operation(summary = "Get project tree: all folders with their sessions + ungrouped sessions")
    public ResponseEntity<ProjectTreeResponse> getTree(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(projectService.getTree(user.getId()));
    }

    // ── POST /api/projects ────────────────────────────────────

    @PostMapping
    @Operation(summary = "Create a new project folder")
    public ResponseEntity<ProjectSummaryResponse> create(
            @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(projectService.createProject(request.name(), user.getId()));
    }

    // ── PUT /api/projects/{id}/name ───────────────────────────

    @PutMapping("/{id}/name")
    @Operation(summary = "Rename a project folder")
    public ResponseEntity<ProjectSummaryResponse> rename(
            @PathVariable String id,
            @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(projectService.renameProject(id, request.name(), user.getId()));
    }

    // ── DELETE /api/projects/{id} ─────────────────────────────
    // Sessions inside the folder are NOT deleted — they become ungrouped.

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a folder (sessions become ungrouped, not deleted)")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @AuthenticationPrincipal User user
    ) {
        projectService.deleteProject(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
