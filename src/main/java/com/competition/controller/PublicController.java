package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Candidature;
import com.competition.model.Centre;
import com.competition.model.Concours;
import com.competition.model.Specialite;
import com.competition.repository.CandidatureRepository;
import com.competition.repository.CentreRepository;
import com.competition.repository.ConcoursRepository;
import com.competition.repository.SpecialiteRepository;
import com.competition.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

        private final CandidatureService candidatureService;
        private final CandidatureRepository candidatureRepository;
        private final CentreRepository centreRepository;
        private final ConcoursRepository concoursRepository;
        private final SpecialiteRepository specialiteRepository;

        @PostMapping("/postuler")
        public ResponseEntity<ApiResponse<Candidature>> postuler(@RequestBody Candidature candidature) {
                Candidature saved = candidatureService.soumettreCandidature(candidature);
                return ResponseEntity.ok(ApiResponse.<Candidature>builder()
                                .success(true)
                                .message("Votre candidature a été soumise avec succès. Votre numéro est : "
                                                + saved.getNumeroCandidature())
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

        @GetMapping("/centres")
        public ResponseEntity<ApiResponse<List<Centre>>> getCentres() {
                List<Centre> centres = centreRepository.findAll();
                return ResponseEntity.ok(ApiResponse.<List<Centre>>builder()
                                .success(true)
                                .message("Liste des centres récupérée avec succès.")
                                .data(centres)
                                .build());
        }

        @GetMapping("/concours")
        public ResponseEntity<ApiResponse<List<Concours>>> getConcours() {
                List<Concours> concours = concoursRepository.findAll();
                return ResponseEntity.ok(ApiResponse.<List<Concours>>builder()
                                .success(true)
                                .message("Liste des concours récupérée avec succès.")
                                .data(concours)
                                .build());
        }

        @GetMapping("/specialites")
        public ResponseEntity<ApiResponse<List<Specialite>>> getSpecialites() {
                List<Specialite> specialites = specialiteRepository.findAll();
                return ResponseEntity.ok(ApiResponse.<List<Specialite>>builder()
                                .success(true)
                                .message("Liste des spécialités récupérée avec succès.")
                                .data(specialites)
                                .build());
        }
}
