package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.repository.CandidatureRepository;
import com.competition.repository.DocumentRepository;
import com.competition.model.Candidature;
import com.competition.model.Document;
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

@RestController
@RequestMapping("/api/v1/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final CandidatureRepository candidatureRepository;
    private final CandidatureService candidatureService;
    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;

    @GetMapping("/candidatures")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_LOCAL', 'GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<Candidature>>> getCandidatures(
            @RequestParam(required = false) Long centreId,
            @RequestParam(required = false) Long concoursId) {

        List<Candidature> list;
        if (concoursId != null) {
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
    public ResponseEntity<ApiResponse<Void>> valider(@PathVariable Long id) {
        candidatureService.validerCandidature(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Candidature validée avec succès.")
                .build());
    }

    @PostMapping("/candidatures/{id}/rejeter")
    @PreAuthorize("hasAnyRole('GESTIONNAIRE_LOCAL', 'GESTIONNAIRE_GLOBAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rejeter(@PathVariable Long id, @RequestParam String commentaire) {
        candidatureService.rejeterCandidature(id, commentaire);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Candidature rejetée.")
                .build());
    }
}
