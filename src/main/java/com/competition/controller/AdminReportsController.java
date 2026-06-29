package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Candidature;
import com.competition.repository.CandidatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
public class AdminReportsController {

    private final CandidatureRepository candidatureRepository;

    @PostMapping("/by-concours")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportByConcours(
            @RequestParam(required = false) Long concoursId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        List<Candidature> candidatures = candidatureRepository.findAll();
        
        // Filter by concours if provided
        if (concoursId != null) {
            candidatures = candidatures.stream()
                    .filter(c -> c.getConcours() != null && c.getConcours().getId().equals(concoursId))
                    .collect(Collectors.toList());
        }
        
        Map<String, Object> report = buildReportData(candidatures, "Concours");
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Rapport généré avec succès.")
                .data(report)
                .build());
    }

    @PostMapping("/by-specialite")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportBySpecialite(
            @RequestParam(required = false) Long specialiteId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        List<Candidature> candidatures = candidatureRepository.findAll();
        
        // Filter by speciality if provided
        if (specialiteId != null) {
            candidatures = candidatures.stream()
                    .filter(c -> c.getSpecialite() != null && c.getSpecialite().getId().equals(specialiteId))
                    .collect(Collectors.toList());
        }
        
        Map<String, Object> report = buildReportData(candidatures, "Spécialité");
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Rapport généré avec succès.")
                .data(report)
                .build());
    }

    @PostMapping("/by-centre")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportByCenter(
            @RequestParam(required = false) Long centreId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        List<Candidature> candidatures = candidatureRepository.findAll();
        
        // Filter by centre if provided
        if (centreId != null) {
            candidatures = candidatures.stream()
                    .filter(c -> c.getCentre() != null && c.getCentre().getId().equals(centreId))
                    .collect(Collectors.toList());
        }
        
        Map<String, Object> report = buildReportData(candidatures, "Centre");
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Rapport généré avec succès.")
                .data(report)
                .build());
    }

    @GetMapping("/global-statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGlobalStatistics() {
        List<Candidature> candidatures = candidatureRepository.findAll();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCandidatures", candidatures.size());
        stats.put("validees", candidatures.stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equals("VALIDEE"))
                .count());
        stats.put("rejetees", candidatures.stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equals("REJETEE"))
                .count());
        stats.put("enAttente", candidatures.stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equals("EN_ATTENTE"))
                .count());
        stats.put("generatedAt", LocalDate.now().toString());
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Statistiques globales récupérées.")
                .data(stats)
                .build());
    }

    private Map<String, Object> buildReportData(List<Candidature> candidatures, String reportType) {
        Map<String, Object> report = new HashMap<>();
        
        report.put("type", reportType);
        report.put("generatedAt", LocalDate.now().toString());
        report.put("totalCandidatures", candidatures.size());
        
        long validees = candidatures.stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equals("VALIDEE"))
                .count();
        long rejetees = candidatures.stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equals("REJETEE"))
                .count();
        long enAttente = candidatures.stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equals("EN_ATTENTE"))
                .count();
        
        report.put("validees", validees);
        report.put("rejetees", rejetees);
        report.put("enAttente", enAttente);
        
        if (candidatures.size() > 0) {
            report.put("tauxReussite", String.format("%.2f%%", (validees * 100.0) / candidatures.size()));
        }
        
        return report;
    }
}
