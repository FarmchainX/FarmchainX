package com.farmchainx.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuration class to load environment variables from .env file
 * Supports multiple locations for .env file
 */
@Configuration
public class EnvConfig {
    static {
        // Try to load .env from multiple possible locations
        String[] possibleLocations = {
            "backend/.env",           // From project root
            ".env",                   // Current directory
            "./backend/.env"          // Relative path
        };

        Dotenv dotenv = null;
        
        for (String location : possibleLocations) {
            Path path = Paths.get(location);
            if (Files.exists(path)) {
                System.out.println("[EnvConfig] Found .env at: " + path.toAbsolutePath());
                dotenv = Dotenv.configure()
                        .directory(path.getParent().toString())
                        .filename(".env")
                        .ignoreIfMissing()
                        .load();
                break;
            }
        }

        // If still not found, try loading from classpath
        if (dotenv == null) {
            dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
        }

        // Load all environment variables from .env into System properties
        if (dotenv != null) {
            dotenv.entries().forEach(entry -> {
                String key = entry.getKey();
                String value = entry.getValue();
                if (System.getenv(key) == null && System.getProperty(key) == null) {
                    System.setProperty(key, value);
                    System.out.println("[EnvConfig] Loaded: " + key);
                }
            });
        } else {
            System.out.println("[EnvConfig] Warning: No .env file found, using defaults");
        }
    }
}

