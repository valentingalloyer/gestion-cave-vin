package com.beaupapa.gestioncave.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.util.List;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true)
    private String email;

    // Hash BCrypt, jamais renvoyé au front
    @JsonIgnore
    private String password;

    // Hash du dernier mot de passe imposé par REINITIALISER_MOT_DE_PASSE :
    // une même réinitialisation n'est appliquée qu'une fois (voir ReinitialisationMotDePasse)
    @JsonIgnore
    private String derniereReinitialisation;

    // Un utilisateur peut avoir plusieurs vins
    @OneToMany(mappedBy = "user")
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Vin> vins;
}
