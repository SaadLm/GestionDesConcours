package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Centre;
import com.competition.model.Salle;
import com.competition.repository.CentreRepository;
import com.competition.repository.SalleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/salles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SalleAdminController {

    private final SalleRepository salleRepository;
    private final CentreRepository centreRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Salle>>> getAllSalles() {
        List<Salle> salles = salleRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Salle>>builder()
                .success(true)
                .message("Liste des salles récupérée avec succès.")
                .data(salles)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Salle>> getSalleById(@PathVariable Long id) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée."));
        return ResponseEntity.ok(ApiResponse.<Salle>builder()
                .success(true)
                .message("Salle récupérée avec succès.")
                .data(salle)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Salle>> createSalle(@RequestBody Salle salle) {
        Long centreId = salle.getCentre() != null ? salle.getCentre().getId() : null;
        if (centreId == null) {
            throw new RuntimeException("Un centre doit être fourni pour la salle.");
        }

        Centre centre = centreRepository.findById(centreId)
                .orElseThrow(() -> new RuntimeException("Centre non trouvé."));
        salle.setCentre(centre);

        Salle saved = salleRepository.save(salle);
        return ResponseEntity.ok(ApiResponse.<Salle>builder()
                .success(true)
                .message("Salle créée avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Salle>> updateSalle(@PathVariable Long id, @RequestBody Salle request) {
        Salle salle = salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée."));

        salle.setNom(request.getNom());
        salle.setCapacite(request.getCapacite());
        if (request.getCentre() != null && request.getCentre().getId() != null) {
            Centre centre = centreRepository.findById(request.getCentre().getId())
                    .orElseThrow(() -> new RuntimeException("Centre non trouvé."));
            salle.setCentre(centre);
        }

        Salle updated = salleRepository.save(salle);
        return ResponseEntity.ok(ApiResponse.<Salle>builder()
                .success(true)
                .message("Salle mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSalle(@PathVariable Long id) {
        salleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée."));
        salleRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Salle supprimée avec succès.")
                .build());
    }
}
