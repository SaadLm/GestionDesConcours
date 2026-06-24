package com.competition.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "candidatures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numeroCandidature;

    @ManyToOne
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;

    @ManyToOne
    @JoinColumn(name = "concours_id", nullable = false)
    private Concours concours;

    @ManyToOne
    @JoinColumn(name = "specialite_id", nullable = false)
    private Specialite specialite;

    @ManyToOne
    @JoinColumn(name = "centre_id", nullable = false)
    private Centre centre;

    private LocalDateTime dateSoumission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutCandidature statut;

    private String commentaire;

    @OneToMany(mappedBy = "candidature", cascade = CascadeType.ALL)
    private List<Document> documents;

    @ManyToOne
    @JoinColumn(name = "salle_id")
    private Salle salle;

    @PrePersist
    protected void onCreate() {
        dateSoumission = LocalDateTime.now();
        if (statut == null) {
            statut = StatutCandidature.EN_ATTENTE;
        }
    }
}
