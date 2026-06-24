package com.competition.repository;

import com.competition.model.Candidature;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    Optional<Candidature> findByNumeroCandidature(String numero);
    List<Candidature> findByCentreId(Long centreId);
    boolean existsByCandidatCinAndConcoursIdAndSpecialiteId(String cin, Long concoursId, Long specialiteId);
    Long countByCentreIdAndSpecialiteIdAndStatut(Long centreId, Long specialiteId, com.competition.model.StatutCandidature statut);
    
    long countBySalleId(Long salleId);
    List<Candidature> findBySalleId(Long salleId);
    List<Candidature> findByCentreIdAndStatutAndSalleIsNull(Long centreId, com.competition.model.StatutCandidature statut);
}