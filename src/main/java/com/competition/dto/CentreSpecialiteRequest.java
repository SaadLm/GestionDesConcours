package com.competition.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CentreSpecialiteRequest {
    private Long centreId;
    private Long specialiteId;
    private Integer nombrePlaces;
}
