package com.beaupapa.gestioncave.repository;

import com.beaupapa.gestioncave.entity.User;
import com.beaupapa.gestioncave.entity.Vin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VinRepository extends JpaRepository<Vin, Long> {

    @Query("select v from Vin v where v.user.id = :id")
    List<Vin> findByUserId(@Param("id") Long id);

    @Query("select v from Vin v where v.id = :id and v.user.id = :userId")
    Optional<Vin> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Modifying
    @Query("update Vin v set v.user = :user where v.user is null")
    int attribuerVinsSansProprietaire(@Param("user") User user);

}
