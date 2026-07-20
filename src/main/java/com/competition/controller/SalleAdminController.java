package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Centre;
import com.competition.model.Salle;
import com.competition.repository.CentreRepository;
import com.competition.repository.SalleRepository;
import com.competition.repository.SpecialiteRepository;
import com.competition.repository.CentreSpecialiteRepository;
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
@RequestMapping("/api/v1/admin/salles")
@RequiredArgsConstructor
public class SalleAdminController {

    private final SalleRepository salleRepository;
    private final CentreRepository centreRepository;
    private final SpecialiteRepository specialiteRepository;
    private final CentreSpecialiteRepository centreSpecialiteRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<List<Salle>>> getAllSalles(Principal principal) {
        User user = currentUser(principal);
        List<Salle> salles = user.getRole() == Role.GESTIONNAIRE_LOCAL
                ? salleRepository.findByCentreId(localCentreId(user)) : salleRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Salle>>builder()
                .success(true)
                .message("Liste des salles récupérée avec succès.")
                .data(salles)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Salle>> getSalleById(@PathVariable Long id, Principal principal) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée."));
        assertLocalScope(salle, currentUser(principal));
        return ResponseEntity.ok(ApiResponse.<Salle>builder()
                .success(true)
                .message("Salle récupérée avec succès.")
                .data(salle)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Salle>> createSalle(@RequestBody Salle salle, Principal principal) {
        User user = currentUser(principal);
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            salle.setCentre(centreRepository.findById(localCentreId(user))
                    .orElseThrow(() -> new BusinessException("Centre du gestionnaire introuvable.")));
        }
        Long centreId = salle.getCentre() != null ? salle.getCentre().getId() : null;
        if (centreId == null) {
            throw new RuntimeException("Un centre doit être fourni pour la salle.");
        }

        Centre centre = centreRepository.findById(centreId)
                .orElseThrow(() -> new RuntimeException("Centre non trouvé."));
        salle.setCentre(centre);
        assignSpecialite(salle, salle.getSpecialite());

        Salle saved = salleRepository.save(salle);
        return ResponseEntity.ok(ApiResponse.<Salle>builder()
                .success(true)
                .message("Salle créée avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Salle>> updateSalle(@PathVariable Long id, @RequestBody Salle request, Principal principal) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée."));
        User user = currentUser(principal);
        assertLocalScope(salle, user);

        salle.setNom(request.getNom());
        salle.setCapacite(request.getCapacite());
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL) {
            salle.setCentre(centreRepository.findById(localCentreId(user))
                    .orElseThrow(() -> new BusinessException("Centre du gestionnaire introuvable.")));
        } else if (request.getCentre() != null && request.getCentre().getId() != null) {
            Centre centre = centreRepository.findById(request.getCentre().getId())
                    .orElseThrow(() -> new RuntimeException("Centre non trouvé."));
            salle.setCentre(centre);
        }
        assignSpecialite(salle, request.getSpecialite());

        Salle updated = salleRepository.save(salle);
        return ResponseEntity.ok(ApiResponse.<Salle>builder()
                .success(true)
                .message("Salle mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Void>> deleteSalle(@PathVariable Long id, Principal principal) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée."));
        assertLocalScope(salle, currentUser(principal));
        salleRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Salle supprimée avec succès.")
                .build());
    }

    private void assignSpecialite(Salle salle, com.competition.model.Specialite requestedSpecialite) {
        Long specialiteId = requestedSpecialite != null ? requestedSpecialite.getId() : null;
        if (specialiteId == null) {
            throw new RuntimeException("Une spécialité doit être fournie pour la salle.");
        }
        if (salle.getCentre() == null || salle.getCentre().getId() == null
                || centreSpecialiteRepository.findByCentreIdAndSpecialiteId(salle.getCentre().getId(), specialiteId).isEmpty()) {
            throw new RuntimeException("Cette spécialité n'est pas allouée au centre sélectionné.");
        }
        salle.setSpecialite(specialiteRepository.findById(specialiteId)
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée.")));
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

    private void assertLocalScope(Salle salle, User user) {
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL
                && (salle.getCentre() == null || !localCentreId(user).equals(salle.getCentre().getId()))) {
            throw new BusinessException("Accès refusé. Cette salle n'appartient pas à votre centre.");
        }
    }
}
