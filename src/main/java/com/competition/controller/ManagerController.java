package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.dto.CentreSpecialiteRequest;
import com.competition.repository.CandidatureRepository;
import com.competition.repository.DocumentRepository;
import com.competition.repository.UserRepository;
import com.competition.repository.SalleRepository;
import com.competition.repository.CentreRepository;
import com.competition.repository.SpecialiteRepository;
import com.competition.repository.CentreSpecialiteRepository;
import com.competition.model.Candidature;
import com.competition.model.Document;
import com.competition.model.Role;
import com.competition.model.User;
import com.competition.model.Centre;
import com.competition.model.Salle;
import com.competition.model.CentreSpecialite;
import com.competition.model.Specialite;
import com.competition.exception.BusinessException;
import com.competition.service.CandidatureService;
import com.competition.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final CandidatureRepository candidatureRepository;
    private final CandidatureService candidatureService;
    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final SalleRepository salleRepository;
    private final CentreRepository centreRepository;
    private final SpecialiteRepository specialiteRepository;
    private final CentreSpecialiteRepository centreSpecialiteRepository;

    @GetMapping("/my-centre")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Centre>> getMyCentre(Principal principal) {
        User user = currentUser(principal);
        Centre centre = user.getCentre();
        if (centre == null) {
            throw new BusinessException("Le gestionnaire local n'est associé à aucun centre.");
        }
        return ResponseEntity.ok(ApiResponse.<Centre>builder()
                .success(true)
                .message("Centre du gestionnaire récupéré.")
                .data(centre)
                .build());
    }

    @GetMapping("/candidatures")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_LOCAL', 'GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Candidature>>> getCandidatures(
            @RequestParam(required = false) Long centreId,
            @RequestParam(required = false) Long concoursId,
            Principal principal) {

        List<Candidature> list;
        User currentUser = currentUser(principal);
        if (currentUser.getRole() == Role.GESTIONNAIRE_LOCAL) {
            Long localCentreId = localCentreId(currentUser);
            if (concoursId != null) {
                list = candidatureRepository.findByCentreIdAndConcoursIdWithCandidateDiplomes(localCentreId, concoursId);
            } else {
                list = candidatureRepository.findByCentreId(localCentreId);
            }
        } else if (concoursId != null) {
            list = candidatureRepository.findByConcoursIdWithCandidateDiplomes(concoursId);
        } else if (centreId != null) {
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

    @GetMapping("/candidatures/{candidatureId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<Resource> viewDocument(@PathVariable Long candidatureId, @PathVariable Long documentId) {
        Document document = documentRepository.findByIdAndCandidatureId(documentId, candidatureId)
                .orElseThrow(() -> new RuntimeException("Document non trouvé."));
        Resource resource = new FileSystemResource(fileStorageService.resolve(document.getCheminFichier()));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + document.getNomFichier() + "\"")
                .body(resource);
    }

    @PostMapping("/candidatures/{id}/valider")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_LOCAL', 'GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> valider(@PathVariable Long id, Principal principal) {
        assertCanManageCandidature(id, principal);
        candidatureService.validerCandidature(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Candidature validée avec succès.")
                .build());
    }

    @PostMapping("/candidatures/{id}/rejeter")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_LOCAL', 'GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rejeter(@PathVariable Long id, @RequestParam String commentaire, Principal principal) {
        assertCanManageCandidature(id, principal);
        candidatureService.rejeterCandidature(id, commentaire);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Candidature rejetée.")
                .build());
    }

    // Manager-specific salle endpoints
    @GetMapping("/salles")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<List<Salle>>> getManagerSalles(Principal principal) {
        User user = currentUser(principal);
        List<Salle> salles = salleRepository.findByCentreIdWithCentreAndSpecialite(localCentreId(user));
        return ResponseEntity.ok(ApiResponse.<List<Salle>>builder()
                .success(true)
                .message("Liste des salles récupérée avec succès.")
                .data(salles)
                .build());
    }

    @PostMapping("/salles")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Salle>> createManagerSalle(@RequestBody Salle salle, Principal principal) {
        User user = currentUser(principal);
        salle.setCentre(centreRepository.findById(localCentreId(user))
                .orElseThrow(() -> new BusinessException("Centre du gestionnaire introuvable.")));
        
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

    @PutMapping("/salles/{id}")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Salle>> updateManagerSalle(@PathVariable Long id, @RequestBody Salle request, Principal principal) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée."));
        User user = currentUser(principal);
        assertLocalScope(salle, user);

        salle.setNom(request.getNom());
        salle.setCapacite(request.getCapacite());
        salle.setCentre(centreRepository.findById(localCentreId(user))
                .orElseThrow(() -> new BusinessException("Centre du gestionnaire introuvable.")));
        assignSpecialite(salle, request.getSpecialite());

        Salle updated = salleRepository.save(salle);
        return ResponseEntity.ok(ApiResponse.<Salle>builder()
                .success(true)
                .message("Salle mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/salles/{id}")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Void>> deleteManagerSalle(@PathVariable Long id, Principal principal) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée."));
        assertLocalScope(salle, currentUser(principal));
        salleRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Salle supprimée avec succès.")
                .build());
    }

    // Manager-specific specialty allocation endpoints
    @GetMapping("/centre-specialites")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<List<CentreSpecialite>>> getManagerCentreSpecialites(Principal principal) {
        User user = currentUser(principal);
        List<CentreSpecialite> list = centreSpecialiteRepository.findByCentreId(localCentreId(user));
        return ResponseEntity.ok(ApiResponse.<List<CentreSpecialite>>builder()
                .success(true)
                .message("Allocations récupérées avec succès.")
                .data(list)
                .build());
    }

    @PostMapping("/centre-specialites")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<CentreSpecialite>> createManagerCentreSpecialite(
            @RequestBody CentreSpecialiteRequest request, Principal principal) {
        User user = currentUser(principal);
        Long centreId = localCentreId(user);
        if (!centreId.equals(request.getCentreId())) {
            throw new BusinessException("Accès refusé. Vous ne pouvez allouer des spécialités que pour votre propre centre.");
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

    @PutMapping("/centre-specialites/{id}")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<CentreSpecialite>> updateManagerCentreSpecialite(
            @PathVariable Long id, @RequestBody CentreSpecialite allocationDetails, Principal principal) {
        CentreSpecialite allocation = centreSpecialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allocation non trouvée."));
        User user = currentUser(principal);
        if (!localCentreId(user).equals(allocation.getCentre().getId())) {
            throw new BusinessException("Accès refusé. Vous ne pouvez modifier que les allocations de votre propre centre.");
        }
        
        allocation.setNombrePlaces(allocationDetails.getNombrePlaces());
        
        CentreSpecialite updated = centreSpecialiteRepository.save(allocation);
        return ResponseEntity.ok(ApiResponse.<CentreSpecialite>builder()
                .success(true)
                .message("Allocation mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/centre-specialites/{id}")
    @PreAuthorize("hasRole('GESTIONNAIRE_LOCAL')")
    public ResponseEntity<ApiResponse<Void>> deleteManagerCentreSpecialite(@PathVariable Long id, Principal principal) {
        CentreSpecialite allocation = centreSpecialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allocation non trouvée."));
        User user = currentUser(principal);
        if (!localCentreId(user).equals(allocation.getCentre().getId())) {
            throw new BusinessException("Accès refusé. Vous ne pouvez supprimer que les allocations de votre propre centre.");
        }
        centreSpecialiteRepository.delete(allocation);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Allocation supprimée avec succès.")
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

    private void assertCanManageCandidature(Long candidatureId, Principal principal) {
        User user = currentUser(principal);
        if (user.getRole() != Role.GESTIONNAIRE_LOCAL) return;
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new BusinessException("Candidature non trouvée."));
        if (candidature.getCentre() == null || !localCentreId(user).equals(candidature.getCentre().getId())) {
            throw new BusinessException("Accès refusé. Cette candidature n'appartient pas à votre centre.");
        }
    }

    private void assignSpecialite(Salle salle, Specialite requestedSpecialite) {
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

    private void assertLocalScope(Salle salle, User user) {
        if (user.getRole() == Role.GESTIONNAIRE_LOCAL
                && (salle.getCentre() == null || !localCentreId(user).equals(salle.getCentre().getId()))) {
            throw new BusinessException("Accès refusé. Cette salle n'appartient pas à votre centre.");
        }
    }
}
