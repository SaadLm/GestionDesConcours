package com.competition.gestion_concours;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.competition.repository")
@EntityScan(basePackages = "com.competition.model")
@ComponentScan(basePackages = "com.competition")
public class GestionConcoursApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestionConcoursApplication.class, args);
	}

}
