package com.competition.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "salles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Salle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private Integer capacite;

    @ManyToOne
    @JoinColumn(name = "centre_id", nullable = false)
    private Centre centre;

    @ManyToOne
    @JoinColumn(name = "specialite_id")
    private Specialite specialite;
}
