package com.beaupapa.gestioncave.controller;

import com.beaupapa.gestioncave.entity.Vin;
import com.beaupapa.gestioncave.repository.UserRepository;
import com.beaupapa.gestioncave.repository.VinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Chaque utilisateur ne voit et ne modifie que les vins de sa propre cave.
 * Le principal injecté est l'id de l'utilisateur (voir JwtAuthFilter).
 */
@RestController
@RequestMapping("/api/vins")
public class VinController {

    @Autowired
    private VinRepository vinRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Vin> getMesVins(@AuthenticationPrincipal Long userId) {
        return vinRepository.findByUserId(userId);
    }

    @PostMapping
    public Vin addVin(@AuthenticationPrincipal Long userId, @RequestBody Vin vin) {
        vin.setId(null);
        vin.setUser(userRepository.getReferenceById(userId));
        return vinRepository.save(vin);
    }

    @DeleteMapping("/{id}")
    public void deleteVin(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        vinRepository.delete(trouverVin(id, userId));
    }

    @PutMapping("/{id}")
    public Vin updateVin(@AuthenticationPrincipal Long userId, @PathVariable Long id, @RequestBody Vin vinDetails) {
        Vin vin = trouverVin(id, userId);

        vin.setQuantite(vinDetails.getQuantite());

        return vinRepository.save(vin);
    }

    private Vin trouverVin(Long id, Long userId) {
        return vinRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vin non trouvé"));
    }
}
