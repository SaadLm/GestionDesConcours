package com.competition.dto;

import com.competition.model.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private String nom;
    private String prenom;
    private String email;
    private String password; // Nullable during update
    private Role role;
    private Long centreId; // Nullable if not GESTIONNAIRE_LOCAL
}
