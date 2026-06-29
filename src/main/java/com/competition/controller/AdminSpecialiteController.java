package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Specialite;
import com.competition.repository.SpecialiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/specialites")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
public class AdminSpecialiteController {

    private final SpecialiteRepository specialiteRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Specialite>>> getAllSpecialites() {
        List<Specialite> specialites = specialiteRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Specialite>>builder()
                .success(true)
                .message("Liste des spécialités récupérée avec succès.")
                .data(specialites)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Specialite>> getSpecialiteById(@PathVariable Long id) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée."));
        return ResponseEntity.ok(ApiResponse.<Specialite>builder()
                .success(true)
                .message("Spécialité récupérée avec succès.")
                .data(specialite)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Specialite>> createSpecialite(@RequestBody Specialite specialite) {
        Specialite saved = specialiteRepository.save(specialite);
        return ResponseEntity.ok(ApiResponse.<Specialite>builder()
                .success(true)
                .message("Spécialité créée avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Specialite>> updateSpecialite(
            @PathVariable Long id, @RequestBody Specialite specialiteDetails) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée."));
        
        specialite.setNom(specialiteDetails.getNom());
        specialite.setDescription(specialiteDetails.getDescription());
        
        Specialite updated = specialiteRepository.save(specialite);
        return ResponseEntity.ok(ApiResponse.<Specialite>builder()
                .success(true)
                .message("Spécialité mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSpecialite(@PathVariable Long id) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée."));
        specialiteRepository.delete(specialite);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Spécialité supprimée avec succès.")
                .build());
    }
}
