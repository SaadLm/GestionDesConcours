package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Concours;
import com.competition.repository.CentreRepository;
import com.competition.repository.ConcoursRepository;
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
@RequestMapping("/api/v1/admin/concours")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
public class ConcoursController {

    private final ConcoursRepository concoursRepository;
    private final CentreRepository centreRepository;
    private final SpecialiteRepository specialiteRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Concours>>> getAllConcours(Principal principal) {
        User user = currentUser(principal);
        List<Concours> concours = user.getRole() == Role.GESTIONNAIRE_LOCAL
                ? concoursRepository.findByCentreId(localCentreId(user))
                : concoursRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Concours>>builder()
                .success(true)
                .message("Liste des concours récupérée avec succès.")
                .data(concours)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Concours>> getConcoursById(@PathVariable Long id, Principal principal) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        assertLocalScope(concours, currentUser(principal));
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours récupéré avec succès.")
                .data(concours)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Concours>> createConcours(@RequestBody Concours concours, Principal principal) {
        User user = currentUser(principal);
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            concours.setCentre(centreRepository.findById(localCentreId(user))
                    .orElseThrow(() -> new BusinessException("Centre du gestionnaire introuvable.")));
        } else if (concours.getCentre() != null && concours.getCentre().getId() != null) {
            centreRepository.findById(concours.getCentre().getId())
                .ifPresent(concours::setCentre);
        }
        if (concours.getSpecialite() != null && concours.getSpecialite().getId() != null) {
            specialiteRepository.findById(concours.getSpecialite().getId())
                .ifPresent(concours::setSpecialite);
        }
        Concours saved = concoursRepository.save(concours);
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours créé avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Concours>> updateConcours(
            @PathVariable Long id, @RequestBody Concours concoursDetails, Principal principal) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        User user = currentUser(principal);
        assertLocalScope(concours, user);
        
        concours.setTitre(concoursDetails.getTitre());
        concours.setDescription(concoursDetails.getDescription());
        concours.setDateConcours(concoursDetails.getDateConcours());
        concours.setDateDebutInscription(concoursDetails.getDateDebutInscription());
        concours.setDateFinInscription(concoursDetails.getDateFinInscription());
        concours.setStatut(concoursDetails.getStatut());
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            concours.setCentre(centreRepository.findById(localCentreId(user))
                    .orElseThrow(() -> new BusinessException("Centre du gestionnaire introuvable.")));
        } else if (concoursDetails.getCentre() != null && concoursDetails.getCentre().getId() != null) {
            centreRepository.findById(concoursDetails.getCentre().getId())
                .ifPresent(concours::setCentre);
        } else {
            concours.setCentre(null);
        }
        if (concoursDetails.getSpecialite() != null && concoursDetails.getSpecialite().getId() != null) {
            specialiteRepository.findById(concoursDetails.getSpecialite().getId())
                .ifPresent(concours::setSpecialite);
        } else {
            concours.setSpecialite(null);
        }
        
        Concours updated = concoursRepository.save(concours);
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours mis à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Void>> deleteConcours(@PathVariable Long id, Principal principal) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        assertLocalScope(concours, currentUser(principal));
        concoursRepository.delete(concours);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Concours supprimé avec succès.")
                .build());
    }

    private User currentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new BusinessException("Utilisateur non connecté."));
    }

    private Long localCentreId(User user) {
        if (user.getCentre() == null || user.getCentre().getId() == null) {
            throw new BusinessException("Le gestionnaire local n'est associé à aucun centre.");
        }
        return user.getCentre().getId();
    }

    private void assertLocalScope(Concours concours, User user) {
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL
                && (concours.getCentre() == null || !localCentreId(user).equals(concours.getCentre().getId()))) {
            throw new BusinessException("Accès refusé. Ce concours n'appartient pas à votre centre.");
        }
    }
}
