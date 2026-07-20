package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.repository.CandidatureRepository;
import com.competition.repository.DocumentRepository;
import com.competition.repository.UserRepository;
import com.competition.model.Candidature;
import com.competition.model.Document;
import com.competition.model.Role;
import com.competition.model.User;
import com.competition.model.Centre;
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
}
