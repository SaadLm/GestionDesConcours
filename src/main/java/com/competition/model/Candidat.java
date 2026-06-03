package com.competition.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "candidats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String cin;

    @Column(nullable = false)
    private LocalDate dateNaissance;

    private String lieuNaissance;
    private String adresse;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String telephone;

    @OneToMany(mappedBy = "candidat", cascade = CascadeType.ALL)
    private List<Diplome> diplomes;
}
