package com.competition.repository;

import com.competition.model.CentreSpecialite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CentreSpecialiteRepository extends JpaRepository<CentreSpecialite, Long> {
    Optional<CentreSpecialite> findByCentreIdAndSpecialiteId(Long centreId, Long specialiteId);
}