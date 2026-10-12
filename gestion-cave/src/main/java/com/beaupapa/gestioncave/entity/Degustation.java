package com.beaupapa.gestioncave.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;

/**
 * Une bouteille ouverte : quand, à quelle occasion, et ce qu'on en a pensé.
 * Le vin est recopié (nom, domaine, millésime...) pour que le journal reste complet
 * même si la référence est supprimée de la cave une fois toutes ses bouteilles bues.
 */
@Entity
@Table(name = "degustations")
@Data
public class Degustation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Référence d'origine dans la cave ; peut ne plus exister
    private Long vinId;

    private String nom;
    private String domaine;
    private Integer millesime;
    private String couleur;
    private String appellation;

    private LocalDate date;
    private String occasion;
    private Integer note; // Note sur 5

    @Column(length = 1000)
    private String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;
}
