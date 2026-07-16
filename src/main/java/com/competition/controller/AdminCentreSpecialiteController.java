package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.dto.CentreSpecialiteRequest;
import com.competition.model.Centre;
import com.competition.model.CentreSpecialite;
import com.competition.model.Specialite;
import com.competition.repository.CentreRepository;
import com.competition.repository.CentreSpecialiteRepository;
import com.competition.repository.SpecialiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/centre-specialites")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
public class AdminCentreSpecialiteController {

    private final CentreSpecialiteRepository centreSpecialiteRepository;
    private final CentreRepository centreRepository;
    private final SpecialiteRepository specialiteRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CentreSpecialite>>> getAllCentreSpecialites() {
        List<CentreSpecialite> list = centreSpecialiteRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<CentreSpecialite>>builder()
                .success(true)
                .message("Allocations récupérées avec succès.")
                .data(list)
                .build());
    }

    @GetMapping("/centre/{centreId}")
    public ResponseEntity<ApiResponse<List<CentreSpecialite>>> getSpecialitesByCenter(
            @PathVariable Long centreId) {
        List<CentreSpecialite> specialites = centreSpecialiteRepository.findByCentreId(centreId);
        return ResponseEntity.ok(ApiResponse.<List<CentreSpecialite>>builder()
                .success(true)
                .message("Spécialités du centre récupérées.")
                .data(specialites)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CentreSpecialite>> createAllocation(
            @RequestBody CentreSpecialiteRequest request) {
        Centre centre = centreRepository.findById(request.getCentreId())
                .orElseThrow(() -> new RuntimeException("Centre non trouvé."));
        Specialite specialite = specialiteRepository.findById(request.getSpecialiteId())
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée."));
        
        CentreSpecialite allocation = CentreSpecialite.builder()
                .centre(centre)
                .specialite(specialite)
                .nombrePlaces(request.getNombrePlaces())
                .build();
        
        CentreSpecialite saved = centreSpecialiteRepository.save(allocation);
        return ResponseEntity.ok(ApiResponse.<CentreSpecialite>builder()
                .success(true)
                .message("Allocation créée avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CentreSpecialite>> updateAllocation(
            @PathVariable Long id, @RequestBody CentreSpecialite allocationDetails) {
        CentreSpecialite allocation = centreSpecialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allocation non trouvée."));
        
        allocation.setNombrePlaces(allocationDetails.getNombrePlaces());
        
        CentreSpecialite updated = centreSpecialiteRepository.save(allocation);
        return ResponseEntity.ok(ApiResponse.<CentreSpecialite>builder()
                .success(true)
                .message("Allocation mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAllocation(@PathVariable Long id) {
        CentreSpecialite allocation = centreSpecialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allocation non trouvée."));
        centreSpecialiteRepository.delete(allocation);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Allocation supprimée avec succès.")
                .build());
    }
}
