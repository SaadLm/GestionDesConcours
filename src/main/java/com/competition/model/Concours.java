package com.competition.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "concours")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Concours {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate dateConcours;

    @Column(nullable = false)
    private LocalDate dateDebutInscription;

    @Column(nullable = false)
    private LocalDate dateFinInscription;

    @Column(nullable = false)
    private String statut; // e.g., OUVERT, FERME, TERMINE
}
