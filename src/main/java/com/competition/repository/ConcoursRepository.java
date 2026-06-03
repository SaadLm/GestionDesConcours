package com.competition.repository;

import com.competition.model.Concours;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConcoursRepository extends JpaRepository<Concours, Long> { }