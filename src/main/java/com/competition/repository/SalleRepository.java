package com.competition.repository;

import com.competition.model.Salle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface SalleRepository extends JpaRepository<Salle, Long> {
    @Query("SELECT s FROM Salle s LEFT JOIN FETCH s.centre LEFT JOIN FETCH s.specialite")
    List<Salle> findAllWithCentreAndSpecialite();

    @Query("SELECT s FROM Salle s LEFT JOIN FETCH s.centre LEFT JOIN FETCH s.specialite WHERE s.centre.id = :centreId")
    List<Salle> findByCentreIdWithCentreAndSpecialite(@Param("centreId") Long centreId);

    List<Salle> findByCentreId(Long centreId);
    List<Salle> findByCentreIdAndSpecialiteId(Long centreId, Long specialiteId);
}
