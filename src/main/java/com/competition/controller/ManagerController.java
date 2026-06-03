package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Candidature;
import com.competition.repository.CandidatureRepository;
import com.competition.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final CandidatureRepository candidatureRepository;
    private final CandidatureService candidatureService;

    @GetMapping("/candidatures")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_LOCAL', 'GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Candidature>>> getCandidatures(
            @RequestParam(required = false) Long centreId) {
        
        List<Candidature> list;
        if (centreId != null) {
            list = candidatureRepository.findByCentreId(centreId);
        } else {
            list = candidatureRepository.findAll();
        }

        return ResponseEntity.ok(ApiResponse.<List<Candidature>>builder()
                .success(true)
                .message("Liste des candidatures récupérée.")
                .data(list)
                .build());
    }

    @PostMapping("/candidatures/{id}/valider")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_LOCAL', 'GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> valider(@PathVariable Long id) {
        candidatureService.validerCandidature(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Candidature validée avec succès.")
                .build());
    }

    @PostMapping("/candidatures/{id}/rejeter")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_LOCAL', 'GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rejeter(@PathVariable Long id, @RequestParam String commentaire) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée."));
        
        candidature.setStatut(com.competition.model.StatutCandidature.REJETEE);
        candidature.setCommentaire(commentaire);
        candidatureRepository.save(candidature);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Candidature rejetée.")
                .build());
    }
}
