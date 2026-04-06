package com.beaupapa.gestioncave.entity;

import jakarta.persistence.*;
import lombok.Data;
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

    private String password;

    // Un utilisateur peut avoir plusieurs vins
    @OneToMany(mappedBy = "user")
    private List<Vin> vins;
}