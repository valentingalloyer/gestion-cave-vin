package com.beaupapa.gestioncave.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "vins")
@Data
public class Vin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom;
    private String domaine;
    private int millesime;
    private String couleur; // "Rouge", "Blanc", "Rosé"
    private int quantite;
    private String emplacement;

    // Années conseillées pour la dégustation
    private int apogeeDebut;
    private int apogeeFin;

    @Column(length = 1000)
    private String notePersonnelle;
}