package com.beaupapa.gestioncave.service;

import com.beaupapa.gestioncave.entity.User;
import com.beaupapa.gestioncave.repository.UserRepository;
import com.beaupapa.gestioncave.repository.VinRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Les inscriptions sont fermées : le compte du propriétaire de la cave est créé au démarrage
 * à partir des variables d'environnement, puis récupère les vins qui n'ont pas encore de propriétaire
 * (ceux créés avant l'ajout de l'authentification).
 */
@Slf4j
@Component
public class InitialisationProprietaire implements ApplicationRunner {

    private final UserRepository userRepository;
    private final VinRepository vinRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public InitialisationProprietaire(UserRepository userRepository,
                                      VinRepository vinRepository,
                                      PasswordEncoder passwordEncoder,
                                      @Value("${app.proprietaire.username:}") String username,
                                      @Value("${app.proprietaire.password:}") String password) {
        this.userRepository = userRepository;
        this.vinRepository = vinRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username.trim();
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (username.isEmpty()) {
            log.warn("PROPRIETAIRE_USERNAME non défini : aucun compte propriétaire initialisé");
            return;
        }

        Optional<User> existant = userRepository.findByUsername(username);
        User proprietaire;

        if (existant.isPresent()) {
            proprietaire = existant.get();
        } else if (password.length() >= 6) {
            proprietaire = new User();
            proprietaire.setUsername(username);
            proprietaire.setPassword(passwordEncoder.encode(password));
            proprietaire = userRepository.save(proprietaire);
            log.info("Compte propriétaire '{}' créé", username);
        } else {
            log.warn("Compte '{}' inexistant et PROPRIETAIRE_PASSWORD absent (ou < 6 caractères) : rien n'est créé", username);
            return;
        }

        int recuperes = vinRepository.attribuerVinsSansProprietaire(proprietaire);
        if (recuperes > 0) {
            log.info("{} vin(s) sans propriétaire attribué(s) à '{}'", recuperes, username);
        }
    }
}
