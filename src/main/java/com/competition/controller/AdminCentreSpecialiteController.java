package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.dto.CentreSpecialiteRequest;
import com.competition.model.Centre;
import com.competition.model.CentreSpecialite;
import com.competition.model.Specialite;
import com.competition.repository.CentreRepository;
import com.competition.repository.CentreSpecialiteRepository;
import com.competition.repository.SpecialiteRepository;
import com.competition.repository.UserRepository;
import com.competition.model.User;
import com.competition.model.Role;
import com.competition.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/admin/centre-specialites")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
public class AdminCentreSpecialiteController {

    private final CentreSpecialiteRepository centreSpecialiteRepository;
    private final CentreRepository centreRepository;
    private final SpecialiteRepository specialiteRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CentreSpecialite>>> getAllCentreSpecialites(Principal principal) {
        List<CentreSpecialite> list;
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            // Local managers only see allocations for their own centre.
            if (user.getCentre() == null || user.getCentre().getId() == null) {
                throw new BusinessException("Le gestionnaire local n'est associé à aucun centre.");
            }
            list = centreSpecialiteRepository.findByCentreId(user.getCentre().getId());
        } else {
            list = centreSpecialiteRepository.findAll();
        }
        return ResponseEntity.ok(ApiResponse.<List<CentreSpecialite>>builder()
                .success(true)
                .message("Allocations récupérées avec succès.")
                .data(list)
                .build());
    }

    @GetMapping("/centre/{centreId}")
    public ResponseEntity<ApiResponse<List<CentreSpecialite>>> getSpecialitesByCenter(
            @PathVariable Long centreId, Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL
                && (user.getCentre() == null || !centreId.equals(user.getCentre().getId()))) {
            throw new BusinessException("Accès refusé. Ce centre n'est pas associé à votre compte.");
        }
        List<CentreSpecialite> specialites = centreSpecialiteRepository.findByCentreId(centreId);
        return ResponseEntity.ok(ApiResponse.<List<CentreSpecialite>>builder()
                .success(true)
                .message("Spécialités du centre récupérées.")
                .data(specialites)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<CentreSpecialite>> createAllocation(
            @RequestBody CentreSpecialiteRequest request, Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            if (user.getCentre() == null || !user.getCentre().getId().equals(request.getCentreId())) {
                throw new BusinessException("Accès refusé. Vous ne pouvez allouer des spécialités que pour votre propre centre.");
            }
        }

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
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<CentreSpecialite>> updateAllocation(
            @PathVariable Long id, @RequestBody CentreSpecialite allocationDetails, Principal principal) {
        CentreSpecialite allocation = centreSpecialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allocation non trouvée."));
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            if (user.getCentre() == null || !user.getCentre().getId().equals(allocation.getCentre().getId())) {
                throw new BusinessException("Accès refusé. Vous ne pouvez modifier que les allocations de votre propre centre.");
            }
        }
        
        allocation.setNombrePlaces(allocationDetails.getNombrePlaces());
        
        CentreSpecialite updated = centreSpecialiteRepository.save(allocation);
        return ResponseEntity.ok(ApiResponse.<CentreSpecialite>builder()
                .success(true)
                .message("Allocation mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Void>> deleteAllocation(@PathVariable Long id, Principal principal) {
        CentreSpecialite allocation = centreSpecialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allocation non trouvée."));
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            if (user.getCentre() == null || !user.getCentre().getId().equals(allocation.getCentre().getId())) {
                throw new BusinessException("Accès refusé. Vous ne pouvez supprimer que les allocations de votre propre centre.");
            }
        }
        centreSpecialiteRepository.delete(allocation);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Allocation supprimée avec succès.")
                .build());
    }
}
