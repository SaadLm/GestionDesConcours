package com.competition.dto;

import lombok.*;

/**
 * DTO renvoyé au client après une connexion réussie.
 * Contient le token JWT, le rôle et les informations de l'utilisateur
 * pour que le frontend puisse router vers le bon tableau de bord.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {

    /** Le token JWT à stocker dans le sessionStorage du navigateur */
    private String token;

    /** Le rôle de l'utilisateur (ex: ADMIN, GESTIONNAIRE_GLOBAL, GESTIONNAIRE_LOCAL) */
    private String role;

    /** L'email de l'utilisateur connecté */
    private String email;

    /** Le prénom et nom complet de l'utilisateur */
    private String fullName;

    /** L'ID du centre rattaché (uniquement pour GESTIONNAIRE_LOCAL) */
    private Long centreId;
}