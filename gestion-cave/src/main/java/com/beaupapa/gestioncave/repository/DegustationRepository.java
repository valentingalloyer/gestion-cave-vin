package com.beaupapa.gestioncave.repository;

import com.beaupapa.gestioncave.entity.Degustation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DegustationRepository extends JpaRepository<Degustation, Long> {

    // La plus récente en premier
    @Query("select d from Degustation d where d.user.id = :userId order by d.date desc, d.id desc")
    List<Degustation> findByUserId(@Param("userId") Long userId);

    @Query("select d from Degustation d where d.id = :id and d.user.id = :userId")
    Optional<Degustation> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
