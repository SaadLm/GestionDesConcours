package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Concours;
import com.competition.repository.ConcoursRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/concours")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
public class ConcoursController {

    private final ConcoursRepository concoursRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Concours>>> getAllConcours() {
        List<Concours> concours = concoursRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Concours>>builder()
                .success(true)
                .message("Liste des concours récupérée avec succès.")
                .data(concours)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Concours>> getConcoursById(@PathVariable Long id) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours récupéré avec succès.")
                .data(concours)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
    public ResponseEntity<ApiResponse<Concours>> createConcours(@RequestBody Concours concours) {
        Concours saved = concoursRepository.save(concours);
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours créé avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
    public ResponseEntity<ApiResponse<Concours>> updateConcours(
            @PathVariable Long id, @RequestBody Concours concoursDetails) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        
        concours.setTitre(concoursDetails.getTitre());
        concours.setDescription(concoursDetails.getDescription());
        concours.setDateConcours(concoursDetails.getDateConcours());
        concours.setDateDebutInscription(concoursDetails.getDateDebutInscription());
        concours.setDateFinInscription(concoursDetails.getDateFinInscription());
        concours.setStatut(concoursDetails.getStatut());
        
        Concours updated = concoursRepository.save(concours);
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours mis à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteConcours(@PathVariable Long id) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        concoursRepository.delete(concours);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Concours supprimé avec succès.")
                .build());
    }
}
