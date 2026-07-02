package com.competition.repository;

import com.competition.model.Candidature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;

public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    Optional<Candidature> findByNumeroCandidature(String numero);
    List<Candidature> findByCentreId(Long centreId);
    boolean existsByCandidatCinAndConcoursIdAndSpecialiteId(String cin, Long concoursId, Long specialiteId);
    Long countByCentreIdAndSpecialiteIdAndStatut(Long centreId, Long specialiteId, com.competition.model.StatutCandidature statut);

    @Query("select distinct c from Candidature c join fetch c.candidat cand left join fetch cand.diplomes where c.concours.id = :concoursId")
    List<Candidature> findByConcoursIdWithCandidateDiplomes(@Param("concoursId") Long concoursId);
    
    long countBySalleId(Long salleId);
    List<Candidature> findBySalleId(Long salleId);
    List<Candidature> findByCentreIdAndStatutAndSalleIsNull(Long centreId, com.competition.model.StatutCandidature statut);
}