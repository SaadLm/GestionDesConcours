package com.competition.config;

import com.competition.model.Centre;
import com.competition.model.Role;
import com.competition.model.Salle;
import com.competition.model.User;
import com.competition.repository.CentreRepository;
import com.competition.repository.SalleRepository;
import com.competition.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CentreRepository centreRepository;
    private final SalleRepository salleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("admin@competition.com").isEmpty()) {
            User admin = User.builder()
                    .nom("Admin")
                    .prenom("App")
                    .email("admin@competition.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Compte administrateur créé: admin@competition.com / admin123");
        }

        if (userRepository.findByEmail("global@competition.com").isEmpty()) {
            User global = User.builder()
                    .nom("Global")
                    .prenom("Manager")
                    .email("global@competition.com")
                    .password(passwordEncoder.encode("global123"))
                    .role(Role.GESTIONNAIRE_GLOBAL)
                    .build();
            userRepository.save(global);
            System.out.println("Compte gestionnaire global créé: global@competition.com / global123");
        }

        Centre defaultCentre = null;
        if (salleRepository.count() == 0) {
            List<Centre> centres = centreRepository.findAll();
            if (centres.isEmpty()) {
                Centre centreObj = Centre.builder()
                        .nom("Centre de Casablanca")
                        .ville("Casablanca")
                        .adresse("Maarif")
                        .telephone("0522000000")
                        .build();
                defaultCentre = centreRepository.save(centreObj);
                centres = List.of(defaultCentre);
                System.out.println("Centre par défaut créé: Centre de Casablanca");
            } else {
                defaultCentre = centres.get(0);
            }

            for (Centre centre : centres) {
                Salle salleA = Salle.builder()
                        .nom("Salle A")
                        .capacite(50)
                        .centre(centre)
                        .build();
                Salle salleB = Salle.builder()
                        .nom("Salle B")
                        .capacite(50)
                        .centre(centre)
                        .build();
                salleRepository.save(salleA);
                salleRepository.save(salleB);
                System.out.println("Salles (Salle A, Salle B) créées avec capacité de 50 pour le centre: " + centre.getNom());
            }
        } else {
            List<Centre> centres = centreRepository.findAll();
            if (!centres.isEmpty()) {
                defaultCentre = centres.get(0);
            }
        }

        if (defaultCentre != null && userRepository.findByEmail("local@competition.com").isEmpty()) {
            User local = User.builder()
                    .nom("Local")
                    .prenom("Manager")
                    .email("local@competition.com")
                    .password(passwordEncoder.encode("local123"))
                    .role(Role.GESTIONNAIRE_LOCAL)
                    .centre(defaultCentre)
                    .build();
            userRepository.save(local);
            System.out.println("Compte gestionnaire local créé: local@competition.com / local123 (Rattaché à " + defaultCentre.getNom() + ")");
        }
    }
}
