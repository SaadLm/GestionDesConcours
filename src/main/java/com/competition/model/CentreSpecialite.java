package com.competition.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "centre_specialites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CentreSpecialite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "centre_id", nullable = false)
    @JsonIgnore
    private Centre centre;

    @ManyToOne
    @JoinColumn(name = "specialite_id", nullable = false)
    private Specialite specialite;

    @Column(nullable = false)
    private Integer nombrePlaces;
}
