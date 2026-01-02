package com.beaupapa.gestioncave.controller;

import com.beaupapa.gestioncave.entity.Vin;
import com.beaupapa.gestioncave.repository.VinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vins")
@CrossOrigin(origins = { "http://localhost:4200", "https://gestion-cave-vin.vercel.app/" })
public class VinController {

    @Autowired
    private VinRepository vinRepository;

    @GetMapping
    public List<Vin> getAllVins() {
        return vinRepository.findAll();
    }

    @PostMapping
    public Vin addVin(@RequestBody Vin vin) {
        return vinRepository.save(vin);
    }

    @DeleteMapping("/{id}")
    public void deleteVin(@PathVariable Long id) {
        vinRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public Vin updateVin(@PathVariable Long id, @RequestBody Vin vinDetails) {
        Vin vin = vinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vin non trouvé"));

        vin.setQuantite(vinDetails.getQuantite());

        return vinRepository.save(vin);
    }
}