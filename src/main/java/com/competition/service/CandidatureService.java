package com.competition.service;

import com.competition.exception.BusinessException;
import com.competition.model.*;
import com.competition.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class CandidatureService {
    private final CandidatureRepository candidatureRepository;
    private final CentreSpecialiteRepository centreSpecialiteRepository;
    private final CandidatRepository candidatRepository;
    private final SalleRepository salleRepository;

    @Transactional
    public Candidature soumettreCandidature(Candidature candidature) {
        // 1. Détection des doublons (Règle 2)
        if (candidatureRepository.existsByCandidatCinAndConcoursIdAndSpecialiteId(
                candidature.getCandidat().getCin(),
                candidature.getConcours().getId(),
                candidature.getSpecialite().getId())) {
            throw new BusinessException("Vous avez déjà soumis une candidature pour ce concours et cette spécialité.");
        }

        // 2. Génération du numéro unique (Règle 1)
        candidature.setNumeroCandidature(genererNumeroUnique());

        // 3. Sauvegarde du candidat s'il n'existe pas
        Candidat candidat = candidatRepository.findByCin(candidature.getCandidat().getCin())
                .orElseGet(() -> candidatRepository.save(candidature.getCandidat()));
        candidature.setCandidat(candidat);

        return candidatureRepository.save(candidature);
    }

    @Transactional
    public void validerCandidature(Long candidatureId) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new BusinessException("Candidature non trouvée."));

        // 4. Gestion des places / Quotas (Règle 4)
        CentreSpecialite cs = centreSpecialiteRepository.findByCentreIdAndSpecialiteId(
                candidature.getCentre().getId(),
                candidature.getSpecialite().getId())
                .orElseThrow(() -> new BusinessException("Cette spécialité n'est pas proposée dans ce centre."));

        long placesOccupees = candidatureRepository.countByCentreIdAndSpecialiteIdAndStatut(
                candidature.getCentre().getId(),
                candidature.getSpecialite().getId(),
                StatutCandidature.VALIDEE);

        if (placesOccupees >= cs.getNombrePlaces()) {
            throw new BusinessException("Le quota de places pour cette spécialité dans ce centre est atteint.");
        }

        // Automatic room (salle) allocation
        List<Salle> salles = salleRepository.findByCentreId(candidature.getCentre().getId());
        Salle assignedSalle = null;
        for (Salle salle : salles) {
            long assignedCount = candidatureRepository.countBySalleId(salle.getId());
            if (assignedCount < salle.getCapacite()) {
                assignedSalle = salle;
                break;
            }
        }

        if (assignedSalle == null) {
            if (salles.isEmpty()) {
                throw new BusinessException("Impossible de valider: Aucune salle n'est configurée pour ce centre.");
            } else {
                throw new BusinessException("Impossible de valider: Toutes les salles de ce centre sont pleines.");
            }
        }

        candidature.setSalle(assignedSalle);
        candidature.setStatut(StatutCandidature.VALIDEE);
        candidatureRepository.save(candidature);
    }

    @Transactional
    public void affecterCandidatureASalle(Long candidatureId, Long salleId) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new BusinessException("Candidature non trouvée."));

        if (candidature.getStatut() != StatutCandidature.VALIDEE) {
            throw new BusinessException("La candidature doit être validée pour être affectée à une salle.");
        }

        if (salleId == null) {
            candidature.setSalle(null);
            candidatureRepository.save(candidature);
            return;
        }

        Salle salle = salleRepository.findById(salleId)
                .orElseThrow(() -> new BusinessException("Salle spécifiée non trouvée."));

        if (!salle.getCentre().getId().equals(candidature.getCentre().getId())) {
            throw new BusinessException("La salle spécifiée n'appartient pas au centre de cette candidature.");
        }

        long assignedCount = candidatureRepository.countBySalleId(salle.getId());
        if (candidature.getSalle() != null && candidature.getSalle().getId().equals(salle.getId())) {
            return;
        }

        if (assignedCount >= salle.getCapacite()) {
            throw new BusinessException("La salle spécifiée est déjà pleine.");
        }

        candidature.setSalle(salle);
        candidatureRepository.save(candidature);
    }

    private String genererNumeroUnique() {
        String year = String.valueOf(Year.now().getValue());
        int randomNum = new Random().nextInt(999999);
        String formattedNum = String.format("%06d", randomNum);
        String numero = "CAND-" + year + "-" + formattedNum;

        // Vérifier l'unicité
        if (candidatureRepository.findByNumeroCandidature(numero).isPresent()) {
            return genererNumeroUnique();
        }
        return numero;
    }
}
