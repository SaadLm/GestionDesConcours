package com.competition.service;

import com.competition.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDirectory;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
        try {
            uploadDirectory = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadDirectory);
        } catch (IOException e) {
            throw new IllegalStateException("Impossible de préparer le répertoire des documents.", e);
        }
    }

    public String storePdf(MultipartFile file, String prefix) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Le document " + prefix + " est obligatoire.");
        }
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        if (!"application/pdf".equalsIgnoreCase(file.getContentType())
                && !originalName.toLowerCase().endsWith(".pdf")) {
            throw new BusinessException("Le document " + prefix + " doit être au format PDF.");
        }

        String storedName = prefix + "-" + UUID.randomUUID() + ".pdf";
        try {
            Files.copy(file.getInputStream(), uploadDirectory.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
            return storedName;
        } catch (IOException e) {
            throw new BusinessException("Impossible d'enregistrer le document " + prefix + ".");
        }
    }

    public Path resolve(String storedName) {
        Path path = uploadDirectory.resolve(storedName).normalize();
        if (!path.startsWith(uploadDirectory) || !Files.exists(path)) {
            throw new BusinessException("Document introuvable.");
        }
        return path;
    }
}
