package com.beaupapa.gestioncave.repository;

import com.beaupapa.gestioncave.entity.Vin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VinRepository extends JpaRepository<Vin, Long> {

    @Query("select v from Vin v where v.user.id = :id")
    List<Vin> findByUserId(@Param("id") Long id);

}