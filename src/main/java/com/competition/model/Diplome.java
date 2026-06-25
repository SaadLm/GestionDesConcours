package com.competition.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "diplomes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Diplome {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "candidat_id", nullable = false)
    @JsonIgnore
    private Candidat candidat;

    @Column(nullable = false)
    private String nomDiplome;

    @Column(nullable = false)
    private String niveau;

    @Column(nullable = false)
    private String specialite;

    @Column(nullable = false)
    private Integer anneeObtention;
}
