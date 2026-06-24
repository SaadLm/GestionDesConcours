package com.competition.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration OpenAPI / Swagger UI.
 *
 * Ajoute un bouton "Authorize" dans Swagger UI pour saisir le token JWT.
 * Une fois autorisé, toutes les requêtes Swagger incluront automatiquement
 * le header: Authorization: Bearer <token>
 *
 * Workflow pour tester les endpoints protégés depuis Swagger :
 *   1. Appelez POST /api/v1/auth/login avec vos identifiants
 *   2. Copiez la valeur du champ "token" dans la réponse
 *   3. Cliquez sur le bouton 🔒 "Authorize" en haut de la page Swagger
 *   4. Saisissez : Bearer <votre_token>
 *   5. Cliquez "Authorize" puis "Close"
 *   6. Tous les endpoints protégés fonctionneront désormais
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Gestion des Concours API",
        version = "1.0",
        description = "API de gestion des concours : candidatures, centres, salles et utilisateurs. " +
                      "Utilisez le bouton Authorize pour saisir votre token JWT."
    ),
    security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
    name = "bearerAuth",
    description = "Token JWT obtenu via POST /api/v1/auth/login. Format : Bearer <token>",
    scheme = "bearer",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
    // La configuration est déclarée via les annotations ci-dessus.
    // Aucun bean supplémentaire n'est nécessaire.
}
