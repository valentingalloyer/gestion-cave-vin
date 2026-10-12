package com.beaupapa.gestioncave.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Appelé toutes les 5 minutes de 10 h à 1 h par un job cron-job.org
 * pour que Render n'endorme pas le serveur.
 * Ne touche volontairement pas à la base : Neon doit pouvoir se mettre en veille.
 */
@RestController
public class PingController {

    @GetMapping("/api/ping")
    public String ping() {
        return "pong";
    }
}
