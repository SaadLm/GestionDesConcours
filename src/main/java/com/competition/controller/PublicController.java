package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Candidature;
import com.competition.repository.CandidatureRepository;
import com.competition.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final CandidatureService candidatureService;
    private final CandidatureRepository candidatureRepository;

    @PostMapping("/postuler")
    public ResponseEntity<ApiResponse<Candidature>> postuler(@RequestBody Candidature candidature) {
        Candidature saved = candidatureService.soumettreCandidature(candidature);
        return ResponseEntity.ok(ApiResponse.<Candidature>builder()
                .success(true)
                .message("Votre candidature a été soumise avec succès. Votre numéro est : " + saved.getNumeroCandidature())
                .data(saved)
                .build());
    }

    @GetMapping("/suivi/{numero}")
    public ResponseEntity<ApiResponse<Candidature>> suivre(@PathVariable String numero) {
        return candidatureRepository.findByNumeroCandidature(numero)
                .map(c -> ResponseEntity.ok(ApiResponse.<Candidature>builder()
                        .success(true)
                        .message("Candidature trouvée.")
                        .data(c)
                        .build()))
                .orElse(ResponseEntity.status(404).body(ApiResponse.<Candidature>builder()
                        .success(false)
                        .message("Aucune candidature trouvée avec ce numéro.")
                        .build()));
    }
}
