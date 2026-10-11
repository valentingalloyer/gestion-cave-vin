package com.beaupapa.gestioncave.controller;

import com.beaupapa.gestioncave.service.AuthService;
import com.beaupapa.gestioncave.service.AuthService.AuthResponse;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Pas d'inscription publique : le compte du propriétaire est créé au démarrage
 * (voir InitialisationProprietaire).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest.getUsername(), loginRequest.getPassword())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }
}
