package com.competition.dto;

import com.competition.model.Candidature;
import com.competition.model.Salle;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalleWithCandidatesResponse {
    private Salle salle;
    private List<Candidature> candidatures;
}
