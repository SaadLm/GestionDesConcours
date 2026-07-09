package com.competition.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConcoursOptionResponse {
    private String optionId;
    private Long concoursId;
    private String concoursTitre;
    private String concoursDescription;
    private String dateConcours;
    private String dateDebutInscription;
    private String dateFinInscription;
    private String statut;
    private Long centreId;
    private String centreNom;
    private String centreVille;
    private String centreAdresse;
    private Long specialiteId;
    private String specialiteNom;
    private String specialiteDescription;
    private Integer nombrePlaces;
}
