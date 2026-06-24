package com.competition.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "centres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Centre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String ville;

    private String adresse;
    private String telephone;

    @OneToMany(mappedBy = "centre")
    private List<CentreSpecialite> centreSpecialites;

    @OneToMany(mappedBy = "centre", cascade = CascadeType.ALL)
    private List<Salle> salles;
}
