package com.competition.service;

import com.competition.exception.BusinessException;
import com.competition.model.*;
import com.competition.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class CandidatureService {
    private final CandidatureRepository candidatureRepository;
    private final CentreSpecialiteRepository centreSpecialiteRepository;
    private final CandidatRepository candidatRepository;

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

        candidature.setStatut(StatutCandidature.VALIDEE);
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
