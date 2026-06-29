package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Centre;
import com.competition.repository.CentreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/centres")
@RequiredArgsConstructor
public class CentreController {

    private final CentreRepository centreRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
    public ResponseEntity<ApiResponse<List<Centre>>> getAllCentres() {
        List<Centre> centres = centreRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Centre>>builder()
                .success(true)
                .message("Liste des centres récupérée avec succès.")
                .data(centres)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
    public ResponseEntity<ApiResponse<Centre>> getCentreById(@PathVariable Long id) {
        Centre centre = centreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centre non trouvé."));
        return ResponseEntity.ok(ApiResponse.<Centre>builder()
                .success(true)
                .message("Centre récupéré avec succès.")
                .data(centre)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Centre>> createCentre(@RequestBody Centre centre) {
        Centre saved = centreRepository.save(centre);
        return ResponseEntity.ok(ApiResponse.<Centre>builder()
                .success(true)
                .message("Centre créé avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Centre>> updateCentre(@PathVariable Long id, @RequestBody Centre request) {
        Centre centre = centreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centre non trouvé."));

        centre.setNom(request.getNom());
        centre.setVille(request.getVille());
        centre.setAdresse(request.getAdresse());
        centre.setTelephone(request.getTelephone());

        Centre updated = centreRepository.save(centre);
        return ResponseEntity.ok(ApiResponse.<Centre>builder()
                .success(true)
                .message("Centre mis à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCentre(@PathVariable Long id) {
        centreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centre non trouvé."));
        centreRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Centre supprimé avec succès.")
                .build());
    }
}
