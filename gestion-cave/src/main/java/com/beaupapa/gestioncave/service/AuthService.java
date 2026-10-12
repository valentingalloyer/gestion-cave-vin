package com.beaupapa.gestioncave.service;

import com.beaupapa.gestioncave.entity.User;
import com.beaupapa.gestioncave.repository.UserRepository;
import com.beaupapa.gestioncave.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public record AuthResponse(String token, String username) {}

    @Transactional
    public Optional<AuthResponse> login(String username, String password) {
        if (username == null || password == null) return Optional.empty();

        return userRepository.findByUsername(username.trim())
                .filter(user -> verifierMotDePasse(user, password))
                .map(user -> new AuthResponse(jwtService.genererToken(user), user.getUsername()));
    }

    public static final int LONGUEUR_MIN_MOT_DE_PASSE = 4;

    @Transactional
    public void changerMotDePasse(Long userId, String ancien, String nouveau) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        if (ancien == null || !verifierMotDePasse(user, ancien)) {
            // 403 et non 401 : un 401 déconnecterait l'utilisateur côté front
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mot de passe actuel incorrect");
        }
        if (nouveau == null || nouveau.length() < LONGUEUR_MIN_MOT_DE_PASSE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le nouveau mot de passe doit faire au moins " + LONGUEUR_MIN_MOT_DE_PASSE + " caractères");
        }

        user.setPassword(passwordEncoder.encode(nouveau));
        userRepository.save(user);
    }

    private boolean verifierMotDePasse(User user, String password) {
        String stocke = user.getPassword();
        if (stocke == null) return false;

        // Comptes créés avant le passage à BCrypt : mot de passe en clair, qu'on hashe au passage
        if (!stocke.startsWith("$2")) {
            if (!stocke.equals(password)) return false;
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
            return true;
        }

        return passwordEncoder.matches(password, stocke);
    }
}
