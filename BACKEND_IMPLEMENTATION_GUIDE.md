# Frontend Refactoring - Backend Implementation Guide

## Summary of Frontend Changes Completed ✅

The **Administrateur** component has been refactored from a single monolithic component into a modular architecture with multiple specialized sub-pages:

### New Frontend Structure
```
/administrateur (Dashboard with tabs)
├── /administrateur/users (User Management - ADMIN only)
├── /administrateur/roles (Roles & Access - ADMIN only)
├── /administrateur/settings (Platform Settings - ADMIN only)
├── /administrateur/competitions (Competition Management - ADMIN + GLOBAL)
├── /administrateur/specialties (Specialty Allocation - ADMIN + GLOBAL)
└── /administrateur/reports (Reports & Statistics - ADMIN + GLOBAL)
```

### Frontend Components Created
1. **AdministrateurDashboardComponent** - Main container with tab navigation
2. **UserManagementComponent** - Create, edit, delete users
3. **RolesAccessComponent** - Manage user roles and access rights
4. **PlatformSettingsComponent** - Configure general platform settings
5. **CompetitionManagementComponent** - Create and manage competitions
6. **SpecialtyAllocationComponent** - Allocate specialties to centers
7. **ReportsStatisticsComponent** - Generate reports and statistics

---

## Backend Implementation Required

### 1. Create ConcoursController (NEW)
**Path**: `src/main/java/com/competition/controller/ConcoursController.java`

```java
package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Concours;
import com.competition.repository.ConcoursRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/concours")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
public class ConcoursController {

    private final ConcoursRepository concoursRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Concours>>> getAllConcours() {
        List<Concours> concours = concoursRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Concours>>builder()
                .success(true)
                .message("Liste des concours récupérée avec succès.")
                .data(concours)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Concours>> getConcoursById(@PathVariable Long id) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours récupéré avec succès.")
                .data(concours)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Concours>> createConcours(@RequestBody Concours concours) {
        Concours saved = concoursRepository.save(concours);
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours créé avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Concours>> updateConcours(
            @PathVariable Long id, @RequestBody Concours concoursDetails) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        
        concours.setTitre(concoursDetails.getTitre());
        concours.setDescription(concoursDetails.getDescription());
        concours.setDateConcours(concoursDetails.getDateConcours());
        concours.setDateDebutInscription(concoursDetails.getDateDebutInscription());
        concours.setDateFinInscription(concoursDetails.getDateFinInscription());
        concours.setStatut(concoursDetails.getStatut());
        
        Concours updated = concoursRepository.save(concours);
        return ResponseEntity.ok(ApiResponse.<Concours>builder()
                .success(true)
                .message("Concours mis à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteConcours(@PathVariable Long id) {
        Concours concours = concoursRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Concours non trouvé."));
        concoursRepository.delete(concours);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Concours supprimé avec succès.")
                .build());
    }
}
```

### 2. Create SpecialiteController (NEW)
**Path**: `src/main/java/com/competition/controller/SpecialiteController.java`

```java
package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.Specialite;
import com.competition.repository.SpecialiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/specialites")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
public class SpecialiteController {

    private final SpecialiteRepository specialiteRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Specialite>>> getAllSpecialites() {
        List<Specialite> specialites = specialiteRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<Specialite>>builder()
                .success(true)
                .message("Liste des spécialités récupérée avec succès.")
                .data(specialites)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Specialite>> getSpecialiteById(@PathVariable Long id) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée."));
        return ResponseEntity.ok(ApiResponse.<Specialite>builder()
                .success(true)
                .message("Spécialité récupérée avec succès.")
                .data(specialite)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Specialite>> createSpecialite(@RequestBody Specialite specialite) {
        Specialite saved = specialiteRepository.save(specialite);
        return ResponseEntity.ok(ApiResponse.<Specialite>builder()
                .success(true)
                .message("Spécialité créée avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Specialite>> updateSpecialite(
            @PathVariable Long id, @RequestBody Specialite specialiteDetails) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée."));
        
        specialite.setNom(specialiteDetails.getNom());
        specialite.setDescription(specialiteDetails.getDescription());
        
        Specialite updated = specialiteRepository.save(specialite);
        return ResponseEntity.ok(ApiResponse.<Specialite>builder()
                .success(true)
                .message("Spécialité mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSpecialite(@PathVariable Long id) {
        Specialite specialite = specialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spécialité non trouvée."));
        specialiteRepository.delete(specialite);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Spécialité supprimée avec succès.")
                .build());
    }
}
```

### 3. Create CentreSpecialiteController (NEW)
**Path**: `src/main/java/com/competition/controller/CentreSpecialiteController.java`

For managing specialty allocations to centers.

```java
package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.model.CentreSpecialite;
import com.competition.repository.CentreSpecialiteRepository;
import com.competition.repository.CentreRepository;
import com.competition.repository.SpecialiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/centre-specialites")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
public class CentreSpecialiteController {

    private final CentreSpecialiteRepository centreSpecialiteRepository;
    private final CentreRepository centreRepository;
    private final SpecialiteRepository specialiteRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CentreSpecialite>>> getAllCentreSpecialites() {
        List<CentreSpecialite> list = centreSpecialiteRepository.findAll();
        return ResponseEntity.ok(ApiResponse.<List<CentreSpecialite>>builder()
                .success(true)
                .message("Allocations récupérées avec succès.")
                .data(list)
                .build());
    }

    @GetMapping("/centre/{centreId}")
    public ResponseEntity<ApiResponse<List<CentreSpecialite>>> getSpecialitesByCenter(
            @PathVariable Long centreId) {
        List<CentreSpecialite> specialites = centreSpecialiteRepository
                .findById_CentreId(centreId); // You may need to add this method
        return ResponseEntity.ok(ApiResponse.<List<CentreSpecialite>>builder()
                .success(true)
                .message("Spécialités du centre récupérées.")
                .data(specialites)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CentreSpecialite>> createAllocation(
            @RequestBody CentreSpecialite allocation) {
        CentreSpecialite saved = centreSpecialiteRepository.save(allocation);
        return ResponseEntity.ok(ApiResponse.<CentreSpecialite>builder()
                .success(true)
                .message("Allocation créée avec succès.")
                .data(saved)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CentreSpecialite>> updateAllocation(
            @PathVariable Long id, @RequestBody CentreSpecialite allocationDetails) {
        CentreSpecialite allocation = centreSpecialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allocation non trouvée."));
        
        allocation.setNombrePlaces(allocationDetails.getNombrePlaces());
        
        CentreSpecialite updated = centreSpecialiteRepository.save(allocation);
        return ResponseEntity.ok(ApiResponse.<CentreSpecialite>builder()
                .success(true)
                .message("Allocation mise à jour avec succès.")
                .data(updated)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAllocation(@PathVariable Long id) {
        CentreSpecialite allocation = centreSpecialiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Allocation non trouvée."));
        centreSpecialiteRepository.delete(allocation);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Allocation supprimée avec succès.")
                .build());
    }
}
```

### 4. Update Authorization in Existing Controllers

#### CentreController
Change from `@PreAuthorize("hasRole('ADMIN')")` to:
```java
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
```
For GET methods only. Keep POST, PUT, DELETE as ADMIN only.

### 5. Create ReportsController (NEW)
**Path**: `src/main/java/com/competition/controller/ReportsController.java`

```java
package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.repository.CandidatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL')")
public class ReportsController {

    private final CandidatureRepository candidatureRepository;

    @PostMapping("/by-concours")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reportByConcours(
            @RequestParam(required = false) Long concoursId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        // Generate report by competition
        Map<String, Object> report = new HashMap<>();
        report.put("type", "by_concours");
        report.put("timestamp", System.currentTimeMillis());
        
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
        
        // Generate report by specialty
        Map<String, Object> report = new HashMap<>();
        report.put("type", "by_specialite");
        report.put("timestamp", System.currentTimeMillis());
        
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
        
        // Generate report by examination center
        Map<String, Object> report = new HashMap<>();
        report.put("type", "by_centre");
        report.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .success(true)
                .message("Rapport généré avec succès.")
                .data(report)
                .build());
    }
}
```

---

## Summary of Changes

### Completed ✅
- Frontend refactored into modular components
- App routing updated to support nested administrateur routes
- UI/UX improved with tab navigation and better organization

### Still Needed (Backend)
1. Create **ConcoursController**
2. Create **SpecialiteController**
3. Create **CentreSpecialiteController**
4. Create **ReportsController**
5. Update authorization in **CentreController** (GET methods)
6. Create DTOs if needed (ConcoursDto, SpecialiteDto, etc.)
7. Add ReportingService for complex statistics

### Authorization Summary
- **User Management**: ADMIN only
- **Roles & Access**: ADMIN only
- **Platform Settings**: ADMIN only
- **Competition Management**: ADMIN + GESTIONNAIRE_GLOBAL
- **Specialty Allocation**: ADMIN + GESTIONNAIRE_GLOBAL
- **Reports & Statistics**: ADMIN + GESTIONNAIRE_GLOBAL

