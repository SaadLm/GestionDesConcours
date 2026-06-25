package com.competition.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore
    private List<CentreSpecialite> centreSpecialites;

    @OneToMany(mappedBy = "centre", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Salle> salles;
}
