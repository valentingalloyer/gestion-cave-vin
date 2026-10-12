package com.beaupapa.gestioncave.controller;

import com.beaupapa.gestioncave.entity.Degustation;
import com.beaupapa.gestioncave.service.DegustationService;
import com.beaupapa.gestioncave.service.DegustationService.NouvelleDegustation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Journal de dégustation de l'utilisateur connecté
 */
@RestController
@RequestMapping("/api/degustations")
public class DegustationController {

    @Autowired
    private DegustationService degustationService;

    @GetMapping
    public List<Degustation> lister(@AuthenticationPrincipal Long userId) {
        return degustationService.lister(userId);
    }

    @PostMapping
    public Degustation ouvrirBouteille(@AuthenticationPrincipal Long userId, @RequestBody NouvelleDegustation demande) {
        return degustationService.ouvrirBouteille(userId, demande);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        degustationService.supprimer(userId, id);
        return ResponseEntity.noContent().build();
    }
}
