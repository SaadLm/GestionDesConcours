package com.competition.repository;

import com.competition.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    Optional<Document> findByIdAndCandidatureId(Long id, Long candidatureId);
}
