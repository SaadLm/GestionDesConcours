package com.competition.service;

import com.competition.dto.UserDto;
import com.competition.exception.BusinessException;
import com.competition.model.Centre;
import com.competition.model.Role;
import com.competition.model.User;
import com.competition.repository.CentreRepository;
import com.competition.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CentreRepository centreRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur non trouvé avec l'id : " + id));
    }

    @Transactional
    public User createUser(UserDto dto) {
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new BusinessException("Cet email est déjà utilisé par un autre utilisateur.");
        }

        Centre centre = null;
        if (dto.getRole() == Role.GESTIONNAIRE_LOCAL) {
            if (dto.getCentreId() == null) {
                throw new BusinessException("Un gestionnaire local doit obligatoirement être affecté à un centre.");
            }
            centre = centreRepository.findById(dto.getCentreId())
                    .orElseThrow(() -> new BusinessException("Centre spécifié non trouvé."));
        }

        if (dto.getPassword() == null || dto.getPassword().trim().isEmpty()) {
            throw new BusinessException("Le mot de passe est obligatoire pour la création d'un utilisateur.");
        }

        User user = User.builder()
                .nom(dto.getNom())
                .prenom(dto.getPrenom())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .role(dto.getRole())
                .centre(centre)
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(Long id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur non trouvé avec l'id : " + id));

        if (!user.getEmail().equalsIgnoreCase(dto.getEmail())) {
            if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
                throw new BusinessException("Cet email est déjà utilisé par un autre utilisateur.");
            }
        }

        Centre centre = null;
        if (dto.getRole() == Role.GESTIONNAIRE_LOCAL) {
            if (dto.getCentreId() == null) {
                throw new BusinessException("Un gestionnaire local doit obligatoirement être affecté à un centre.");
            }
            centre = centreRepository.findById(dto.getCentreId())
                    .orElseThrow(() -> new BusinessException("Centre spécifié non trouvé."));
        }

        user.setNom(dto.getNom());
        user.setPrenom(dto.getPrenom());
        user.setEmail(dto.getEmail());
        user.setRole(dto.getRole());
        user.setCentre(centre); // Will be null if role is ADMIN or GESTIONNAIRE_GLOBAL

        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Utilisateur non trouvé avec l'id : " + id));
        userRepository.delete(user);
    }
}
