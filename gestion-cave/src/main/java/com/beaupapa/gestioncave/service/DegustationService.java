package com.beaupapa.gestioncave.service;

import com.beaupapa.gestioncave.entity.Degustation;
import com.beaupapa.gestioncave.entity.Vin;
import com.beaupapa.gestioncave.repository.DegustationRepository;
import com.beaupapa.gestioncave.repository.UserRepository;
import com.beaupapa.gestioncave.repository.VinRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class DegustationService {

    private final DegustationRepository degustationRepository;
    private final VinRepository vinRepository;
    private final UserRepository userRepository;

    public DegustationService(DegustationRepository degustationRepository,
                              VinRepository vinRepository,
                              UserRepository userRepository) {
        this.degustationRepository = degustationRepository;
        this.vinRepository = vinRepository;
        this.userRepository = userRepository;
    }

    public record NouvelleDegustation(Long vinId, LocalDate date, String occasion, Integer note, String commentaire) {}

    public List<Degustation> lister(Long userId) {
        return degustationRepository.findByUserId(userId);
    }

    /**
     * Note l'ouverture d'une bouteille et la retire de la cave (sans descendre sous 0)
     */
    @Transactional
    public Degustation ouvrirBouteille(Long userId, NouvelleDegustation demande) {
        if (demande.vinId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vin manquant");
        }
        if (demande.note() != null && (demande.note() < 0 || demande.note() > 5)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La note doit être entre 0 et 5");
        }
        if (demande.commentaire() != null && demande.commentaire().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Commentaire trop long (1000 caractères maximum)");
        }

        Vin vin = vinRepository.findByIdAndUserId(demande.vinId(), userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vin non trouvé"));

        if (vin.getQuantite() > 0) {
            vin.setQuantite(vin.getQuantite() - 1);
            vinRepository.save(vin);
        }

        Degustation degustation = new Degustation();
        degustation.setUser(userRepository.getReferenceById(userId));
        degustation.setVinId(vin.getId());
        degustation.setNom(vin.getNom());
        degustation.setDomaine(vin.getDomaine());
        degustation.setMillesime(vin.getMillesime());
        degustation.setCouleur(vin.getCouleur());
        degustation.setAppellation(vin.getAppellation());
        degustation.setDate(demande.date() != null ? demande.date() : LocalDate.now());
        degustation.setOccasion(vide(demande.occasion()));
        degustation.setNote(demande.note() == null || demande.note() == 0 ? null : demande.note());
        degustation.setCommentaire(vide(demande.commentaire()));
        return degustationRepository.save(degustation);
    }

    /**
     * Retire une entrée du journal. La bouteille n'est pas remise en cave :
     * on utilise le bouton + de la liste si elle n'avait finalement pas été ouverte.
     */
    @Transactional
    public void supprimer(Long userId, Long id) {
        Degustation degustation = degustationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dégustation non trouvée"));
        degustationRepository.delete(degustation);
    }

    private static String vide(String texte) {
        return texte == null || texte.isBlank() ? null : texte.trim();
    }
}
