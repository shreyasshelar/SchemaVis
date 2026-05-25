package com.schemavis.repository;

import com.schemavis.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    List<Message> findBySessionIdOrderByPositionAsc(String sessionId);
}
