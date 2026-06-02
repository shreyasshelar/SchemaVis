package com.schemavis.repository;

import com.schemavis.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

    List<Project> findByUserIdOrderByCreatedAtAsc(String userId);

    boolean existsByIdAndUserId(String id, String userId);
}
