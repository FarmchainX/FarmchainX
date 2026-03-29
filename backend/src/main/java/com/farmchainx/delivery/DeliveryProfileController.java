package com.farmchainx.delivery;

import com.farmchainx.auth.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/delivery/profile")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY_PARTNER')")
public class DeliveryProfileController {

    private final DeliveryHelperService helperService;
    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile(Authentication authentication) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                select u.full_name as fullName, u.email as email, u.phone as phone,
                       d.vehicle_type as vehicleType, d.vehicle_number as vehicleNumber,
                       d.license_number as licenseNumber, d.bank_account_number as bankAccountNumber,
                       d.bank_ifsc as bankIfsc, d.bank_name as bankName, d.emergency_contact as emergencyContact,
                       d.profile_image_url as profileImageUrl, d.online as online
                from delivery_partner_profiles d
                join users u on d.user_id = u.id
                where d.id = ?
                """,
                partner.profileId()
        );

        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @PutMapping
    public ResponseEntity<Void> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        var partner = helperService.getOrCreatePartner(authentication.getName());

        jdbcTemplate.update(
                "update users set full_name = ?, phone = ? where id = ?",
                request.getFullName(),
                request.getPhone(),
                partner.userId()
        );

        jdbcTemplate.update(
                """
                update delivery_partner_profiles
                set vehicle_type = ?, vehicle_number = ?, license_number = ?,
                    bank_account_number = ?, bank_ifsc = ?, bank_name = ?, emergency_contact = ?,
                    profile_image_url = ?
                where id = ?
                """,
                request.getVehicleType(),
                request.getVehicleNumber(),
                request.getLicenseNumber(),
                request.getBankAccountNumber(),
                request.getBankIfsc(),
                request.getBankName(),
                request.getEmergencyContact(),
                request.getProfileImageUrl(),
                partner.profileId()
        );

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(
            Authentication authentication,
            @Valid @RequestBody UpdatePasswordRequest request
    ) {
        var partner = helperService.getOrCreatePartner(authentication.getName());
        var user = userRepository.findById(partner.userId()).orElseThrow(() -> new IllegalStateException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().build();
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class UpdateProfileRequest {
        private String fullName;
        private String phone;
        private String vehicleType;
        private String vehicleNumber;
        private String licenseNumber;
        private String bankAccountNumber;
        private String bankIfsc;
        private String bankName;
        private String emergencyContact;
        private String profileImageUrl;
    }

    @Data
    public static class UpdatePasswordRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank
        private String newPassword;
    }
}

