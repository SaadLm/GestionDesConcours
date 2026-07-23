package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Centre;
import com.competition.model.Role;
import com.competition.model.User;
import com.competition.repository.CentreRepository;
import com.competition.repository.UserRepository;
import com.competition.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/admin/centres")
@RequiredArgsConstructor
public class CentreController {

    private final CentreRepository centreRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<List<Centre>>> getAllCentres(Principal principal) {
        List<Centre> centres;
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            // Local managers only see their own centre.
            if (user.getCentre() == null) {
                throw new BusinessException("Le gestionnaire local n'est associé à aucun centre.");
            }
            centres = Collections.singletonList(user.getCentre());
        } else {
            centres = centreRepository.findAll();
        }
        return ResponseEntity.ok(ApiResponse.<List<Centre>>builder()
                .success(true)
                .message("Liste des centres récupérée avec succès.")
                .data(centres)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Centre>> getCentreById(@PathVariable Long id, Principal principal) {
        Centre centre = centreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Centre non trouvé."));
        assertLocalScope(centre, principal);
        return ResponseEntity.ok(ApiResponse.<Centre>builder()
                .success(true)
                .message("Centre récupéré avec succès.")
                .data(centre)
                .build());
    }

    private void assertLocalScope(Centre centre, Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL
                && (user.getCentre() == null || !user.getCentre().getId().equals(centre.getId()))) {
            throw new BusinessException("Accès refusé. Ce centre n'est pas associé à votre compte.");
        }
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
