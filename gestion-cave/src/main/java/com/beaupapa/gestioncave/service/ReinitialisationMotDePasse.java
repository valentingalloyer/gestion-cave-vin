package com.beaupapa.gestioncave.service;

import com.beaupapa.gestioncave.entity.User;
import com.beaupapa.gestioncave.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Mot de passe oublié : l'administrateur renseigne REINITIALISER_UTILISATEUR et REINITIALISER_MOT_DE_PASSE
 * sur Render ; au démarrage, ce mot de passe est imposé au compte.
 *
 * Render redémarre le serveur à chaque réveil : chaque valeur n'est donc appliquée qu'UNE fois
 * (on en garde le hash dans derniereReinitialisation). Sinon, un mot de passe changé ensuite
 * par l'utilisateur serait écrasé au redémarrage suivant si les variables étaient restées en place.
 */
@Slf4j
@Component
public class ReinitialisationMotDePasse implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public ReinitialisationMotDePasse(UserRepository userRepository,
                                      PasswordEncoder passwordEncoder,
                                      @Value("${app.reinitialisation.utilisateur:}") String username,
                                      @Value("${app.reinitialisation.mot-de-passe:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username.trim();
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (username.isEmpty() || password.isEmpty()) return;

        if (password.length() < AuthService.LONGUEUR_MIN_MOT_DE_PASSE) {
            log.warn("REINITIALISER_MOT_DE_PASSE trop court (minimum {} caractères) : rien n'est changé",
                    AuthService.LONGUEUR_MIN_MOT_DE_PASSE);
            return;
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            log.warn("REINITIALISER_UTILISATEUR : aucun compte '{}', rien n'est changé", username);
            return;
        }

        String dejaAppliquee = user.getDerniereReinitialisation();
        if (dejaAppliquee != null && passwordEncoder.matches(password, dejaAppliquee)) {
            log.info("Réinitialisation du mot de passe de '{}' déjà appliquée : variables REINITIALISER_* à retirer de Render", username);
            return;
        }

        user.setPassword(passwordEncoder.encode(password));
        user.setDerniereReinitialisation(passwordEncoder.encode(password));
        userRepository.save(user);
        log.info("Mot de passe de '{}' réinitialisé. Les variables REINITIALISER_* peuvent être retirées de Render", username);
    }
}
