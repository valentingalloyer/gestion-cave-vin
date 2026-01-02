package com.beaupapa.gestioncave.repository;

import com.beaupapa.gestioncave.entity.Vin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VinRepository extends JpaRepository<Vin, Long> {
}