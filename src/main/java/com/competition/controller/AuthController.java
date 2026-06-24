package com.competition.controller;

import com.competition.dto.AuthenticationRequest;
import com.competition.dto.AuthenticationResponse;
import com.competition.model.User;
import com.competition.repository.UserRepository;
import com.competition.security.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur d'authentification.
 *
 * Gère la connexion (login) et la déconnexion (logout) des utilisateurs.
 * Endpoints disponibles :
 *   POST /api/v1/auth/login   → Connexion, retourne un JWT + infos utilisateur
 *   POST /api/v1/auth/logout  → Déconnexion, invalide le token en base de données
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentification", description = "Endpoints de connexion et déconnexion")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    /**
     * Connexion d'un utilisateur.
     *
     * Vérifie les identifiants (email + mot de passe), génère un token JWT,
     * le sauvegarde en base de données (activeToken) et le retourne au client
     * avec les informations de l'utilisateur (rôle, nom, centreId si applicable).
     *
     * Le frontend doit stocker ce token dans le sessionStorage et l'envoyer
     * dans le header "Authorization: Bearer <token>" pour chaque requête protégée.
     *
     * @param request Corps JSON contenant { "email": "...", "password": "..." }
     * @return 200 OK avec { token, role, email, fullName, centreId } en cas de succès
     *         401 Unauthorized si les identifiants sont incorrects
     */
    @Operation(
        summary = "Connexion utilisateur",
        description = "Authentifie un utilisateur avec email et mot de passe. " +
                      "Retourne un JWT à utiliser dans le header Authorization pour les requêtes suivantes."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Connexion réussie",
            content = @Content(schema = @Schema(implementation = AuthenticationResponse.class))),
        @ApiResponse(responseCode = "401", description = "Email ou mot de passe incorrect"),
        @ApiResponse(responseCode = "500", description = "Erreur interne du serveur")
    })
    @PostMapping("/login")
    public ResponseEntity<?> authenticate(@RequestBody AuthenticationRequest request) {
        try {
            // 1. Vérification des identifiants via Spring Security
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            // Mauvais email ou mot de passe
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Email ou mot de passe incorrect"));
        } catch (Exception e) {
            // Autre erreur d'authentification (compte désactivé, etc.)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentification échouée: " + e.getMessage()));
        }

        // 2. Chargement des détails de l'utilisateur pour générer le JWT
        final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        final String jwt = jwtUtils.generateToken(userDetails);

        // 3. Mise à jour du activeToken en base de données
        //    (permet la validation côté serveur à chaque requête)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé après authentification"));
        user.setActiveToken(jwt);
        userRepository.save(user);

        // 4. Construction de la réponse avec toutes les infos nécessaires au frontend
        AuthenticationResponse response = AuthenticationResponse.builder()
                .token(jwt)
                .role(user.getRole().name())
                .email(user.getEmail())
                .fullName(user.getPrenom() + " " + user.getNom())
                .centreId(user.getCentre() != null ? user.getCentre().getId() : null)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Déconnexion d'un utilisateur.
     *
     * Invalide le token JWT côté serveur en mettant à null le champ activeToken
     * dans la base de données. Le frontend doit également supprimer le token
     * de son sessionStorage.
     *
     * Requiert un header : Authorization: Bearer <token>
     *
     * @param request La requête HTTP contenant le header Authorization
     * @return 200 OK si déconnexion réussie, 400 si token manquant
     */
    @Operation(
        summary = "Déconnexion utilisateur",
        description = "Invalide le token JWT en base de données. " +
                      "Le client doit également supprimer le token de son sessionStorage."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Déconnexion réussie"),
        @ApiResponse(responseCode = "400", description = "Token manquant ou invalide")
    })
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Token d'authentification manquant"));
        }

        final String jwt = authHeader.substring(7);

        try {
            // Extraction de l'email depuis le token pour trouver l'utilisateur
            final String userEmail = jwtUtils.extractUsername(jwt);

            if (userEmail != null) {
                userRepository.findByEmail(userEmail).ifPresent(user -> {
                    // Invalidation du token en base de données
                    user.setActiveToken(null);
                    userRepository.save(user);
                });
            }
        } catch (Exception e) {
            // Token déjà expiré ou invalide — on considère la déconnexion réussie quand même
        }

        return ResponseEntity.ok(Map.of("message", "Déconnexion réussie"));
    }
}
