package com.competition.dto;

import com.competition.model.Candidature;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CentreSallesStateResponse {
    private Long centreId;
    private String centreNom;
    private List<SalleWithCandidatesResponse> salles;
    private List<Candidature> unassignedCandidatures;
}
