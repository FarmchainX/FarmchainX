package com.farmchainx.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

@Service
public class GoogleTokenVerifierService {

    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token={idToken}";

    private final String clientId;
    private final RestTemplate restTemplate = new RestTemplate();

    public GoogleTokenVerifierService(@Value("${google.oauth.client-id:}") String clientId) {
        this.clientId = clientId;
    }

    public VerifiedGoogleUser verify(String credential) {
        if (clientId == null || clientId.isBlank() || credential == null || credential.isBlank()) {
            return null;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> payload = restTemplate.getForObject(TOKEN_INFO_URL, Map.class, credential);
            if (payload == null) {
                return null;
            }

            String audience = String.valueOf(payload.get("aud"));
            String issuer = String.valueOf(payload.get("iss"));
            String email = String.valueOf(payload.get("email"));
            String name = String.valueOf(payload.get("name"));
            String exp = String.valueOf(payload.get("exp"));
            String emailVerified = String.valueOf(payload.get("email_verified"));

            boolean issuerValid = "accounts.google.com".equals(issuer)
                    || "https://accounts.google.com".equals(issuer);
            boolean audienceValid = clientId.equals(audience);
            boolean isEmailVerified = "true".equalsIgnoreCase(emailVerified);
            boolean notExpired = false;

            try {
                long expSeconds = Long.parseLong(exp);
                notExpired = expSeconds > Instant.now().getEpochSecond();
            } catch (NumberFormatException ignored) {
                return null;
            }

            if (!issuerValid || !audienceValid || !isEmailVerified || !notExpired || email == null || email.isBlank()) {
                return null;
            }

            return new VerifiedGoogleUser(email, name);
        } catch (RestClientException ignored) {
            return null;
        }
    }

    public record VerifiedGoogleUser(String email, String name) {}
}

