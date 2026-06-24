package com.competition.controller;

import com.competition.dto.ApiResponse;
import com.competition.dto.UserDto;
import com.competition.model.User;
import com.competition.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.<List<User>>builder()
                .success(true)
                .message("Liste des utilisateurs récupérée avec succès.")
                .data(users)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.<User>builder()
                .success(true)
                .message("Utilisateur récupéré avec succès.")
                .data(user)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<User>> createUser(@RequestBody UserDto dto) {
        User user = userService.createUser(dto);
        return ResponseEntity.ok(ApiResponse.<User>builder()
                .success(true)
                .message("Utilisateur créé avec succès.")
                .data(user)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable Long id, @RequestBody UserDto dto) {
        User user = userService.updateUser(id, dto);
        return ResponseEntity.ok(ApiResponse.<User>builder()
                .success(true)
                .message("Utilisateur mis à jour avec succès.")
                .data(user)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Utilisateur supprimé avec succès.")
                .build());
    }
}
