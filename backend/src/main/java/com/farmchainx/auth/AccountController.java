package com.farmchainx.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AccountController {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    @DeleteMapping("/me")
    @Transactional
    public ResponseEntity<?> deleteMyAccount(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByEmail(authentication.getName().trim().toLowerCase())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User account not found."));
        }

        if (user.getRole() == RoleType.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Delete account is not available for admin portal."));
        }

        if (user.getRole() != RoleType.FARMER
                && user.getRole() != RoleType.CUSTOMER
                && user.getRole() != RoleType.DELIVERY_PARTNER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Delete account is not available for this role."));
        }

        user.setEnabled(false);
        userRepository.save(user);

        // Mark delivery partner offline if profile exists.
        if (user.getRole() == RoleType.DELIVERY_PARTNER) {
            jdbcTemplate.update("update delivery_partner_profiles set online = false where user_id = ?", user.getId());
        }

        return ResponseEntity.ok(Map.of("message", "Your account has been deleted successfully."));
    }
}

