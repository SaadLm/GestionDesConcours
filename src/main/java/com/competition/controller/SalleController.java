package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.dto.CentreSallesStateResponse;
import com.competition.dto.SalleWithCandidatesResponse;
import com.competition.exception.BusinessException;
import com.competition.model.*;
import com.competition.repository.*;
import com.competition.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
public class SalleController {

    private final CentreRepository centreRepository;
    private final SalleRepository salleRepository;
    private final UserRepository userRepository;
    private final CandidatureRepository candidatureRepository;
    private final CandidatureService candidatureService;

    @GetMapping("/centres")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
    public ResponseEntity<ApiResponse<List<Centre>>> getAllCentres() {
        List<Centre> centres = centreRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Centre>>builder()
                .success(true)
                .message("Liste de tous les centres récupérée avec succès.")
                .data(centres)
                .build());
    }

    @GetMapping("/centres/{centreId}/salles-with-candidates")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<CentreSallesStateResponse>> getSallesWithCandidates(
            @PathVariable Long centreId,
            Principal principal) {

        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));

        if (currentUser.getRole() == Role.GESTIONNAIRE_LOCAL) {
            if (currentUser.getCentre() == null || !currentUser.getCentre().getId().equals(centreId)) {
                throw new BusinessException("Accès refusé. Vous n'êtes pas le gestionnaire de ce centre.");
            }
        }

        Centre centre = centreRepository.findById(centreId)
                .orElseThrow(() -> new BusinessException("Centre non trouvé."));

        List<Salle> salles = salleRepository.findByCentreId(centreId);
        List<SalleWithCandidatesResponse> sallesWithCandidates = new ArrayList<>();

        for (Salle salle : salles) {
            List<Candidature> candidatures = candidatureRepository.findBySalleId(salle.getId());
            sallesWithCandidates.add(SalleWithCandidatesResponse.builder()
                    .salle(salle)
                    .candidatures(candidatures)
                    .build());
        }

        List<Candidature> unassigned = candidatureRepository.findByCentreIdAndStatutAndSalleIsNull(
                centreId,
                StatutCandidature.VALIDEE
        );

        CentreSallesStateResponse response = CentreSallesStateResponse.builder()
                .centreId(centre.getId())
                .centreNom(centre.getNom())
                .salles(sallesWithCandidates)
                .unassignedCandidatures(unassigned)
                .build();

        return ResponseEntity.ok(ApiResponse.<CentreSallesStateResponse>builder()
                .success(true)
                .message("Salles et candidats du centre récupérés avec succès.")
                .data(response)
                .build());
    }

    @PutMapping("/candidatures/{candidatureId}/salle")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Void>> affecterCandidature(
            @PathVariable Long candidatureId,
            @RequestParam(required = false) Long salleId,
            Principal principal) {

        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));

        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new BusinessException("Candidature non trouvée."));

        if (currentUser.getRole() == Role.GESTIONNAIRE_LOCAL) {
            if (currentUser.getCentre() == null || !currentUser.getCentre().getId().equals(candidature.getCentre().getId())) {
                throw new BusinessException("Accès refusé. Cette candidature n'appartient pas à votre centre.");
            }

            if (salleId != null) {
                Salle salle = salleRepository.findById(salleId)
                        .orElseThrow(() -> new BusinessException("Salle non trouvée."));
                if (!salle.getCentre().getId().equals(currentUser.getCentre().getId())) {
                    throw new BusinessException("Accès refusé. Cette salle n'appartient pas à votre centre.");
                }
            }
        }

        candidatureService.affecterCandidatureASalle(candidatureId, salleId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message(salleId == null ? "Candidat désaffecté de la salle avec succès." : "Candidat affecté à la salle avec succès.")
                .build());
    }
}
