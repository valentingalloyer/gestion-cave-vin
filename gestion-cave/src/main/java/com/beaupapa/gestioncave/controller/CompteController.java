package com.beaupapa.gestioncave.controller;

import com.beaupapa.gestioncave.service.AuthService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Actions sur le compte de l'utilisateur connecté
 */
@RestController
@RequestMapping("/api/compte")
public class CompteController {

    @Autowired
    private AuthService authService;

    @PutMapping("/mot-de-passe")
    public ResponseEntity<Void> changerMotDePasse(@AuthenticationPrincipal Long userId,
                                                  @RequestBody ChangementMotDePasse demande) {
        authService.changerMotDePasse(userId, demande.getAncien(), demande.getNouveau());
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class ChangementMotDePasse {
        private String ancien;
        private String nouveau;
    }
}
