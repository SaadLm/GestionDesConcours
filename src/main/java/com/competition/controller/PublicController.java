package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.dto.ConcoursOptionResponse;
import com.competition.model.Candidature;
import com.competition.model.Centre;
import com.competition.model.Concours;
import com.competition.model.CentreSpecialite;
import com.competition.model.Specialite;
import com.competition.repository.CandidatureRepository;
import com.competition.repository.CentreRepository;
import com.competition.repository.ConcoursRepository;
import com.competition.repository.CentreSpecialiteRepository;
import com.competition.repository.SpecialiteRepository;
import com.competition.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

        private final CandidatureService candidatureService;
        private final CandidatureRepository candidatureRepository;
        private final CentreRepository centreRepository;
        private final ConcoursRepository concoursRepository;
        private final CentreSpecialiteRepository centreSpecialiteRepository;
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

        @PostMapping(value = "/postuler-avec-documents", consumes = "multipart/form-data")
        public ResponseEntity<ApiResponse<Candidature>> postulerAvecDocuments(
                        @RequestPart("candidature") Candidature candidature,
                        @RequestPart("cin") MultipartFile cin,
                        @RequestPart("cv") MultipartFile cv,
                        @RequestPart("diplome") MultipartFile diplome) {
                Candidature saved = candidatureService.soumettreCandidatureAvecDocuments(candidature, cin, cv, diplome);
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

        @GetMapping("/concours-options")
        public ResponseEntity<ApiResponse<List<ConcoursOptionResponse>>> getConcoursOptions() {
                List<Concours> openConcours = concoursRepository.findAll().stream()
                        .filter(c -> c.getStatut() != null && ("OUVERT".equalsIgnoreCase(c.getStatut()) || "Ouvert".equalsIgnoreCase(c.getStatut()) || "OPEN".equalsIgnoreCase(c.getStatut())))
                        .collect(Collectors.toList());
                List<CentreSpecialite> allocations = centreSpecialiteRepository.findAll();

                List<ConcoursOptionResponse> options = new java.util.ArrayList<>();
                for (Concours concours : openConcours) {
                        if (concours.getCentre() != null && concours.getSpecialite() != null) {
                                Centre centre = concours.getCentre();
                                Specialite specialite = concours.getSpecialite();
                                Integer nombrePlaces = allocations.stream()
                                        .filter(cs -> cs.getCentre() != null && cs.getSpecialite() != null
                                                && cs.getCentre().getId().equals(centre.getId())
                                                && cs.getSpecialite().getId().equals(specialite.getId()))
                                        .map(CentreSpecialite::getNombrePlaces)
                                        .findFirst()
                                        .orElse(null);

                                options.add(ConcoursOptionResponse.builder()
                                                .optionId(concours.getId() + "-" + centre.getId() + "-" + specialite.getId())
                                                .concoursId(concours.getId())
                                                .concoursTitre(concours.getTitre())
                                                .concoursDescription(concours.getDescription())
                                                .dateConcours(concours.getDateConcours() != null ? concours.getDateConcours().toString() : null)
                                                .dateDebutInscription(concours.getDateDebutInscription() != null ? concours.getDateDebutInscription().toString() : null)
                                                .dateFinInscription(concours.getDateFinInscription() != null ? concours.getDateFinInscription().toString() : null)
                                                .statut(concours.getStatut())
                                                .centreId(centre.getId())
                                                .centreNom(centre.getNom())
                                                .centreVille(centre.getVille())
                                                .centreAdresse(centre.getAdresse())
                                                .specialiteId(specialite.getId())
                                                .specialiteNom(specialite.getNom())
                                                .specialiteDescription(specialite.getDescription())
                                                .nombrePlaces(nombrePlaces)
                                                .build());
                        }
                }

                return ResponseEntity.ok(ApiResponse.<List<ConcoursOptionResponse>>builder()
                        .success(true)
                        .message("Liste des options de concours ouverte récupérée avec succès.")
                        .data(options)
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
