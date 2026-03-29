package com.farmchainx.farmer;

import com.farmchainx.auth.User;
import com.farmchainx.auth.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/farmer/settings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FarmerSettingsController {

    private final FarmerHelperService farmerHelperService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FarmerProfileRepository farmerProfileRepository;

    @GetMapping
    public ResponseEntity<SettingsResponse> getSettings(Authentication authentication) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        User user = farmer.getUser();

        SettingsResponse dto = new SettingsResponse();
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setDisplayName(farmer.getDisplayName());

        dto.setFarmName(farmer.getFarmName());
        dto.setFarmLocation(farmer.getFarmLocation());
        dto.setFarmDescription(farmer.getFarmDescription());

        dto.setAccountHolderName(farmer.getAccountHolderName());
        dto.setBankAccountNumber(farmer.getBankAccountNumber());
        dto.setBankIfsc(farmer.getBankIfsc());
        dto.setBankName(farmer.getBankName());

        dto.setLanguage(farmer.getLanguage());
        dto.setTimeZone(farmer.getTimeZone());
        dto.setNotifyOrderUpdates(farmer.isNotifyOrderUpdates());
        dto.setNotifyRiskAlerts(farmer.isNotifyRiskAlerts());
        dto.setProfileImageUrl(farmer.getProfileImageUrl());

        return ResponseEntity.ok(dto);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<Void> updateSettings(
            Authentication authentication,
            @Valid @RequestBody SettingsUpdateRequest request
    ) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        User user = farmer.getUser();

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());

        farmer.setDisplayName(request.getDisplayName());
        farmer.setFarmName(request.getFarmName());
        farmer.setFarmLocation(request.getFarmLocation());
        farmer.setFarmDescription(request.getFarmDescription());

        farmer.setAccountHolderName(request.getAccountHolderName());
        farmer.setBankAccountNumber(request.getBankAccountNumber());
        farmer.setBankIfsc(request.getBankIfsc());
        farmer.setBankName(request.getBankName());

        farmer.setLanguage(request.getLanguage());
        farmer.setTimeZone(request.getTimeZone());
        farmer.setNotifyOrderUpdates(request.isNotifyOrderUpdates());
        farmer.setNotifyRiskAlerts(request.isNotifyRiskAlerts());
        if (request.getProfileImageUrl() != null) {
            farmer.setProfileImageUrl(request.getProfileImageUrl());
        }

        userRepository.save(user);
        farmerProfileRepository.save(farmer);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        FarmerProfile farmer = farmerHelperService.getFarmerByEmail(authentication.getName());
        User user = farmer.getUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class SettingsResponse {
        private String fullName;
        private String email;
        private String phone;
        private String displayName;

        private String farmName;
        private String farmLocation;
        private String farmDescription;

        private String accountHolderName;
        private String bankAccountNumber;
        private String bankIfsc;
        private String bankName;

        private String language;
        private String timeZone;
        private boolean notifyOrderUpdates;
        private boolean notifyRiskAlerts;
        private String profileImageUrl;
    }

    @Data
    public static class SettingsUpdateRequest {
        @NotBlank
        private String fullName;

        @NotBlank
        private String phone;

        private String displayName;
        private String farmName;
        private String farmLocation;
        private String farmDescription;

        private String accountHolderName;
        private String bankAccountNumber;
        private String bankIfsc;
        private String bankName;

        private String language;
        private String timeZone;
        private boolean notifyOrderUpdates;
        private boolean notifyRiskAlerts;
        private String profileImageUrl;
    }

    @Data
    public static class PasswordChangeRequest {
        @NotBlank
        private String currentPassword;

        @NotBlank
        private String newPassword;
    }
}

