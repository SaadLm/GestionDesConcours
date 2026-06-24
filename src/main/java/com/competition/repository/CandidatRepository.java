package com.competition.repository;

import com.competition.model.Candidat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CandidatRepository extends JpaRepository<Candidat, Long> {
    Optional<Candidat> findByCin(String cin);
}