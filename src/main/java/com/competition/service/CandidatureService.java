package com.competition.service;

import com.competition.exception.BusinessException;
import com.competition.model.*;
import com.competition.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CandidatureService {
    private final CandidatureRepository candidatureRepository;
    private final CentreSpecialiteRepository centreSpecialiteRepository;
    private final CandidatRepository candidatRepository;
    private final SalleRepository salleRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public Candidature soumettreCandidature(Candidature candidature) {
        // 1. Détection des doublons (Règle 2)
        if (candidatureRepository.existsByCandidatCinAndConcoursIdAndSpecialiteId(
                candidature.getCandidat().getCin(),
                candidature.getConcours().getId(),
                candidature.getSpecialite().getId())) {
            throw new BusinessException("Vous avez déjà soumis une candidature pour ce concours et cette spécialité.");
        }

        // 2. Génération du numéro unique (Règle 1)
        candidature.setNumeroCandidature(genererNumeroUnique());

        // 3. Sauvegarde du candidat s'il n'existe pas ou mise à jour de ses diplômes
        Candidat candidat = candidatRepository.findByCin(candidature.getCandidat().getCin())
                .orElseGet(() -> {
                    Candidat newCandidat = candidature.getCandidat();
                    if (newCandidat.getDiplomes() != null) {
                        newCandidat.getDiplomes().forEach(d -> d.setCandidat(newCandidat));
                    }
                    return candidatRepository.save(newCandidat);
                });

        if (candidature.getCandidat().getDiplomes() != null) {
            final Candidat finalCandidat = candidat;
            if (finalCandidat.getDiplomes() == null) {
                finalCandidat.setDiplomes(new java.util.ArrayList<>());
            }
            candidature.getCandidat().getDiplomes().forEach(d -> {
                boolean exists = finalCandidat.getDiplomes().stream()
                        .anyMatch(existing -> existing.getNomDiplome().equalsIgnoreCase(d.getNomDiplome())
                                && existing.getNiveau().equalsIgnoreCase(d.getNiveau())
                                && existing.getSpecialite().equalsIgnoreCase(d.getSpecialite()));
                if (!exists) {
                    d.setCandidat(finalCandidat);
                    finalCandidat.getDiplomes().add(d);
                }
            });
            candidat = candidatRepository.save(finalCandidat);
        }

        candidature.setCandidat(candidat);

        return candidatureRepository.save(candidature);
    }

    @Transactional
    public Candidature soumettreCandidatureAvecDocuments(Candidature candidature,
            MultipartFile cin, MultipartFile cv, MultipartFile diplome) {
        Candidature saved = soumettreCandidature(candidature);
        List<Document> documents = new ArrayList<>();
        documents.add(createDocument(saved, cin, TypeDocument.CIN, "cin"));
        documents.add(createDocument(saved, cv, TypeDocument.CV, "cv"));
        documents.add(createDocument(saved, diplome, TypeDocument.DIPLOME, "diplome"));
        saved.setDocuments(documents);
        return candidatureRepository.save(saved);
    }

    private Document createDocument(Candidature candidature, MultipartFile file,
            TypeDocument type, String prefix) {
        String storedName = fileStorageService.storePdf(file, prefix);
        return Document.builder()
                .candidature(candidature)
                .nomFichier(file.getOriginalFilename())
                .cheminFichier(storedName)
                .typeDocument(type)
                .build();
    }


    @Autowired
    private EmailService emailService;
    @Transactional
    public void validerCandidature(Long candidatureId) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new BusinessException("Candidature non trouvée."));

        // 4. Gestion des places / Quotas (Règle 4)
        CentreSpecialite cs = centreSpecialiteRepository.findByCentreIdAndSpecialiteId(
                candidature.getCentre().getId(),
                candidature.getSpecialite().getId())
                .orElseThrow(() -> new BusinessException("Cette spécialité n'est pas proposée dans ce centre."));

        long placesOccupees = candidatureRepository.countByCentreIdAndSpecialiteIdAndStatut(
                candidature.getCentre().getId(),
                candidature.getSpecialite().getId(),
                StatutCandidature.VALIDEE);

        if (placesOccupees >= cs.getNombrePlaces()) {
            throw new BusinessException("Le quota de places pour cette spécialité dans ce centre est atteint.");
        }

        // Automatic room (salle) allocation
        List<Salle> salles = salleRepository.findByCentreId(candidature.getCentre().getId()).stream()
                .filter(salle -> salle.getSpecialite() != null
                        ? salle.getSpecialite().getId().equals(candidature.getSpecialite().getId())
                        : candidatureRepository.countBySalleId(salle.getId()) == 0)
                .toList();
        Salle assignedSalle = null;
        for (Salle salle : salles) {
            long assignedCount = candidatureRepository.countBySalleId(salle.getId());
            if (assignedCount < salle.getCapacite()) {
                assignedSalle = salle;
                break;
            }
        }

        if (assignedSalle == null) {
            if (salles.isEmpty()) {
                throw new BusinessException("Impossible de valider: Aucune salle n'est configurée pour ce centre.");
            } else {
                throw new BusinessException("Impossible de valider: Toutes les salles de ce centre sont pleines.");
            }
        }

        if (assignedSalle.getSpecialite() == null) {
            assignedSalle.setSpecialite(candidature.getSpecialite());
            salleRepository.save(assignedSalle);
        }
        candidature.setSalle(assignedSalle);
        candidature.setStatut(StatutCandidature.VALIDEE);
        candidatureRepository.save(candidature);

        
            String htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto;'>"
    + "<div style='background-color: #16a34a; padding: 20px; text-align: center;'>"
    + "<h1 style='color: #ffffff; margin: 0;'>Concours - Ministère des Finances</h1>"
    + "</div>"
    + "<div style='padding: 25px; border: 1px solid #e5e7eb; border-top: none;'>"
    + "<h2 style='color: #166534;'>Candidature validée</h2>"
    + "<p>Bonjour " + candidature.getCandidat().getNom() + " " + candidature.getCandidat().getPrenom() + ",</p>"
    + "<p>Nous avons le plaisir de vous informer que votre candidature a été <strong>validée</strong> avec succès.</p>"
    + "<p><strong>Numéro de suivi :</strong> " + candidature.getNumeroCandidature() + "</p>"
    + "<p>Vous pouvez suivre l'évolution de votre dossier à tout moment à l'aide de ce numéro sur notre plateforme.</p>"
    + "<p>Nous vous tiendrons informé(e) des prochaines étapes (convocation, centre d'examen, etc.) dans les meilleurs délais.</p>"
    + "<p style='margin-top: 30px;'>Cordialement,<br>L'équipe de gestion des concours</p>"
    + "</div>"
    + "<div style='background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 0.85em; color: #6b7280;'>"
    + "Ceci est un message automatique, merci de ne pas y répondre directement."
    + "</div>"
    + "</div>";
        emailService.sendHtmlEmail(
            candidature.getCandidat().getEmail(),
            "Votre candidature a été validée",
            htmlBody
        
        );
    

    }

    @Transactional
    public void rejeterCandidature(Long candidatureId, String commentaire) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new BusinessException("Candidature non trouvée."));

        candidature.setStatut(StatutCandidature.REJETEE);
        candidature.setCommentaire(commentaire);

        candidatureRepository.save(candidature);
        String htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto;'>"
            + "<div style='background-color: #f97316; padding: 20px; text-align: center;'>"
            + "<h1 style='color: #ffffff; margin: 0;'>Concours - Ministère des Finances</h1>"
            + "</div>"
            + "<div style='padding: 25px; border: 1px solid #e5e7eb; border-top: none;'>"
            + "<h2 style='color: #991b1b;'>Statut de votre candidature</h2>"
            + "<p>Bonjour " + candidature.getCandidat().getNom() + " " + candidature.getCandidat().getPrenom() + ",</p>"
            + "<p>Nous vous remercions pour l'intérêt que vous avez porté à ce concours et pour le temps consacré à votre candidature.</p>"
            + "<p>Après étude de votre dossier (numéro <strong>" + candidature.getNumeroCandidature() + "</strong>), "
            + "nous sommes au regret de vous informer que celui-ci n'a pas été retenu pour cette session.</p>"
            + "<p>Nous vous encourageons à consulter les prochaines sessions de concours qui pourraient correspondre à votre profil.</p>"
            + "<p>Nous vous souhaitons plein succès dans vos démarches futures.</p>"
            + "<p style='margin-top: 30px;'>Cordialement,<br>L'équipe de gestion des concours</p>"
            + "</div>"
            + "<div style='background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 0.85em; color: #6b7280;'>"
            + "Ceci est un message automatique, merci de ne pas y répondre directement."
            + "</div>"
            + "</div>";

    
        emailService.sendHtmlEmail(
            candidature.getCandidat().getEmail(),
            "Résultat de votre candidature",
            htmlBody
        );
    }

    @Transactional
    public void affecterCandidatureASalle(Long candidatureId, Long salleId) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new BusinessException("Candidature non trouvée."));

        if (candidature.getStatut() != StatutCandidature.VALIDEE) {
            throw new BusinessException("La candidature doit être validée pour être affectée à une salle.");
        }

        if (salleId == null) {
            candidature.setSalle(null);
            candidatureRepository.save(candidature);
            return;
        }

        Salle salle = salleRepository.findById(salleId)
                .orElseThrow(() -> new BusinessException("Salle spécifiée non trouvée."));

        if (!salle.getCentre().getId().equals(candidature.getCentre().getId())) {
            throw new BusinessException("La salle spécifiée n'appartient pas au centre de cette candidature.");
        }

        if (salle.getSpecialite() != null
                && !salle.getSpecialite().getId().equals(candidature.getSpecialite().getId())) {
            throw new BusinessException("La salle spécifiée n'est pas affectée à la spécialité de cette candidature.");
        }

        if (salle.getSpecialite() == null) {
            salle.setSpecialite(candidature.getSpecialite());
            salleRepository.save(salle);
        }

        long assignedCount = candidatureRepository.countBySalleId(salle.getId());
        if (candidature.getSalle() != null && candidature.getSalle().getId().equals(salle.getId())) {
            return;
        }

        if (assignedCount >= salle.getCapacite()) {
            throw new BusinessException("La salle spécifiée est déjà pleine.");
        }

        candidature.setSalle(salle);
        candidatureRepository.save(candidature);
    }

    private String genererNumeroUnique() {
        String year = String.valueOf(Year.now().getValue());
        int randomNum = new Random().nextInt(999999);
        String formattedNum = String.format("%06d", randomNum);
        String numero = "CAND-" + year + "-" + formattedNum;

        // Vérifier l'unicité
        if (candidatureRepository.findByNumeroCandidature(numero).isPresent()) {
            return genererNumeroUnique();
        }
        return numero;
    }
}
